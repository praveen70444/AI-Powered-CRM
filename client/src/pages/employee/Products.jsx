import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import StatusBadge from "../../components/employee/StatusBadge";
import api from "../../services/api";

const PAGE_SIZE = 10;

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", sku: "", category: "", unit_price: "", cost_price: "", is_active: true });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/employee/products?limit=200")
      .then(res => { if (mounted) setProducts(res.data.data || []); })
      .catch(() => { if (mounted) setError("Failed to load products"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    const matchActive = filterActive === "" ? true : filterActive === "active" ? p.isActive : !p.isActive;
    return matchSearch && matchActive;
  }), [products, search, filterActive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setForm({ name: "", description: "", sku: "", category: "", unit_price: "", cost_price: "", is_active: true });
    setActiveProduct(null); setModalOpen(true);
  }

  function openEdit(p) {
    setForm({ name: p.name, description: p.description || "", sku: p.sku || "", category: p.category || "", unit_price: p.unitPrice, cost_price: p.costPrice || "", is_active: p.isActive });
    setActiveProduct(p); setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, unit_price: Number(form.unit_price) || 0, cost_price: form.cost_price ? Number(form.cost_price) : null };
      if (activeProduct) {
        const res = await api.put(`/employee/products/${activeProduct.id}`, payload);
        setProducts(prev => prev.map(p => p.id === activeProduct.id ? res.data.data : p));
      } else {
        const res = await api.post("/employee/products", payload);
        setProducts(prev => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to save product"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await api.delete(`/employee/products/${deleteTarget.id}`);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setError("Failed to delete product"); }
    finally { setSaving(false); }
  }

  const inputClass = "mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <ListToolbar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, SKU, category..."
        addLabel="Add Product"
        onAddClick={openAdd}
        filters={
          <FilterSelect value={filterActive} onChange={v => { setFilterActive(v); setPage(1); }}
            options={["active", "inactive"]} allLabel="All" />
        }
      />
      {error && <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading products...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Add products to your catalog." actionLabel="Add Product" onAction={openAdd} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Unit Price</th>
                <th className="px-6 py-3 font-medium">Cost Price</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.sku || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{p.category || "—"}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">₹{Number(p.unitPrice).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-600">{p.costPrice ? `₹${Number(p.costPrice).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge value={p.isActive ? "Active" : "Inactive"} />
                  </td>
                  <td className="px-6 py-4">
                    <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeProduct ? "Edit Product" : "Add Product"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="product-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeProduct ? "Save Changes" : "Add Product"}
            </button>
          </>
        }>
        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Product Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">SKU</label>
              <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Software" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Unit Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} required className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Cost Price (₹)</label>
              <input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="Optional" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={`${inputClass} resize-none`} placeholder="Optional" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">Active (visible in dropdowns)</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }>
        <p className="text-sm text-gray-600">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default Products;
