import { useEffect, useMemo, useState } from "react";
import { Contact, Phone, Plus, Pencil, Trash2, Search, Filter, X, Calendar, IndianRupee, ShieldCheck, AlertCircle } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import EditableSelect from "../../components/employee/EditableSelect";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const PAGE_SIZE = 10;

function formatCurrency(val) {
  if (val == null || isNaN(val)) return "₹0";
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

export default function ConstructionCustomers() {
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  // Controlled Form State (11 columns)
  const [formName, setFormName] = useState("");
  const [formWhatsappNumber, setFormWhatsappNumber] = useState("");
  const [formServiceProjectName, setFormServiceProjectName] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("Residential Apartment");
  const [formCityPincode, setFormCityPincode] = useState("");
  const [formDealValue, setFormDealValue] = useState("");
  const [formAmountReceived, setFormAmountReceived] = useState("");
  const [formDateStarted, setFormDateStarted] = useState("");
  const [formDateEnded, setFormDateEnded] = useState("");
  const [formWarranty, setFormWarranty] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/employee/construction-customers", {
        params: { search, property_type: propertyTypeFilter },
      });
      setCustomers(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load construction customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, propertyTypeFilter]);

  const propertyTypes = useMemo(() => {
    const set = new Set();
    customers.forEach((c) => { if (c.property_type) set.add(c.property_type); });
    return Array.from(set);
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (propertyTypeFilter && c.property_type !== propertyTypeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name?.toLowerCase().includes(q) ||
          c.whatsapp_number?.toLowerCase().includes(q) ||
          c.service_project_name?.toLowerCase().includes(q) ||
          c.city_pincode?.toLowerCase().includes(q) ||
          c.property_type?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [customers, propertyTypeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  // Computed live amount pending for form
  const computedAmountPending = useMemo(() => {
    const dv = parseFloat(formDealValue) || 0;
    const ar = parseFloat(formAmountReceived) || 0;
    return Math.max(0, dv - ar);
  }, [formDealValue, formAmountReceived]);

  const openAdd = () => {
    setActiveItem(null);
    setFormError("");
    setFormName("");
    setFormWhatsappNumber("");
    setFormServiceProjectName("");
    setFormPropertyType("Residential Apartment");
    setFormCityPincode("");
    setFormDealValue("");
    setFormAmountReceived("");
    setFormDateStarted("");
    setFormDateEnded("");
    setFormWarranty("1 Year");
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setActiveItem(c);
    setFormError("");
    setFormName(c.name || "");
    setFormWhatsappNumber(c.whatsapp_number || "");
    setFormServiceProjectName(c.service_project_name || "");
    setFormPropertyType(c.property_type || "Residential Apartment");
    setFormCityPincode(c.city_pincode || "");
    setFormDealValue(c.deal_value != null ? String(c.deal_value) : "");
    setFormAmountReceived(c.amount_received != null ? String(c.amount_received) : "");
    setFormDateStarted(c.date_started ? c.date_started.split("T")[0] : "");
    setFormDateEnded(c.date_ended ? c.date_ended.split("T")[0] : "");
    setFormWarranty(c.warranty || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Customer name is required");
      return;
    }

    const dv = parseFloat(formDealValue) || 0;
    const ar = parseFloat(formAmountReceived) || 0;

    // Validation (C3): Amount Received cannot exceed Deal Value
    if (ar > dv) {
      setFormError("Amount Received cannot exceed Deal Value");
      return;
    }

    // Validation (C3): Date Ended cannot be before Date Started
    if (formDateStarted && formDateEnded && new Date(formDateEnded) < new Date(formDateStarted)) {
      setFormError("Date Ended cannot be before Date Started");
      return;
    }

    setSaving(true);

    const payload = {
      name: formName.trim(),
      whatsapp_number: formWhatsappNumber.trim() || null,
      service_project_name: formServiceProjectName.trim() || null,
      property_type: formPropertyType,
      city_pincode: formCityPincode.trim() || null,
      deal_value: dv,
      amount_received: ar,
      date_started: formDateStarted || null,
      date_ended: formDateEnded || null,
      warranty: formWarranty.trim() || null,
    };

    try {
      if (activeItem) {
        const res = await api.put(`/employee/construction-customers/${activeItem.id}`, payload);
        setCustomers((prev) => prev.map((c) => (c.id === activeItem.id ? res.data.data : c)));
        if (detailItem?.id === activeItem.id) setDetailItem(res.data.data);
      } else {
        const res = await api.post("/employee/construction-customers", payload);
        setCustomers((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/employee/construction-customers/${deleteTarget.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete customer");
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
            <Contact size={20} className="text-blue-600" /> Construction Customers
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Projects, contract amounts, milestones, and payment tracking</p>
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search customers by name, project, city..."
        addLabel="Add Customer"
        onAddClick={openAdd}
        filters={
          propertyTypes.length > 0 && (
            <FilterSelect
              value={propertyTypeFilter}
              onChange={(v) => { setPropertyTypeFilter(v); setPage(1); }}
              options={propertyTypes}
              allLabel="All Property Types"
            />
          )
        }
      />

      {error && (
        <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading construction customers...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Contact}
          title="No construction customers found"
          description="Track clients, project contracts, amounts received, and warranty periods."
          actionLabel="Add Customer"
          onAction={openAdd}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">WhatsApp Number</th>
                <th className="px-4 py-3 font-medium">Service / Project</th>
                <th className="px-4 py-3 font-medium">Property Type</th>
                <th className="px-4 py-3 font-medium">City / Pincode</th>
                <th className="px-4 py-3 font-medium">Deal Value</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Timeline</th>
                <th className="px-4 py-3 font-medium">Warranty</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((c) => {
                const pending = parseFloat(c.deal_value || 0) - parseFloat(c.amount_received || 0);

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => setDetailItem(c)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {c.whatsapp_number ? (
                        <a
                          href={`https://wa.me/${c.whatsapp_number.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          <Phone size={12} className="text-emerald-500" /> {c.whatsapp_number}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 font-medium">
                      {c.service_project_name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {c.property_type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {c.city_pincode || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(c.deal_value)}
                    </td>
                    <td className="px-4 py-3 text-emerald-700 font-medium whitespace-nowrap">
                      {formatCurrency(c.amount_received)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-semibold ${pending > 0 ? "text-amber-600" : "text-gray-400"}`}>
                        {formatCurrency(pending)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {c.date_started ? new Date(c.date_started).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : "—"}
                      {c.date_ended ? ` → ${new Date(c.date_ended).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}` : ""}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                      {c.warranty ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                          <ShieldCheck size={11} /> {c.warranty}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        onEdit={() => openEdit(c)}
                        onDelete={isOrgAdmin ? () => setDeleteTarget(c) : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
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

      {/* Add / Edit Modal (C3) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeItem ? "Edit Construction Customer" : "Add Construction Customer"}
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
              form="cust-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : activeItem ? "Save Changes" : "Create Customer"}
            </button>
          </>
        }
      >
        <form id="cust-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Name & WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Customer Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Anand Varma"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">WhatsApp / Phone Number</label>
              <input
                type="text"
                value={formWhatsappNumber}
                onChange={(e) => setFormWhatsappNumber(e.target.value)}
                placeholder="e.g. 9848011223"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 2: Service/Project Name & Property Type (Editable Dropdown) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Service / Project Name</label>
              <input
                type="text"
                value={formServiceProjectName}
                onChange={(e) => setFormServiceProjectName(e.target.value)}
                placeholder="e.g. Duplex Villa Renovation"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Property Type (Editable)</label>
              <EditableSelect
                vertical="construction"
                category="construction_property_type"
                value={formPropertyType}
                onChange={setFormPropertyType}
                placeholder="Select Property Type"
              />
            </div>
          </div>

          {/* Row 3: City / Pincode & Warranty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">City / Pincode</label>
              <input
                type="text"
                value={formCityPincode}
                onChange={(e) => setFormCityPincode(e.target.value)}
                placeholder="e.g. Visakhapatnam - 530017"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Warranty / Guarantee</label>
              <input
                type="text"
                value={formWarranty}
                onChange={(e) => setFormWarranty(e.target.value)}
                placeholder="e.g. 2 Years on Waterproofing"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 4: Deal Value, Amount Received, Amount Pending (Auto-calculated) */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Deal Value (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formDealValue}
                  onChange={(e) => setFormDealValue(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Amount Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formAmountReceived}
                  onChange={(e) => setFormAmountReceived(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Amount Pending (Auto)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={formatCurrency(computedAmountPending)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Date Started & Date Ended (Date Pickers with validation) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Date Started</label>
              <input
                type="date"
                value={formDateStarted}
                onChange={(e) => setFormDateStarted(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Date Ended</label>
              <input
                type="date"
                value={formDateEnded}
                min={formDateStarted || undefined}
                onChange={(e) => setFormDateEnded(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal (Org Admin only) */}
      {isOrgAdmin && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Customer"
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
            Delete customer <strong>{deleteTarget?.name}</strong>? This cannot be undone.
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
                <h2 className="text-base font-bold text-gray-900">{detailItem.name}</h2>
                <p className="text-xs text-blue-600 font-medium">{detailItem.service_project_name || "Construction Project"}</p>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">WhatsApp / Phone</p>
                  <p className="font-medium text-gray-800">{detailItem.whatsapp_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Property Type</p>
                  <p className="font-medium text-gray-800">{detailItem.property_type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">City / Pincode</p>
                  <p className="font-medium text-gray-800">{detailItem.city_pincode || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Warranty</p>
                  <p className="font-medium text-gray-800">{detailItem.warranty || "—"}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Deal Value:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(detailItem.deal_value)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount Received:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(detailItem.amount_received)}</span>
                </div>
                <div className="flex justify-between text-xs border-t pt-1.5">
                  <span className="text-gray-500">Amount Pending:</span>
                  <span className="font-bold text-amber-600">
                    {formatCurrency(parseFloat(detailItem.deal_value || 0) - parseFloat(detailItem.amount_received || 0))}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Date Started</p>
                  <p className="font-medium text-gray-800">{detailItem.date_started ? new Date(detailItem.date_started).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Date Ended</p>
                  <p className="font-medium text-gray-800">{detailItem.date_ended ? new Date(detailItem.date_ended).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
