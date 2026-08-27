import { useEffect, useState } from "react";
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";
import Modal from "../../components/employee/Modal";
import StatusBadge from "../../components/employee/StatusBadge";
import EmptyState from "../../components/employee/EmptyState";
import api from "../../services/api";

const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired"];

function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [form, setForm] = useState({ customer_id: "", deal_id: "", valid_until: "", notes: "", discount_amount: "0", tax_amount: "0", line_items: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/employee/quotes"),
      api.get("/employee/products/all"),
      api.get("/employee/customers?limit=200"),
      api.get("/employee/deals?limit=200"),
    ]).then(([qRes, pRes, cRes, dRes]) => {
      setQuotes(qRes.data.data || []);
      setProducts(pRes.data.data || []);
      setCustomers(cRes.data.data || []);
      setDeals(dRes.data.data || []);
    }).catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setForm({ customer_id: "", deal_id: "", valid_until: "", notes: "", discount_amount: "0", tax_amount: "0", line_items: [{ product_id: "", description: "", quantity: 1, unit_price: "", discount_percent: 0 }] });
    setModalOpen(true);
  }

  function addLine() {
    setForm(p => ({ ...p, line_items: [...p.line_items, { product_id: "", description: "", quantity: 1, unit_price: "", discount_percent: 0 }] }));
  }

  function removeLine(i) {
    setForm(p => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }));
  }

  function updateLine(i, field, value) {
    setForm(p => {
      const lines = [...p.line_items];
      lines[i] = { ...lines[i], [field]: value };
      // Auto-fill price from product
      if (field === "product_id" && value) {
        const prod = products.find(pr => pr.id === parseInt(value));
        if (prod) { lines[i].unit_price = prod.unitPrice; lines[i].description = prod.name; }
      }
      return { ...p, line_items: lines };
    });
  }

  function calcLineTotal(line) {
    return Number(line.quantity || 1) * Number(line.unit_price || 0) * (1 - Number(line.discount_percent || 0) / 100);
  }

  function calcTotal() {
    const sub = form.line_items.reduce((s, l) => s + calcLineTotal(l), 0);
    return sub - Number(form.discount_amount || 0) + Number(form.tax_amount || 0);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, line_items: form.line_items.filter(l => l.unit_price) };
      const res = await api.post("/employee/quotes", payload);
      setQuotes(prev => [res.data.data, ...prev]);
      setModalOpen(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to create quote"); }
    finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    try {
      const res = await api.put(`/employee/quotes/${id}`, { status });
      setQuotes(prev => prev.map(q => q.id === id ? res.data.data : q));
      if (viewQuote?.id === id) setViewQuote(res.data.data);
    } catch { setError("Failed to update quote status"); }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await api.delete(`/employee/quotes/${deleteTarget.id}`);
      setQuotes(prev => prev.filter(q => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setError("Failed to delete quote"); }
    finally { setSaving(false); }
  }

  const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">{quotes.length} quotes</p>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Create Quote
        </button>
      </div>

      {error && <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading quotes...</div>
      ) : quotes.length === 0 ? (
        <EmptyState icon={FileText} title="No quotes yet" description="Create a quote to send to a customer." actionLabel="Create Quote" onAction={openAdd} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Quote #</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Valid Until</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => setViewQuote(q)} className="font-medium text-blue-600 hover:text-blue-700">{q.quoteNumber}</button>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{q.customerName || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge value={q.status} /></td>
                  <td className="px-6 py-4 font-semibold text-gray-900">₹{Number(q.totalAmount).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-500">{q.validUntil || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select value={q.status}
                        onChange={e => updateStatus(q.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white outline-none">
                        {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => setDeleteTarget(q)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Quote Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quote"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="quote-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Creating..." : "Create Quote"}
            </button>
          </>
        }>
        <form id="quote-form" onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Customer</label>
              <select value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
                className={`mt-1 ${inputClass}`}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Related Deal</label>
              <select value={form.deal_id} onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))}
                className={`mt-1 ${inputClass}`}>
                <option value="">Select deal (optional)</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                className={`mt-1 ${inputClass}`} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Line Items</label>
              <button type="button" onClick={addLine} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Plus size={12} /> Add line
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium w-2/5">Product / Description</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-medium">Qty</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-medium">Unit Price</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-medium">Disc%</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.line_items.map((line, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <select value={line.product_id} onChange={e => updateLine(i, "product_id", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-400 mb-1">
                          <option value="">Custom item</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input value={line.description} onChange={e => updateLine(i, "description", e.target.value)}
                          placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, "quantity", e.target.value)}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min="0" max="100" value={line.discount_percent} onChange={e => updateLine(i, "discount_percent", e.target.value)}
                          className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right outline-none focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">₹{calcLineTotal(line).toLocaleString("en-IN")}</td>
                      <td className="px-2 py-1.5">
                        {form.line_items.length > 1 && (
                          <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Discount (₹)</label>
              <input type="number" min="0" value={form.discount_amount} onChange={e => setForm(p => ({ ...p, discount_amount: e.target.value }))}
                className={`mt-1 ${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Tax (₹)</label>
              <input type="number" min="0" value={form.tax_amount} onChange={e => setForm(p => ({ ...p, tax_amount: e.target.value }))}
                className={`mt-1 ${inputClass}`} />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="text-sm font-semibold text-gray-900">Total: ₹{calcTotal().toLocaleString("en-IN")}</div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className={`mt-1 ${inputClass} resize-none`} placeholder="Optional notes" />
          </div>
        </form>
      </Modal>

      {/* View Quote Modal */}
      {viewQuote && (
        <Modal open={!!viewQuote} onClose={() => setViewQuote(null)} title={`Quote ${viewQuote.quoteNumber}`}
          footer={<button onClick={() => setViewQuote(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Close</button>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Customer:</span> <span className="font-medium">{viewQuote.customerName || "—"}</span></div>
              <div><span className="text-gray-400">Status:</span> <StatusBadge value={viewQuote.status} /></div>
              <div><span className="text-gray-400">Valid Until:</span> <span>{viewQuote.validUntil || "—"}</span></div>
              <div><span className="text-gray-400">Total:</span> <span className="font-bold text-gray-900">₹{Number(viewQuote.totalAmount).toLocaleString("en-IN")}</span></div>
            </div>
            {viewQuote.lineItems?.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Item</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Qty</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Price</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewQuote.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{item.description || item.product_name || "—"}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">₹{Number(item.unit_price).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-right font-medium">₹{Number(item.line_total).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {viewQuote.notes && <p className="text-sm text-gray-500 italic">{viewQuote.notes}</p>}
            <div className="flex gap-2 pt-2">
              {QUOTE_STATUSES.filter(s => s !== viewQuote.status).map(s => (
                <button key={s} onClick={() => updateStatus(viewQuote.id, s)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Mark as {s}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quote"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }>
        <p className="text-sm text-gray-600">Delete quote <strong>{deleteTarget?.quoteNumber}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default Quotes;
