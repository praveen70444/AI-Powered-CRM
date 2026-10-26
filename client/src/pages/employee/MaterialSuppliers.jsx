import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Phone, Plus, Pencil, Trash2, Search, Filter, X, Building2, Package, Tag } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import EditableSelect from "../../components/employee/EditableSelect";
import { EditableColumnHeader, useColumnLabels } from "../../components/employee/EditableColumnHeader";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const PAGE_SIZE = 10;

const MAT_COL_DEFAULTS = {
  supplier: "Supplier / Company",
  material_category: "Material Category",
  contact_person: "Contact Person",
  contact: "WhatsApp / Contact",
  location: "Location / Area",
  supplier_type: "Supplier Type",
  brands: "Brands / Products",
  bulk_price: "Bulk Price",
  moq: "MOQ",
};

export default function MaterialSuppliers() {
  const { labels: colLabels, updateLabel: updateColLabel } = useColumnLabels("col_labels_material_suppliers", MAT_COL_DEFAULTS);
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  // Form State
  const [formSupplierName, setFormSupplierName] = useState("");
  const [formMaterialCategory, setFormMaterialCategory] = useState("Cement");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formContactNumber, setFormContactNumber] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formSupplierType, setFormSupplierType] = useState("Wholesaler");
  const [formBrandsProducts, setFormBrandsProducts] = useState("");
  const [formWholesalePrice, setFormWholesalePrice] = useState("");
  const [formMoq, setFormMoq] = useState("");
  const [formRatingNotes, setFormRatingNotes] = useState("");

  const loadSuppliers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/employee/material-suppliers", {
        params: {
          search,
          material_category: categoryFilter,
          supplier_type: typeFilter,
        },
      });
      setSuppliers(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load material suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search, categoryFilter, typeFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    suppliers.forEach((s) => { if (s.material_category) set.add(s.material_category); });
    return Array.from(set);
  }, [suppliers]);

  const supplierTypes = useMemo(() => {
    const set = new Set();
    suppliers.forEach((s) => { if (s.supplier_type) set.add(s.supplier_type); });
    return Array.from(set);
  }, [suppliers]);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (categoryFilter && s.material_category !== categoryFilter) return false;
      if (typeFilter && s.supplier_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          s.supplier_name?.toLowerCase().includes(q) ||
          s.contact_person?.toLowerCase().includes(q) ||
          s.contact_number?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q) ||
          s.brands_products?.toLowerCase().includes(q) ||
          s.material_category?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [suppliers, categoryFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  const openAdd = () => {
    setActiveItem(null);
    setFormSupplierName("");
    setFormMaterialCategory("Cement");
    setFormContactPerson("");
    setFormContactNumber("");
    setFormLocation("");
    setFormSupplierType("Wholesaler");
    setFormBrandsProducts("");
    setFormWholesalePrice("");
    setFormMoq("");
    setFormRatingNotes("");
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setActiveItem(s);
    setFormSupplierName(s.supplier_name || "");
    setFormMaterialCategory(s.material_category || "Cement");
    setFormContactPerson(s.contact_person || "");
    setFormContactNumber(s.contact_number || "");
    setFormLocation(s.location || "");
    setFormSupplierType(s.supplier_type || "Wholesaler");
    setFormBrandsProducts(s.brands_products || "");
    setFormWholesalePrice(s.wholesale_price || "");
    setFormMoq(s.moq || "");
    setFormRatingNotes(s.rating_notes || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formSupplierName.trim()) {
      setError("Supplier name is required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      supplier_name: formSupplierName.trim(),
      material_category: formMaterialCategory,
      contact_person: formContactPerson.trim() || null,
      contact_number: formContactNumber.trim() || null,
      location: formLocation.trim() || null,
      supplier_type: formSupplierType,
      brands_products: formBrandsProducts.trim() || null,
      wholesale_price: formWholesalePrice.trim() || null,
      moq: formMoq.trim() || null,
      rating_notes: formRatingNotes.trim() || null,
    };

    try {
      if (activeItem) {
        const res = await api.put(`/employee/material-suppliers/${activeItem.id}`, payload);
        setSuppliers((prev) => prev.map((s) => (s.id === activeItem.id ? res.data.data : s)));
        if (detailItem?.id === activeItem.id) setDetailItem(res.data.data);
      } else {
        const res = await api.post("/employee/material-suppliers", payload);
        setSuppliers((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/employee/material-suppliers/${deleteTarget.id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete supplier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Title */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" /> Material Suppliers
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Vendors, manufacturers, and building material suppliers directory</p>
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search suppliers by name, category, brands..."
        addLabel="Add Supplier"
        onAddClick={openAdd}
        filters={
          <>
            {categories.length > 0 && (
              <FilterSelect
                value={categoryFilter}
                onChange={(v) => { setCategoryFilter(v); setPage(1); }}
                options={categories}
                allLabel="All Categories"
              />
            )}
            {supplierTypes.length > 0 && (
              <FilterSelect
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setPage(1); }}
                options={supplierTypes}
                allLabel="All Supplier Types"
              />
            )}
          </>
        }
      />

      {error && (
        <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading suppliers...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No suppliers found"
          description="Maintain trusted suppliers for cement, steel, bricks, tiles, and fittings."
          actionLabel="Add Supplier"
          onAction={openAdd}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <EditableColumnHeader colKey="supplier" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="material_category" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="contact_person" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="contact" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="location" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="supplier_type" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="brands" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="bulk_price" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="moq" labels={colLabels} defaults={MAT_COL_DEFAULTS} updateLabel={updateColLabel} />
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  onClick={() => setDetailItem(s)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {s.supplier_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {s.material_category || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs font-medium">
                    {s.contact_person || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {s.contact_number ? (
                      <a
                        href={`https://wa.me/${s.contact_number.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <Phone size={12} className="text-emerald-500" /> {s.contact_number}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {s.location || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {s.supplier_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 max-w-[150px] truncate">
                    {s.brands_products || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                    {s.wholesale_price || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {s.moq || "—"}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(s)}
                      onDelete={isOrgAdmin ? () => setDeleteTarget(s) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />

      {/* Add / Edit Modal (C2) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeItem ? "Edit Material Supplier" : "Add Material Supplier"}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="supplier-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : activeItem ? "Save Changes" : "Create Supplier"}
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Row 1: Supplier Name & Material Category (Editable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Supplier / Company Name *</label>
              <input
                type="text"
                required
                value={formSupplierName}
                onChange={(e) => setFormSupplierName(e.target.value)}
                placeholder="e.g. Vizag Steel & Cement Corp"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Material Category *</label>
              <EditableSelect
                vertical="construction"
                category="material_category"
                value={formMaterialCategory}
                onChange={setFormMaterialCategory}
                placeholder="Select Category"
              />
            </div>
          </div>

          {/* Row 2: Contact Person & Contact Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Contact Person</label>
              <input
                type="text"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
                placeholder="e.g. Suresh Varma"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">WhatsApp / Contact Number</label>
              <input
                type="text"
                value={formContactNumber}
                onChange={(e) => setFormContactNumber(e.target.value)}
                placeholder="e.g. 9849011223"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 3: Location & Supplier Type (Editable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Location / Delivery Area</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Autonagar, Gajuwaka"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Supplier Type</label>
              <EditableSelect
                vertical="construction"
                category="supplier_type"
                value={formSupplierType}
                onChange={setFormSupplierType}
                placeholder="Select Supplier Type"
              />
            </div>
          </div>

          {/* Row 4: Brands / Products Available */}
          <div>
            <label className="text-xs font-medium text-gray-600">Brands / Products Available</label>
            <input
              type="text"
              value={formBrandsProducts}
              onChange={(e) => setFormBrandsProducts(e.target.value)}
              placeholder="e.g. UltraTech, ACC, Jindal Panther, Tata Tiscon"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Row 5: Wholesale Price & MOQ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Wholesale / Bulk Price</label>
              <input
                type="text"
                value={formWholesalePrice}
                onChange={(e) => setFormWholesalePrice(e.target.value)}
                placeholder="e.g. ₹360/bag or ₹58,000/ton"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Minimum Order Quantity (MOQ)</label>
              <input
                type="text"
                value={formMoq}
                onChange={(e) => setFormMoq(e.target.value)}
                placeholder="e.g. 100 bags or 5 tons"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Rating / Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600">Rating / Notes</label>
            <textarea
              rows={2}
              value={formRatingNotes}
              onChange={(e) => setFormRatingNotes(e.target.value)}
              placeholder="e.g. 30 days credit available for orders > 10L. Timely dispatch."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal (Org Admin only) */}
      {isOrgAdmin && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Material Supplier"
          footer={
            <>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Delete supplier <strong>{deleteTarget?.supplier_name}</strong>? This cannot be undone.
          </p>
        </Modal>
      )}

      {/* Detail Side Panel */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailItem(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">{detailItem.supplier_name}</h2>
                <p className="text-xs text-emerald-600 font-medium">{detailItem.material_category} · {detailItem.supplier_type}</p>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Contact Person</p>
                  <p className="font-medium text-gray-800">{detailItem.contact_person || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium text-gray-800">{detailItem.contact_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="font-medium text-gray-800">{detailItem.location || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Wholesale Price</p>
                  <p className="font-medium text-gray-800">{detailItem.wholesale_price || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">MOQ</p>
                  <p className="font-medium text-gray-800">{detailItem.moq || "—"}</p>
                </div>
              </div>
              {detailItem.brands_products && (
                <div>
                  <p className="text-xs text-gray-400">Brands / Products</p>
                  <p className="text-gray-800 font-medium mt-0.5">{detailItem.brands_products}</p>
                </div>
              )}
              {detailItem.rating_notes && (
                <div>
                  <p className="text-xs text-gray-400">Rating & Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap mt-1">
                    {detailItem.rating_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
