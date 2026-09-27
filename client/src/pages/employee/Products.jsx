import { useEffect, useMemo, useState } from "react";
import { Package, X, Pencil, Trash2, Building2 } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import StatusBadge from "../../components/employee/StatusBadge";
import api from "../../services/api";

const PAGE_SIZE = 10;

// ── Venture Detail Side Panel ─────────────────────────────────────────────
function VentureDetailPanel({ venture, onClose, onEdit, onDelete }) {
  if (!venture) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{venture.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{venture.category || "Venture"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
              <Pencil size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-blue-600" /> Venture Details
            </h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Features</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{venture.features || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Price / Sq. Yd.</p>
                <p className="text-sm text-gray-900">{venture.pricePerSqYard ? `₹${Number(venture.pricePerSqYard).toLocaleString("en-IN")}` : (venture.unitPrice ? `₹${Number(venture.unitPrice).toLocaleString("en-IN")}` : "—")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Acres</p>
                <p className="text-sm text-gray-900">{venture.totalAcres ? `${venture.totalAcres} Acres` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Booking Advance</p>
                <p className="text-sm text-gray-900">{venture.bookingAdvance ? `₹${Number(venture.bookingAdvance).toLocaleString("en-IN")}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">R/C</p>
                <p className="text-sm text-gray-900">{venture.rC || venture.r_c || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Month Launched</p>
                <p className="text-sm text-gray-900">{venture.monthLaunched || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [detailVenture, setDetailVenture] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({ 
    name: "", description: "", sku: "", category: "", unit_price: "", cost_price: "", is_active: true, photo_url: "",
    features: "", price_per_sq_yard: "", total_acres: "", booking_advance: "", r_c: "", month_launched: "" 
  });

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
    setForm({ 
      name: "", description: "", sku: "", category: "", unit_price: "", cost_price: "", is_active: true, photo_url: "",
      features: "", price_per_sq_yard: "", total_acres: "", booking_advance: "", r_c: "", month_launched: "" 
    });
    setActiveProduct(null); setModalOpen(true);
  }

  function openEdit(p) {
    setForm({ 
      name: p.name, description: p.description || "", sku: p.sku || "", category: p.category || "", unit_price: p.unitPrice, cost_price: p.costPrice || "", is_active: p.isActive, photo_url: p.photoUrl || "",
      features: p.features || "", price_per_sq_yard: p.pricePerSqYard || "", total_acres: p.totalAcres || "", booking_advance: p.bookingAdvance || "", r_c: p.rC || "", month_launched: p.monthLaunched || ""
    });
    setActiveProduct(p); setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { 
        ...form, 
        unit_price: Number(form.unit_price) || 0, cost_price: form.cost_price ? Number(form.cost_price) : null,
        price_per_sq_yard: form.price_per_sq_yard ? Number(form.price_per_sq_yard) : null,
        total_acres: form.total_acres ? Number(form.total_acres) : null,
        booking_advance: form.booking_advance ? Number(form.booking_advance) : null
      };
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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} products?`)) return;
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/employee/products/${id}`)));
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch { setError("Failed to bulk delete products"); }
    finally { setSaving(false); }
  };

  const inputClass = "mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <ListToolbar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); setSelectedIds([]); }}
        searchPlaceholder="Search by name, SKU, category..."
        addLabel="Add Product"
        onAddClick={openAdd}
        bulkActions={selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
            {saving ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
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
                <th className="px-6 py-3 font-medium">
                  <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    checked={pageItems.length > 0 && selectedIds.length === pageItems.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? pageItems.map(p => p.id) : [])}
                  />
                </th>
                <th className="px-6 py-3 font-medium">S.No.</th>
                <th className="px-6 py-3 font-medium">Venture Name</th>
                <th className="px-6 py-3 font-medium">Features</th>
                <th className="px-6 py-3 font-medium">Price / Sq. Yd.</th>
                <th className="px-6 py-3 font-medium">Total Acres</th>
                <th className="px-6 py-3 font-medium">Booking Advance</th>
                <th className="px-6 py-3 font-medium">R/C</th>
                <th className="px-6 py-3 font-medium">Pub Month Launched</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer group" onClick={(e) => {
                  if (e.target.closest('td:last-child') || e.target.closest('td:first-child')) return;
                  setDetailVenture(p);
                }}>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 truncate max-w-[150px]">{p.features || "—"}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.pricePerSqYard ? `₹${Number(p.pricePerSqYard).toLocaleString("en-IN")}` : (p.unitPrice ? `₹${Number(p.unitPrice).toLocaleString("en-IN")}` : "—")}</td>
                  <td className="px-6 py-4 text-gray-600">{p.totalAcres ? `${p.totalAcres} Acres` : "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{p.bookingAdvance ? `₹${Number(p.bookingAdvance).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{p.rC || p.r_c || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{p.monthLaunched || "—"}</td>
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
              <label className="text-xs font-medium text-gray-500">Photo URL</label>
              <input value={form.photo_url} onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))} placeholder="https://..." className={inputClass} />
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
              <label className="text-xs font-medium text-gray-500">Features</label>
              <textarea rows={2} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                className={`${inputClass} resize-none`} placeholder="Detailed features (no word limit)" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Price/sq yard (₹)</label>
              <input type="number" min="0" step="0.01" value={form.price_per_sq_yard} onChange={e => setForm(p => ({ ...p, price_per_sq_yard: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Total Acres</label>
              <input type="number" min="0" step="0.01" value={form.total_acres} onChange={e => setForm(p => ({ ...p, total_acres: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Booking Advance (₹)</label>
              <input type="number" min="0" step="0.01" value={form.booking_advance} onChange={e => setForm(p => ({ ...p, booking_advance: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">R/C</label>
              <input value={form.r_c} onChange={e => setForm(p => ({ ...p, r_c: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Month Launched</label>
              <input value={form.month_launched} onChange={e => setForm(p => ({ ...p, month_launched: e.target.value }))} placeholder="e.g. Oct 2026" className={inputClass} />
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

      <VentureDetailPanel 
        venture={detailVenture} 
        onClose={() => setDetailVenture(null)}
        onEdit={() => { setDetailVenture(null); openEdit(detailVenture); }}
        onDelete={() => { setDetailVenture(null); setDeleteTarget(detailVenture); }}
      />
    </div>
  );
}

export default Products;
