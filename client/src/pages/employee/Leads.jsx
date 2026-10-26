import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Users, AlertCircle, X, Plus, Upload, ChevronRight, Phone, Calendar,
  Building2, Target, IndianRupee, MapPin, Eye, Pencil, Trash2, Globe, Home
} from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import ConvertLeadModal from "../../components/employee/ConvertLeadModal";
import RowActions from "../../components/employee/RowActions";
import TagsInput from "../../components/employee/TagsInput";
import EditableSelect from "../../components/employee/EditableSelect";
import EditableMultiSelect from "../../components/employee/EditableMultiSelect";
import { useAuth } from "../../context/AuthContext";
import { LEAD_STATUSES, LEAD_SOURCES } from "../../mock/leads";
import {
  getLeads, createLead, updateLead, deleteLead,
  getLeadFollowups, createLeadFollowup, updateLeadFollowup, deleteLeadFollowup,
  bulkUploadLeads,
} from "../../services/employeeService";
import { exportLeads } from "../../services/exportService";
import api from "../../services/api";

const PAGE_SIZE = 8;
const LEAD_TYPES = ["Flat Buyer", "Plot Buyer", "Land Buyer"];

// ── Lead Detail Side Panel ─────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onUpdated }) {
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!lead) return;
    setLoadingFollowups(true);
    getLeadFollowups(lead.id)
      .then((r) => setFollowups(r.data || []))
      .catch(() => setFollowups([]))
      .finally(() => setLoadingFollowups(false));
  }, [lead]);

  const addFollowup = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const r = await createLeadFollowup(lead.id, {
        note: newNote.trim(),
        followupDate: new Date().toISOString().split("T")[0],
        nextFollowupDate: nextFollowupDate || null,
      });
      setFollowups((prev) => [r.data, ...prev]);
      setNewNote("");
      setNextFollowupDate("");
    } catch { /* silent */ }
    finally { setSavingNote(false); }
  };

  const removeFollowup = async (id) => {
    try {
      await deleteLeadFollowup(id);
      setFollowups((prev) => prev.filter((f) => f.id !== id));
    } catch { /* silent */ }
  };

  if (!lead) return null;

  const locs = Array.isArray(lead.location)
    ? lead.location
    : (lead.location ? [lead.location] : (Array.isArray(lead.preferred_locations) ? lead.preferred_locations : []));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">{lead.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {lead.lead_type || lead.leadType || "Flat Buyer"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{lead.phone || "No phone"} · {lead.company || lead.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 px-6 gap-6 text-sm shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview & Requirements
          </button>
          <button
            onClick={() => setActiveTab("followups")}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === "followups" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Follow-ups ({followups.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Language</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.language || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lead Type</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.lead_type || lead.leadType || "Flat Buyer"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <div className="mt-1"><StatusBadge value={lead.status} /></div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.budget || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Purchase Timeline</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.purchase_timeline || lead.purchaseTimeline || lead.planToPurchase || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Purpose</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.lead_purpose || lead.purpose || lead.purposeOfPurchase || "—"}</p>
                </div>

                {/* Flat Buyer specifics */}
                {(lead.lead_type === "Flat Buyer" || !lead.lead_type) && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400">BHK Requirement</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.bhk_requirement || lead.bhkRequirement || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Property Status</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.property_status || lead.propertyStatus || "—"}</p>
                    </div>
                  </>
                )}

                {/* Plot Buyer specifics */}
                {lead.lead_type === "Plot Buyer" && (
                  <div>
                    <p className="text-xs text-gray-400">Plot Size (Sq Yd.)</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.plot_size_sqyd || lead.plotSize || "—"}</p>
                  </div>
                )}

                {/* Land Buyer specifics */}
                {lead.lead_type === "Land Buyer" && (
                  <div>
                    <p className="text-xs text-gray-400">Land Size</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{lead.land_size ? `${lead.land_size} ${lead.land_size_unit || "Acres"}` : "—"}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1.5 font-medium">Preferred Locations</p>
                {locs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {locs.map((loc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-100">
                        <MapPin size={11} /> {loc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No locations specified</p>
                )}
              </div>

              {lead.other_requirements && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">Other Requirements</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                    {lead.other_requirements}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a follow-up note..."
                  className="w-full text-sm bg-white border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  rows={2}
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="date"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5"
                  />
                  <button
                    onClick={addFollowup}
                    disabled={savingNote || !newNote.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingNote ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {followups.map((f) => (
                  <div key={f.id} className="p-3 rounded-lg border border-gray-100 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>{f.followupDate ? new Date(f.followupDate).toLocaleDateString() : "—"}</span>
                      <button onClick={() => removeFollowup(f.id)} className="text-red-500 hover:text-red-700">Delete</button>
                    </div>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{f.note}</p>
                    {f.nextFollowupDate && (
                      <p className="text-blue-600 text-[11px] font-medium">Next: {new Date(f.nextFollowupDate).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Leads Component ───────────────────────────────────────────────────
export default function Leads() {
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "ORG_ADMIN";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leadTypeFilter, setLeadTypeFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Controlled Form State for Real Estate Leads
  const [formLeadType, setFormLeadType] = useState("Flat Buyer");
  const [formLanguage, setFormLanguage] = useState("English");
  const [formLocation, setFormLocation] = useState([]);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStatus, setFormStatus] = useState("New");
  const [formSource, setFormSource] = useState("");
  const [formTimeline, setFormTimeline] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formBhk, setFormBhk] = useState("");
  const [formPropertyStatus, setFormPropertyStatus] = useState("");
  const [formPlotSizeSqyd, setFormPlotSizeSqyd] = useState("");
  const [formLandSize, setFormLandSize] = useState("");
  const [formLandSizeUnit, setFormLandSizeUnit] = useState("Acres");
  const [formOtherRequirements, setFormOtherRequirements] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLeads({
        search,
        status,
        language: languageFilter,
        lead_type: leadTypeFilter,
        limit: 100,
      });
      setLeads(res.data || []);
    } catch (err) {
      setError(err?.friendlyMessage || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [search, status, languageFilter, leadTypeFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Client-side filtering if necessary
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (leadTypeFilter && (l.lead_type || l.leadType) !== leadTypeFilter) return false;
      if (languageFilter && l.language !== languageFilter) return false;
      if (status && l.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const locs = Array.isArray(l.location) ? l.location.join(" ").toLowerCase() : (l.location || "").toLowerCase();
        const match =
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          locs.includes(q) ||
          l.language?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, leadTypeFilter, languageFilter, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Form Reset / Initialization
  const openAddModal = () => {
    setActiveLead(null);
    setFormLeadType("Flat Buyer");
    setFormLanguage("English");
    setFormLocation([]);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormCompany("");
    setFormBudget("");
    setFormStatus("New");
    setFormSource("");
    setFormTimeline("Immediately");
    setFormPurpose("Self-use");
    setFormBhk("2 BHK");
    setFormPropertyStatus("Ready-to-move");
    setFormPlotSizeSqyd("");
    setFormLandSize("");
    setFormLandSizeUnit("Acres");
    setFormOtherRequirements("");
    setModalOpen(true);
  };

  const openEditModal = (lead) => {
    setActiveLead(lead);
    const locs = Array.isArray(lead.location)
      ? lead.location
      : (lead.location ? [lead.location] : (Array.isArray(lead.preferred_locations) ? lead.preferred_locations : []));

    setFormLeadType(lead.lead_type || lead.leadType || "Flat Buyer");
    setFormLanguage(lead.language || "English");
    setFormLocation(locs);
    setFormName(lead.name || "");
    setFormPhone(lead.phone || "");
    setFormEmail(lead.email || "");
    setFormCompany(lead.company || "");
    setFormBudget(lead.budget || "");
    setFormStatus(lead.status || "New");
    setFormSource(lead.source || "");
    setFormTimeline(lead.purchase_timeline || lead.purchaseTimeline || lead.planToPurchase || "Immediately");
    setFormPurpose(lead.lead_purpose || lead.purpose || lead.purposeOfPurchase || "Self-use");
    setFormBhk(lead.bhk_requirement || lead.bhkRequirement || "2 BHK");
    setFormPropertyStatus(lead.property_status || lead.propertyStatus || "Ready-to-move");
    setFormPlotSizeSqyd(lead.plot_size_sqyd || lead.plotSize || "");
    setFormLandSize(lead.land_size || "");
    setFormLandSizeUnit(lead.land_size_unit || "Acres");
    setFormOtherRequirements(lead.other_requirements || "");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Lead Name is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      company: formCompany.trim() || formName.trim(),
      lead_type: formLeadType,
      language: formLanguage,
      location: formLocation,
      preferred_locations: formLocation,
      budget: formBudget,
      status: formStatus,
      source: formSource,
      purchase_timeline: formTimeline,
      lead_purpose: formPurpose,
      bhk_requirement: formBhk,
      property_status: formPropertyStatus,
      plot_size_sqyd: formPlotSizeSqyd ? Number(formPlotSizeSqyd) : null,
      land_size: formLandSize,
      land_size_unit: formLandSizeUnit,
      other_requirements: formOtherRequirements,
    };

    try {
      if (activeLead) {
        const res = await updateLead(activeLead.id, payload);
        setLeads((prev) => prev.map((l) => (l.id === activeLead.id ? res.data : l)));
        if (detailLead?.id === activeLead.id) setDetailLead(res.data);
      } else {
        const res = await createLead(payload);
        setLeads((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || err?.friendlyMessage || "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLead(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header action bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-blue-600" /> Real Estate Leads
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage buyers and property inquiries</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Upload size={13} /> Bulk Upload
          </button>
          <ExportMenu onExport={exportLeads} />
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, contact, location..."
        addLabel="Add Lead"
        onAddClick={openAddModal}
        filters={
          <>
            <FilterSelect
              value={leadTypeFilter}
              onChange={(v) => { setLeadTypeFilter(v); setPage(1); }}
              options={LEAD_TYPES}
              allLabel="All Lead Types"
            />
            <FilterSelect
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              options={LEAD_STATUSES}
              allLabel="All Statuses"
            />
            <FilterSelect
              value={languageFilter}
              onChange={(v) => { setLanguageFilter(v); setPage(1); }}
              options={["Hindi", "English", "Telugu"]}
              allLabel="All Languages"
            />
          </>
        }
      />

      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading leads...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description="Try adjusting your filters or click 'Add Lead' to create one."
          actionLabel="Add Lead"
          onAction={openAddModal}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 font-medium">Lead Name</th>
                <th className="px-4 py-3 font-medium">Contact No.</th>
                <th className="px-4 py-3 font-medium">Lead Type</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Timeline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map((lead) => {
                const locs = Array.isArray(lead.location)
                  ? lead.location
                  : (lead.location ? [lead.location] : (Array.isArray(lead.preferred_locations) ? lead.preferred_locations : []));

                const type = lead.lead_type || lead.leadType || "Flat Buyer";

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => setDetailLead(lead)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-400">{lead.company || lead.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {lead.phone ? (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald-500" /> {lead.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        type === "Flat Buyer" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                        type === "Plot Buyer" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {lead.language ? (
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                          <Globe size={11} className="text-slate-400" /> {lead.language}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {locs.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {locs.slice(0, 2).map((l, i) => (
                            <span key={i} className="text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {l}
                            </span>
                          ))}
                          {locs.length > 2 && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                              +{locs.length - 2}
                            </span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {type === "Flat Buyer" && (lead.bhk_requirement || lead.bhkRequirement || "—")}
                      {type === "Plot Buyer" && (lead.plot_size_sqyd ? `${lead.plot_size_sqyd} sq yd` : (lead.plotSize || "—"))}
                      {type === "Land Buyer" && (lead.land_size ? `${lead.land_size} ${lead.land_size_unit || "Acres"}` : "—")}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">
                      {lead.budget || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {lead.purchase_timeline || lead.purchaseTimeline || lead.planToPurchase || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge value={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        onView={() => setDetailLead(lead)}
                        onEdit={() => openEditModal(lead)}
                        onDelete={isOrgAdmin ? () => setDeleteTarget(lead) : undefined}
                        extra={[
                          ...(lead.status !== "Converted"
                            ? [{ label: "Convert to Customer", onClick: () => setConvertTarget(lead) }]
                            : []),
                        ]}
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

      {/* Add / Edit Lead Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeLead ? "Edit Real Estate Lead" : "Add Real Estate Lead"}
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
              form="lead-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : activeLead ? "Save Changes" : "Create Lead"}
            </button>
          </>
        }
      >
        <form id="lead-form" onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Lead Type Tabs Selector (B2) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5 uppercase tracking-wide">
              Lead Category / Type *
            </label>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
              {LEAD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormLeadType(t)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    formLeadType === t
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Contact / WhatsApp No. *</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 2: Language (B1) & Preferred Location Multi-Select (B1) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Language *</label>
              <EditableSelect
                vertical="real_estate"
                category="lead_language"
                value={formLanguage}
                onChange={setFormLanguage}
                placeholder="Select Language"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Preferred Location(s) (Multi-Select) *</label>
              <EditableMultiSelect
                vertical="real_estate"
                category="lead_location"
                value={formLocation}
                onChange={setFormLocation}
                placeholder="Select Preferred Locations"
              />
            </div>
          </div>

          {/* Row 3: Budget & Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Budget</label>
              <input
                type="text"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                placeholder="e.g. ₹50 - 70 Lakhs"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Purchase Timeline</label>
              <EditableSelect
                vertical="real_estate"
                category="lead_purchase_timeline"
                value={formTimeline}
                onChange={setFormTimeline}
                placeholder="Select Timeline"
              />
            </div>
          </div>

          {/* CONDITIONAL FIELDS BASED ON LEAD TYPE */}

          {/* ── FLAT BUYER ── */}
          {formLeadType === "Flat Buyer" && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Flat Requirements</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">BHK Requirement</label>
                  <EditableSelect
                    vertical="real_estate"
                    category="lead_bhk"
                    value={formBhk}
                    onChange={setFormBhk}
                    placeholder="BHK"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Purpose</label>
                  <EditableSelect
                    vertical="real_estate"
                    category="lead_purpose_flat"
                    value={formPurpose}
                    onChange={setFormPurpose}
                    placeholder="Purpose"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Property Status</label>
                  <EditableSelect
                    vertical="real_estate"
                    category="lead_property_status"
                    value={formPropertyStatus}
                    onChange={setFormPropertyStatus}
                    placeholder="Status"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PLOT BUYER ── */}
          {formLeadType === "Plot Buyer" && (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Plot Requirements</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Purpose</label>
                  <EditableSelect
                    vertical="real_estate"
                    category="lead_purpose_plot"
                    value={formPurpose}
                    onChange={setFormPurpose}
                    placeholder="Purpose"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Plot Size (in Sq Yd.)</label>
                  <input
                    type="number"
                    step="any"
                    value={formPlotSizeSqyd}
                    onChange={(e) => setFormPlotSizeSqyd(e.target.value)}
                    placeholder="e.g. 200"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── LAND BUYER ── */}
          {formLeadType === "Land Buyer" && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Land Requirements</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Purpose</label>
                  <EditableSelect
                    vertical="real_estate"
                    category="lead_purpose_land"
                    value={formPurpose}
                    onChange={setFormPurpose}
                    placeholder="Purpose"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Land Size & Unit</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="text"
                      value={formLandSize}
                      onChange={(e) => setFormLandSize(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <EditableSelect
                      vertical="real_estate"
                      category="lead_land_size_unit"
                      value={formLandSizeUnit}
                      onChange={setFormLandSizeUnit}
                      placeholder="Unit"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Requirements textarea */}
          <div>
            <label className="text-xs font-medium text-gray-600">Other Requirements</label>
            <textarea
              rows={2}
              value={formOtherRequirements}
              onChange={(e) => setFormOtherRequirements(e.target.value)}
              placeholder="Any specific preferences or notes..."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Source</label>
              <input
                type="text"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                placeholder="e.g. Website, Referral, Social Media"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Org Admin Only) */}
      {isOrgAdmin && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Lead"
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                {saving ? "Deleting..." : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to delete lead <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        open={!!convertTarget}
        lead={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConverted={({ lead: updated }) => {
          setLeads((prev) => prev.map((l) => (l.id === updated?.id ? { ...l, status: "Converted" } : l)));
          setConvertTarget(null);
        }}
      />

      {/* Lead Detail Side Panel */}
      {detailLead && (
        <LeadDetailPanel
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onUpdated={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setDetailLead(updated);
          }}
        />
      )}
    </div>
  );
}
