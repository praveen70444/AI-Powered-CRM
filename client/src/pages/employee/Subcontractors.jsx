import { useEffect, useMemo, useState } from "react";
import { Hammer, Phone, Plus, Pencil, Trash2, Search, Filter, X, Building2, Star, Briefcase } from "lucide-react";
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

const SUB_COL_DEFAULTS = {
  contractor: "Contractor / Company",
  service_type: "Service Type",
  contact_person: "Contact Person",
  contact: "WhatsApp / Contact",
  location: "Location / Area",
  experience: "Experience",
  workforce: "Workforce",
  completed: "Completed",
  rating: "Rating / Notes",
};

export default function Subcontractors() {
  const { labels: colLabels, updateLabel: updateColLabel } = useColumnLabels("col_labels_subcontractors", SUB_COL_DEFAULTS);
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  // Form State
  const [formContractorName, setFormContractorName] = useState("");
  const [formServiceType, setFormServiceType] = useState("Civil Construction");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formContactNumber, setFormContactNumber] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formYearsExperience, setFormYearsExperience] = useState("");
  const [formWorkforceCapacity, setFormWorkforceCapacity] = useState("");
  const [formPreviousProjects, setFormPreviousProjects] = useState("");
  const [formProjectsCompleted, setFormProjectsCompleted] = useState("");
  const [formRatingNotes, setFormRatingNotes] = useState("");

  const loadContractors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/employee/subcontractors", {
        params: { search, service_type: serviceTypeFilter },
      });
      setContractors(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subcontractors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
  }, [search, serviceTypeFilter]);

  const serviceTypes = useMemo(() => {
    const set = new Set();
    contractors.forEach((c) => { if (c.service_type) set.add(c.service_type); });
    return Array.from(set);
  }, [contractors]);

  const filtered = useMemo(() => {
    return contractors.filter((c) => {
      if (serviceTypeFilter && c.service_type !== serviceTypeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.contractor_name?.toLowerCase().includes(q) ||
          c.contact_person?.toLowerCase().includes(q) ||
          c.contact_number?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.service_type?.toLowerCase().includes(q) ||
          c.previous_projects?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [contractors, serviceTypeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  const openAdd = () => {
    setActiveItem(null);
    setFormContractorName("");
    setFormServiceType("Civil Construction");
    setFormContactPerson("");
    setFormContactNumber("");
    setFormLocation("");
    setFormYearsExperience("");
    setFormWorkforceCapacity("");
    setFormPreviousProjects("");
    setFormProjectsCompleted("");
    setFormRatingNotes("");
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setActiveItem(c);
    setFormContractorName(c.contractor_name || "");
    setFormServiceType(c.service_type || "Civil Construction");
    setFormContactPerson(c.contact_person || "");
    setFormContactNumber(c.contact_number || "");
    setFormLocation(c.location || "");
    setFormYearsExperience(c.years_experience || "");
    setFormWorkforceCapacity(c.workforce_capacity || "");
    setFormPreviousProjects(c.previous_projects || "");
    setFormProjectsCompleted(c.projects_completed ?? "");
    setFormRatingNotes(c.rating_notes || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formContractorName.trim()) {
      setError("Contractor name is required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      contractor_name: formContractorName.trim(),
      service_type: formServiceType,
      contact_person: formContactPerson.trim() || null,
      contact_number: formContactNumber.trim() || null,
      location: formLocation.trim() || null,
      years_experience: formYearsExperience.trim() || null,
      workforce_capacity: formWorkforceCapacity.trim() || null,
      previous_projects: formPreviousProjects.trim() || null,
      projects_completed: formProjectsCompleted ? parseInt(formProjectsCompleted) : null,
      rating_notes: formRatingNotes.trim() || null,
    };

    try {
      if (activeItem) {
        const res = await api.put(`/employee/subcontractors/${activeItem.id}`, payload);
        setContractors((prev) => prev.map((c) => (c.id === activeItem.id ? res.data.data : c)));
        if (detailItem?.id === activeItem.id) setDetailItem(res.data.data);
      } else {
        const res = await api.post("/employee/subcontractors", payload);
        setContractors((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save subcontractor");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/employee/subcontractors/${deleteTarget.id}`);
      setContractors((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete subcontractor");
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
            <Hammer size={20} className="text-blue-600" /> Subcontractors
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Construction contractors, specialists, and service teams</p>
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search contractors by name, service, location..."
        addLabel="Add Subcontractor"
        onAddClick={openAdd}
        filters={
          serviceTypes.length > 0 && (
            <FilterSelect
              value={serviceTypeFilter}
              onChange={(v) => { setServiceTypeFilter(v); setPage(1); }}
              options={serviceTypes}
              allLabel="All Service Types"
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
        <div className="p-8 text-center text-sm text-gray-400">Loading subcontractors...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No subcontractors found"
          description="Register trade contractors, electrical/plumbing experts, and service teams."
          actionLabel="Add Subcontractor"
          onAction={openAdd}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <EditableColumnHeader colKey="contractor" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="service_type" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="contact_person" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="contact" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="location" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="experience" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="workforce" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="completed" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <EditableColumnHeader colKey="rating" labels={colLabels} defaults={SUB_COL_DEFAULTS} updateLabel={updateColLabel} />
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  onClick={() => setDetailItem(c)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {c.contractor_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {c.service_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs font-medium">
                    {c.contact_person || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {c.contact_number ? (
                      <a
                        href={`https://wa.me/${c.contact_number.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <Phone size={12} className="text-emerald-500" /> {c.contact_number}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {c.location || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {c.years_experience ? `${c.years_experience} yrs` : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                    {c.workforce_capacity || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">
                    {c.projects_completed != null ? `${c.projects_completed} projects` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                    {c.rating_notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => openEdit(c)}
                      onDelete={isOrgAdmin ? () => setDeleteTarget(c) : undefined}
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

      {/* Add / Edit Modal (C1) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeItem ? "Edit Subcontractor" : "Add Subcontractor"}
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
              form="subcontractor-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : activeItem ? "Save Changes" : "Create Subcontractor"}
            </button>
          </>
        }
      >
        <form id="subcontractor-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Row 1: Contractor Name & Service Type (Editable Dropdown) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Contractor / Company Name *</label>
              <input
                type="text"
                required
                value={formContractorName}
                onChange={(e) => setFormContractorName(e.target.value)}
                placeholder="e.g. Sri Balaji Electricals"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Service Type *</label>
              <EditableSelect
                vertical="construction"
                category="service_type"
                value={formServiceType}
                onChange={setFormServiceType}
                placeholder="Select Service Type"
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
                placeholder="e.g. Rajesh Kumar"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">WhatsApp / Contact Number</label>
              <input
                type="text"
                value={formContactNumber}
                onChange={(e) => setFormContactNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 3: Location & Years of Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Location / Service Area</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Madhurawada & Anandapuram"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Years of Experience</label>
              <input
                type="text"
                value={formYearsExperience}
                onChange={(e) => setFormYearsExperience(e.target.value)}
                placeholder="e.g. 8 years"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 4: Workforce Capacity & Projects Completed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Workforce Capacity</label>
              <input
                type="text"
                value={formWorkforceCapacity}
                onChange={(e) => setFormWorkforceCapacity(e.target.value)}
                placeholder="e.g. 15-20 workers"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Projects Completed</label>
              <input
                type="number"
                min="0"
                value={formProjectsCompleted}
                onChange={(e) => setFormProjectsCompleted(e.target.value)}
                placeholder="e.g. 24"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Previous Projects / Portfolio */}
          <div>
            <label className="text-xs font-medium text-gray-600">Previous Projects / Portfolio</label>
            <textarea
              rows={2}
              value={formPreviousProjects}
              onChange={(e) => setFormPreviousProjects(e.target.value)}
              placeholder="e.g. Hilltop Villas (Plumbing), Sky Towers (Full Electrical)..."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Rating / Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600">Rating / Notes</label>
            <textarea
              rows={2}
              value={formRatingNotes}
              onChange={(e) => setFormRatingNotes(e.target.value)}
              placeholder="e.g. 4.8/5 rating. Highly reliable, finishes on schedule."
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
          title="Delete Subcontractor"
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
            Delete subcontractor <strong>{deleteTarget?.contractor_name}</strong>? This cannot be undone.
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
                <h2 className="text-base font-bold text-gray-900">{detailItem.contractor_name}</h2>
                <p className="text-xs text-blue-600 font-medium">{detailItem.service_type}</p>
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
                  <p className="text-xs text-gray-400">Experience</p>
                  <p className="font-medium text-gray-800">{detailItem.years_experience || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Workforce</p>
                  <p className="font-medium text-gray-800">{detailItem.workforce_capacity || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Projects Completed</p>
                  <p className="font-medium text-gray-800">{detailItem.projects_completed ?? "—"}</p>
                </div>
              </div>
              {detailItem.previous_projects && (
                <div>
                  <p className="text-xs text-gray-400">Previous Projects / Portfolio</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap mt-1">
                    {detailItem.previous_projects}
                  </p>
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
