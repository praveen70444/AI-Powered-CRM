import { useEffect, useMemo, useState } from "react";
import { Package, X, Pencil, Trash2, Building2, MapPin } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import StatusBadge from "../../components/employee/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const PAGE_SIZE = 10;

// ── Venture Detail Side Panel ─────────────────────────────────────────────
function VentureDetailPanel({ venture, onClose, onEdit, onDelete, canDelete }) {
  if (!venture) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{venture.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{venture.village ? `${venture.village} · ` : ""}{venture.category || "Real Estate Venture"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
              <Pencil size={15} />
            </button>
            {canDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                <Trash2 size={15} />
              </button>
            )}
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
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Village</p>
                <p className="text-sm text-gray-900 font-medium">{venture.village || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Min Plot Size</p>
                <p className="text-sm text-gray-900 font-medium">{venture.min_plot_size || venture.minPlotSize || "—"}</p>
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
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Status</p>
                <div className="mt-0.5"><StatusBadge value={venture.isActive ? "Active" : "Inactive"} /></div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Features</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{venture.features || "—"}</p>
              </div>
              {venture.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{venture.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ventures Component ────────────────────────────────────────────────
export default function Products() {
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailVenture, setDetailVenture] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", sku: "", category: "Venture", unit_price: "", cost_price: "",
    is_active: true, photo_url: "", features: "", price_per_sq_yard: "", total_acres: "",
    booking_advance: "", r_c: "", month_launched: "", village: "", min_plot_size: "",
  });

  useEffect(() => {
    let unmounted = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/employee/products", { params: { limit: 100 } });
        if (!unmounted) setProducts(res.data?.data || []);
      } catch (err) {
        if (!unmounted) setError(err.response?.data?.message || "Failed to load ventures");
      } finally {
        if (!unmounted) setLoading(false);
      }
    }
    load();
    return () => { unmounted = true; };
  }, []);

  const villages = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.village) set.add(p.village); });
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (filterActive === "active" && !p.isActive) return false;
      if (filterActive === "inactive" && p.isActive) return false;
      if (villageFilter && p.village !== villageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match = (
          p.name?.toLowerCase().includes(q) ||
          p.village?.toLowerCase().includes(q) ||
          p.min_plot_size?.toLowerCase().includes(q) ||
          p.features?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [products, search, filterActive, villageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  function openAdd() {
    setActiveProduct(null);
    setForm({
      name: "", description: "", sku: "", category: "Venture", unit_price: "", cost_price: "",
      is_active: true, photo_url: "", features: "", price_per_sq_yard: "", total_acres: "",
      booking_advance: "", r_c: "", month_launched: "", village: "", min_plot_size: "",
    });
    setModalOpen(true);
  }

  function openEdit(p) {
    setForm({
      name: p.name || "",
      description: p.description || "",
      sku: p.sku || "",
      category: p.category || "Venture",
      unit_price: p.unitPrice ?? "",
      cost_price: p.costPrice ?? "",
      is_active: p.isActive ?? true,
      photo_url: p.photoUrl || "",
      features: p.features || "",
      price_per_sq_yard: p.pricePerSqYard ?? "",
      total_acres: p.totalAcres ?? "",
      booking_advance: p.bookingAdvance ?? "",
      r_c: p.rC || p.r_c || "",
      month_launched: p.monthLaunched || "",
      village: p.village || "",
      min_plot_size: p.min_plot_size || p.minPlotSize || "",
    });
    setActiveProduct(p);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        unit_price: Number(form.unit_price) || 0,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        price_per_sq_yard: form.price_per_sq_yard ? Number(form.price_per_sq_yard) : null,
        total_acres: form.total_acres ? Number(form.total_acres) : null,
        booking_advance: form.booking_advance ? Number(form.booking_advance) : null,
        village: form.village.trim() || null,
        min_plot_size: form.min_plot_size.trim() || null,
      };

      if (activeProduct) {
        const res = await api.put(`/employee/products/${activeProduct.id}`, payload);
        setProducts(prev => prev.map(p => p.id === activeProduct.id ? res.data.data : p));
        if (detailVenture?.id === activeProduct.id) setDetailVenture(res.data.data);
      } else {
        const res = await api.post("/employee/products", payload);
        setProducts(prev => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save venture");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/employee/products/${deleteTarget.id}`);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete venture");
    } finally {
      setSaving(false);
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} ventures?`)) return;
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/employee/products/${id}`)));
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch {
      setError("Failed to bulk delete ventures");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Title & Toolbar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" /> Ventures
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Real Estate properties and projects catalog</p>
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); setSelectedIds([]); }}
        searchPlaceholder="Search ventures by name, village, features..."
        addLabel="Add Venture"
        onAddClick={openAdd}
        bulkActions={isOrgAdmin && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
            {saving ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
        filters={
          <>
            <FilterSelect value={filterActive} onChange={v => { setFilterActive(v); setPage(1); }}
              options={["active", "inactive"]} allLabel="All Statuses" />
            {villages.length > 0 && (
              <FilterSelect value={villageFilter} onChange={v => { setVillageFilter(v); setPage(1); }}
                options={villages} allLabel="All Villages" />
            )}
          </>
        }
      />

      {error && <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading ventures...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={Building2} title="No ventures found" description="Add real estate ventures to your catalog." actionLabel="Add Venture" onAction={openAdd} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                {isOrgAdmin && (
                  <th className="px-4 py-3 font-medium">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={pageItems.length > 0 && selectedIds.length === pageItems.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? pageItems.map(p => p.id) : [])}
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">S.No.</th>
                <th className="px-4 py-3 font-medium">Venture Name</th>
                <th className="px-4 py-3 font-medium">Village</th>
                <th className="px-4 py-3 font-medium">Min Plot Size</th>
                <th className="px-4 py-3 font-medium">Price / Sq. Yd.</th>
                <th className="px-4 py-3 font-medium">Total Acres</th>
                <th className="px-4 py-3 font-medium">Booking Advance</th>
                <th className="px-4 py-3 font-medium">R/C</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((p, i) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={(e) => {
                  if (e.target.closest('td:last-child') || e.target.closest('td:first-child')) return;
                  setDetailVenture(p);
                }}>
                  {isOrgAdmin && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                        }}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                    {p.features && <p className="text-xs text-gray-400 truncate max-w-xs">{p.features}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {p.village ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-800">
                        <MapPin size={11} className="text-blue-500" /> {p.village}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {p.min_plot_size || p.minPlotSize || "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {p.pricePerSqYard ? `₹${Number(p.pricePerSqYard).toLocaleString("en-IN")}` : (p.unitPrice ? `₹${Number(p.unitPrice).toLocaleString("en-IN")}` : "—")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.totalAcres ? `${p.totalAcres} Acres` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.bookingAdvance ? `₹${Number(p.bookingAdvance).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.rC || p.r_c || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge value={p.isActive ? "Active" : "Inactive"} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(p)}
                      onDelete={isOrgAdmin ? () => setDeleteTarget(p) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Add / Edit Venture Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeProduct ? "Edit Venture" : "Add Venture"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="venture-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeProduct ? "Save Changes" : "Create Venture"}
            </button>
          </>
        }>
        <form id="venture-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Venture Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Green Meadows Layout" className={inputClass} />
            </div>

            {/* B3: Village & Minimum Plot Size */}
            <div>
              <label className="text-xs font-medium text-gray-600">Village / Location</label>
              <input value={form.village} onChange={e => setForm(p => ({ ...p, village: e.target.value }))} placeholder="e.g. Anandapuram" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Minimum Plot Size</label>
              <input value={form.min_plot_size} onChange={e => setForm(p => ({ ...p, min_plot_size: e.target.value }))} placeholder="e.g. 150 Sq. Yd." className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Price / Sq. Yard (₹)</label>
              <input type="number" min="0" step="any" value={form.price_per_sq_yard} onChange={e => setForm(p => ({ ...p, price_per_sq_yard: e.target.value }))} placeholder="e.g. 15000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Total Acres</label>
              <input type="number" min="0" step="any" value={form.total_acres} onChange={e => setForm(p => ({ ...p, total_acres: e.target.value }))} placeholder="e.g. 12" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Booking Advance (₹)</label>
              <input type="number" min="0" step="any" value={form.booking_advance} onChange={e => setForm(p => ({ ...p, booking_advance: e.target.value }))} placeholder="e.g. 50000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">R/C</label>
              <input value={form.r_c} onChange={e => setForm(p => ({ ...p, r_c: e.target.value }))} placeholder="e.g. Ready / Under Const." className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Month Launched</label>
              <input value={form.month_launched} onChange={e => setForm(p => ({ ...p, month_launched: e.target.value }))} placeholder="e.g. Oct 2026" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Features</label>
              <textarea rows={2} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                className={`${inputClass} resize-none`} placeholder="40ft Blacktop Roads, Clubhouse, Underground Drainage..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={`${inputClass} resize-none`} placeholder="Detailed venture description..." />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-gray-700">Active (visible across CRM)</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Org Admin only) */}
      {isOrgAdmin && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Venture"
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
                {saving ? "Deleting..." : "Delete"}
              </button>
            </>
          }>
          <p className="text-sm text-gray-600">Delete venture <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
        </Modal>
      )}

      {/* Detail Panel */}
      <VentureDetailPanel 
        venture={detailVenture} 
        onClose={() => setDetailVenture(null)}
        onEdit={() => { setDetailVenture(null); openEdit(detailVenture); }}
        onDelete={() => { setDetailVenture(null); setDeleteTarget(detailVenture); }}
        canDelete={isOrgAdmin}
      />
    </div>
  );
}
