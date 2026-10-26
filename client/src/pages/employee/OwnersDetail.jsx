import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Plus, Pencil, Trash2, Search, Filter, X, Eye, User } from "lucide-react";
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

const OD_COL_DEFAULTS = {
  name: "Name",
  contact: "Contact Number",
  person: "Person",
  property_type: "Property Type",
  size: "Size",
  purpose: "Purpose",
  price_jd: "Price / Joint Dev",
  village: "Village",
  features: "Features",
};

export default function OwnersDetail() {
  const { labels: colLabels, updateLabel: updateColLabel } = useColumnLabels("col_labels_owners_detail", OD_COL_DEFAULTS);
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  // Controlled Form State
  const [formName, setFormName] = useState("");
  const [formContactNumber, setFormContactNumber] = useState("");
  const [formPerson, setFormPerson] = useState("Owner");
  const [formPropertyType, setFormPropertyType] = useState("Land");
  const [formSize, setFormSize] = useState("");
  const [formPurpose, setFormPurpose] = useState("Residential");
  const [formPriceOrJd, setFormPriceOrJd] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formFeatures, setFormFeatures] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/employee/owners-detail", {
        params: {
          search,
          person: personFilter,
          property_type: propertyTypeFilter,
          purpose: purposeFilter,
        },
      });
      setRecords(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load owner details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [search, personFilter, propertyTypeFilter, purposeFilter]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (personFilter && r.person !== personFilter) return false;
      if (propertyTypeFilter && r.property_type !== propertyTypeFilter) return false;
      if (purposeFilter && r.purpose !== purposeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          r.name?.toLowerCase().includes(q) ||
          r.contact_number?.toLowerCase().includes(q) ||
          r.village?.toLowerCase().includes(q) ||
          r.features?.toLowerCase().includes(q) ||
          r.size?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, personFilter, propertyTypeFilter, purposeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  const openAdd = () => {
    setActiveRecord(null);
    setFormName("");
    setFormContactNumber("");
    setFormPerson("Owner");
    setFormPropertyType("Land");
    setFormSize("");
    setFormPurpose("Residential");
    setFormPriceOrJd("");
    setFormVillage("");
    setFormFeatures("");
    setModalOpen(true);
  };

  const openEdit = (rec) => {
    setActiveRecord(rec);
    setFormName(rec.name || "");
    setFormContactNumber(rec.contact_number || "");
    setFormPerson(rec.person || "Owner");
    setFormPropertyType(rec.property_type || "Land");
    setFormSize(rec.size || "");
    setFormPurpose(rec.purpose || "Residential");
    setFormPriceOrJd(rec.price_or_jd || "");
    setFormVillage(rec.village || "");
    setFormFeatures(rec.features || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: formName.trim(),
      contact_number: formContactNumber.trim() || null,
      person: formPerson,
      property_type: formPropertyType,
      size: formSize.trim() || null,
      purpose: formPurpose,
      price_or_jd: formPriceOrJd.trim() || null,
      village: formVillage.trim() || null,
      features: formFeatures.trim() || null,
    };

    try {
      if (activeRecord) {
        const res = await api.put(`/employee/owners-detail/${activeRecord.id}`, payload);
        setRecords((prev) => prev.map((r) => (r.id === activeRecord.id ? res.data.data : r)));
        if (detailRecord?.id === activeRecord.id) setDetailRecord(res.data.data);
      } else {
        const res = await api.post("/employee/owners-detail", payload);
        setRecords((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save owner detail");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/employee/owners-detail/${deleteTarget.id}`);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Title & Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" /> Owners Detail
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Directory of property owners, mediators, and land records</p>
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, contact, village, features..."
        addLabel="Add Owner Detail"
        onAddClick={openAdd}
        filters={
          <>
            <FilterSelect
              value={personFilter}
              onChange={(v) => { setPersonFilter(v); setPage(1); }}
              options={["Owner", "Mediator"]}
              allLabel="All Persons"
            />
            <FilterSelect
              value={propertyTypeFilter}
              onChange={(v) => { setPropertyTypeFilter(v); setPage(1); }}
              options={["Land", "Flat"]}
              allLabel="All Property Types"
            />
            <FilterSelect
              value={purposeFilter}
              onChange={(v) => { setPurposeFilter(v); setPage(1); }}
              options={["Residential", "Investment", "Commercial", "Rental", "Joint Development"]}
              allLabel="All Purposes"
            />
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
        <div className="p-8 text-center text-sm text-gray-400">Loading owner details...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No owner records found"
          description="Add property owners and mediators to start tracking land/flat details."
          actionLabel="Add Owner Detail"
          onAction={openAdd}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <EditableColumnHeader colKey="name" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="contact" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="person" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="property_type" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="size" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="purpose" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="price_jd" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="village" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="features" labels={colLabels} defaults={OD_COL_DEFAULTS} updateLabel={updateColLabel} />
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  onClick={() => setDetailRecord(rec)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {rec.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {rec.contact_number ? (
                      <a
                        href={`https://wa.me/${rec.contact_number.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Phone size={12} className="text-emerald-500" /> {rec.contact_number}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      rec.person === "Owner" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      "bg-violet-50 text-violet-700 border border-violet-100"
                    }`}>
                      {rec.person || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">
                    {rec.property_type || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {rec.size || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {rec.purpose || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-800 font-medium max-w-[150px] truncate">
                    {rec.price_or_jd || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {rec.village ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-blue-500" /> {rec.village}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                    {rec.features || "—"}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(rec)}
                      onDelete={isOrgAdmin ? () => setDeleteTarget(rec) : undefined}
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

      {/* Add / Edit Modal (B4) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeRecord ? "Edit Owner Detail" : "Add Owner Detail"}
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
              form="owner-detail-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : activeRecord ? "Save Changes" : "Create Record"}
            </button>
          </>
        }
      >
        <form id="owner-detail-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Row 1: Name & Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Venkata Rao"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Contact Number</label>
              <input
                type="text"
                value={formContactNumber}
                onChange={(e) => setFormContactNumber(e.target.value)}
                placeholder="e.g. 9848012345"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 2: Person (Editable) & Property Type (Editable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Person (Mediator / Owner)</label>
              <EditableSelect
                vertical="real_estate"
                category="owner_person"
                value={formPerson}
                onChange={setFormPerson}
                placeholder="Select Person"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Property Type</label>
              <EditableSelect
                vertical="real_estate"
                category="owner_property_type"
                value={formPropertyType}
                onChange={setFormPropertyType}
                placeholder="Select Property Type"
              />
            </div>
          </div>

          {/* Row 3: Size & Purpose (Editable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Size</label>
              <input
                type="text"
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                placeholder="e.g. 5 Acres / 200 Sq Yd"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Purpose</label>
              <EditableSelect
                vertical="real_estate"
                category="owner_purpose"
                value={formPurpose}
                onChange={setFormPurpose}
                placeholder="Select Purpose"
              />
            </div>
          </div>

          {/* Row 4: Price / Joint Development & Village */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Price / Joint Development</label>
              <input
                type="text"
                value={formPriceOrJd}
                onChange={(e) => setFormPriceOrJd(e.target.value)}
                placeholder="e.g. ₹50L or 60:40 Joint Dev"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Village / Location</label>
              <input
                type="text"
                value={formVillage}
                onChange={(e) => setFormVillage(e.target.value)}
                placeholder="e.g. Bhogapuram"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="text-xs font-medium text-gray-600">Features / Notes</label>
            <textarea
              rows={3}
              value={formFeatures}
              onChange={(e) => setFormFeatures(e.target.value)}
              placeholder="e.g. Corner bit, 60ft road facing, clear title with passbook..."
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
          title="Delete Owner Record"
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
            Delete owner record for <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
        </Modal>
      )}

      {/* Detail Side Panel */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailRecord(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">{detailRecord.name}</h2>
                <p className="text-xs text-gray-400">{detailRecord.person} · {detailRecord.village || "No location"}</p>
              </div>
              <button onClick={() => setDetailRecord(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Contact Number</p>
                <p className="font-medium text-gray-800">{detailRecord.contact_number || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Property Type</p>
                  <p className="font-medium text-gray-800">{detailRecord.property_type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Size</p>
                  <p className="font-medium text-gray-800">{detailRecord.size || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Purpose</p>
                  <p className="font-medium text-gray-800">{detailRecord.purpose || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Price / Joint Dev</p>
                  <p className="font-medium text-gray-800">{detailRecord.price_or_jd || "—"}</p>
                </div>
              </div>
              {detailRecord.features && (
                <div>
                  <p className="text-xs text-gray-400">Features</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap mt-1">
                    {detailRecord.features}
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
