import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Users, AlertCircle, X, Plus, Upload, ChevronRight, Phone, Calendar, Building2, Target, IndianRupee, MapPin, Eye, Pencil, Trash2 } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import ConvertLeadModal from "../../components/employee/ConvertLeadModal";
import TagsInput from "../../components/employee/TagsInput";
import LeadScoreBadge from "../../components/ai/LeadScoreBadge";
import NextActionBanner from "../../components/ai/NextActionBanner";
import AIEmailComposer from "../../components/ai/AIEmailComposer";
import { LEAD_STATUSES, LEAD_SOURCES } from "../../mock/leads";
import {
  getLeads, createLead, updateLead, deleteLead,
  getLeadFollowups, createLeadFollowup, updateLeadFollowup, deleteLeadFollowup,
  bulkUploadLeads,
} from "../../services/employeeService";
import { exportLeads } from "../../services/exportService";
import { scoreAllLeads, getLeadNextAction } from "../../services/aiService";
import api from "../../services/api";

const PAGE_SIZE = 6;

const PURPOSE_OPTIONS = [
  "Building Dream House", "Investment", "Business/Commercial", "Rental Income", "Other",
];
const PLOT_SIZE_OPTIONS = [
  "167 sq yd.", "200 sq yd.", "300 sq yd.", "500 sq yd.", "1,000 sq yd.", "Custom",
];
const BUDGET_OPTIONS = [
  "₹30 - ₹40 Lakhs", "₹50 - ₹70 Lakhs", "₹70 Lakhs - ₹1 Crore", "₹1 Crore+", "Custom",
];
const PLAN_OPTIONS = [
  "Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring",
];
const SITE_VISIT_OPTIONS = ["Yes", "No", "Not Yet", "Need More Details"];

// ── Lead Detail Side Panel ─────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onUpdated }) {
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNext, setEditNext] = useState("");
  const [activeTab, setActiveTab] = useState("followups");

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

  const saveEdit = async (f) => {
    try {
      const r = await updateLeadFollowup(f.id, {
        note: editNote || f.note,
        followupDate: editDate || f.followupDate,
        nextFollowupDate: editNext || null,
      });
      setFollowups((prev) => prev.map((x) => (x.id === f.id ? r.data : x)));
      setEditingFollowup(null);
    } catch { /* silent */ }
  };

  const removeFollowup = async (id) => {
    try {
      await deleteLeadFollowup(id);
      setFollowups((prev) => prev.filter((f) => f.id !== id));
    } catch { /* silent */ }
  };

  const fmt = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{lead.name}</h2>
            <p className="text-xs text-gray-400">{lead.company} · {lead.phone || "No phone"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {["followups", "details"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "followups" ? `Follow-up History (${followups.length})` : "Lead Details"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Follow-up Tab ── */}
          {activeTab === "followups" && (
            <div className="p-6 space-y-5">
              {/* Add new follow-up */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-blue-700">Add Follow-up Note</p>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What happened in this follow-up? Update lead status, discussed requirements..."
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Next Follow-up Date</label>
                    <input type="date" value={nextFollowupDate} onChange={(e) => setNextFollowupDate(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <button onClick={addFollowup} disabled={savingNote || !newNote.trim()}
                    className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {savingNote ? "Saving..." : "Add"}
                  </button>
                </div>
              </div>

              {/* Follow-up history */}
              {loadingFollowups ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading history...</p>
              ) : followups.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No follow-ups yet. Add the first one above.</p>
              ) : (
                <div className="space-y-3">
                  {followups.map((f) => (
                    <div key={f.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                      {editingFollowup === f.id ? (
                        <div className="space-y-2">
                          <textarea rows={3} value={editNote} onChange={(e) => setEditNote(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Follow-up Date</label>
                              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Next Follow-up</label>
                              <input type="date" value={editNext} onChange={(e) => setEditNext(e.target.value)}
                                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(f)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            <button onClick={() => setEditingFollowup(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{f.note}</p>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => { setEditingFollowup(f.id); setEditNote(f.note); setEditDate(f.followupDate?.split("T")[0] || ""); setEditNext(f.nextFollowupDate?.split("T")[0] || ""); }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xs"
                              >Edit</button>
                              <button onClick={() => removeFollowup(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs">Del</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(f.followupDate)}</span>
                            {f.nextFollowupDate && (
                              <span className="flex items-center gap-1 text-amber-600"><Calendar size={11} /> Next: {fmt(f.nextFollowupDate)}</span>
                            )}
                            <span>by {f.author}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Details Tab ── */}
          {activeTab === "details" && (
            <div className="p-6 space-y-4">
              {[
                { icon: Building2, label: "Company", value: lead.company },
                { icon: Phone, label: "Phone", value: lead.phone },
                { icon: Target, label: "Purpose of Purchase", value: lead.purposeOfPurchase },
                { icon: MapPin, label: "Plot Size Required", value: lead.plotSize },
                { icon: IndianRupee, label: "Budget", value: lead.budget },
                { icon: Calendar, label: "Plan to Purchase", value: lead.planToPurchase },
                { icon: Eye, label: "Site Visit", value: lead.siteVisit },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Status</p>
                    <StatusBadge value={lead.status} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Source</p>
                    <p className="text-sm text-gray-800 mt-0.5">{lead.source || "—"}</p>
                  </div>
                </div>
              </div>
              {lead.aiScore !== null && lead.aiScore !== undefined && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-center gap-3">
                  <LeadScoreBadge score={lead.aiScore} label={lead.aiScoreLabel} />
                  <p className="text-xs text-violet-700">AI Lead Score</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulk Upload Modal ──────────────────────────────────────────────────────
function BulkUploadModal({ open, onClose, onDone }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(file);
  };

  const parseCSV = (raw) => {
    const lines = raw.trim().split("\n");
    if (lines.length < 2) return [];
    // detect separator — tab or comma
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
    return lines.slice(1).map((line) => {
      const cols = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, "").replace(/^p:/, "").replace(/^z:/, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
      return obj;
    }).filter((r) => r.full_name || r.name);
  };

  const handleUpload = async () => {
    if (!text.trim()) { setError("Paste CSV content or select a file"); return; }
    setError("");
    setUploading(true);
    try {
      const leads = parseCSV(text);
      if (leads.length === 0) { setError("No valid rows found. Check the CSV format."); setUploading(false); return; }
      const r = await bulkUploadLeads(leads);
      setResult(r.data);
      onDone && onDone();
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setText(""); setResult(null); setError(""); };

  if (!open) return null;
  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Bulk Upload Leads"
      footer={
        result ? (
          <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Done</button>
        ) : (
          <>
            <button onClick={() => { reset(); onClose(); }} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={handleUpload} disabled={uploading || !text.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            <p className="font-medium">Upload Complete</p>
            <p className="mt-1">✅ {result.created} leads created · ⚠️ {result.skipped} skipped</p>
          </div>
          {result.errors?.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-red-100 rounded-xl p-3 space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">Row {e.row}: {e.reason}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
            <p className="font-medium">Expected CSV columns (Facebook Lead Ads format):</p>
            <p className="font-mono text-xs text-blue-600">
              full_name · phone · purpose_of_purchase · plot_size_required · budget · plan_to_purchase · would_you_like_to_schedule_a_free_site_visit · lead_status · platform
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Upload CSV file</label>
            <input type="file" accept=".csv,.tsv,.txt" ref={fileRef} onChange={handleFile}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Or paste CSV content directly</label>
            <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"full_name\tphone\tpurpose_of_purchase\tplot_size_required\tbudget\tplan_to_purchase\n\"Rahul Sharma\"\t+919876543210\tbuilding_dream_house\t167_sq_yd.\t₹30 - ₹40 lakhs\timmediately"}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={13} />{error}</p>}
        </div>
      )}
    </Modal>
  );
}

// ── Main Leads Page ────────────────────────────────────────────────────────
function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [convertTarget, setConvertTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dupWarning, setDupWarning] = useState("");
  const [scoringAll, setScoringAll] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getLeads();
      setLeads(response.data);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const runScoreAll = async () => {
    setScoringAll(true);
    try {
      const res = await scoreAllLeads();
      const scoreMap = {};
      (res.data?.results || []).forEach((r) => {
        scoreMap[r.leadId] = { ai_score: r.score, ai_score_label: r.label, aiScore: r.score, aiScoreLabel: r.label };
      });
      setLeads((prev) => prev.map((l) => (scoreMap[l.id] ? { ...l, ...scoreMap[l.id] } : l)));
    } catch { /* silent */ }
    finally { setScoringAll(false); }
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.phone || "").includes(search);
      const matchesStatus = status ? l.status === status : true;
      const matchesSource = source ? l.source === source : true;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, status, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAddModal() { setActiveLead(null); setDupWarning(""); setModalOpen(true); }
  function openEditModal(lead) { setActiveLead(lead); setDupWarning(""); setModalOpen(true); }

  async function checkDuplicate(email, phone) {
    if (!email && !phone) return;
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);
      if (activeLead) params.append("excludeId", activeLead.id);
      const res = await api.get(`/employee/leads/check-duplicate?${params}`);
      const dupes = res.data?.data?.duplicates || [];
      setDupWarning(dupes.length > 0 ? `⚠️ Similar lead exists: ${dupes[0].name} (${dupes[0].email})` : "");
    } catch { /* silent */ }
  }

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get("name"),
      company: form.get("company") || "—",
      email: form.get("email"),
      phone: form.get("phone"),
      status: form.get("status"),
      source: form.get("source"),
      value: Number(form.get("value")) || 0,
      purposeOfPurchase: form.get("purposeOfPurchase") || null,
      plotSize: form.get("plotSize") || null,
      budget: form.get("budget") || null,
      planToPurchase: form.get("planToPurchase") || null,
      siteVisit: form.get("siteVisit") || null,
    };
    setSaving(true);
    setError("");
    try {
      if (activeLead) {
        const response = await updateLead(activeLead.id, payload);
        setLeads((prev) => prev.map((l) => (l.id === activeLead.id ? response.data : l)));
        if (detailLead?.id === activeLead.id) setDetailLead(response.data);
      } else {
        const response = await createLead(payload);
        setLeads((prev) => [response.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save lead.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await deleteLead(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 pt-4 gap-2 flex-wrap">
        <button onClick={() => setBulkOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Upload size={13} /> Bulk Upload
        </button>
        <button onClick={runScoreAll} disabled={scoringAll || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
        >
          {scoringAll ? "Scoring…" : "✨ Score All Leads"}
        </button>
        <ExportMenu onExport={exportLeads} />
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, phone, company..."
        addLabel="Add Lead"
        onAddClick={openAddModal}
        filters={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={LEAD_STATUSES} allLabel="All Statuses" />
            <FilterSelect value={source} onChange={(v) => { setSource(v); setPage(1); }} options={LEAD_SOURCES} allLabel="All Sources" />
          </>
        }
      />

      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading leads...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description="Try adjusting filters or add a new lead."
          actionLabel="Add Lead" onAction={openAddModal}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Lead Name</th>
                <th className="px-4 py-3 font-medium">Contact No.</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Plot Size</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Site Visit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">AI Score</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailLead(lead)} className="text-left group">
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {lead.name} <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-400" />
                      </p>
                      <p className="text-xs text-gray-400">{lead.company}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{lead.purposeOfPurchase || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.plotSize || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.budget || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.planToPurchase || "—"}</td>
                  <td className="px-4 py-3">
                    {lead.siteVisit ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.siteVisit === "Yes" ? "bg-green-50 text-green-700" :
                        lead.siteVisit === "No" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-700"
                      }`}>{lead.siteVisit}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={lead.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.source || "—"}</td>
                  <td className="px-4 py-3">
                    <LeadScoreBadge score={lead.aiScore ?? lead.ai_score} label={lead.aiScoreLabel ?? lead.ai_score_label} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      onView={() => setDetailLead(lead)}
                      onEdit={() => openEditModal(lead)}
                      onDelete={() => setDeleteTarget(lead)}
                      extra={[
                        { label: "✨ Compose Email", onClick: () => { setActiveLead(lead); setEmailComposerOpen(true); } },
                        ...(lead.status !== "Converted" ? [{ label: "Convert to Customer", onClick: () => setConvertTarget(lead) }] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeLead ? "Edit Lead" : "Add Lead"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="lead-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeLead ? "Save Changes" : "Add Lead"}
            </button>
          </>
        }
      >
        <form id="lead-form" onSubmit={handleSave} className="space-y-4">
          {dupWarning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />{dupWarning}
            </div>
          )}
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Full Name *</label>
              <input name="name" defaultValue={activeLead?.name} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone / Contact No.</label>
              <input name="phone" defaultValue={activeLead?.phone}
                onBlur={(e) => checkDuplicate("", e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <input type="email" name="email" defaultValue={activeLead?.email}
                onBlur={(e) => checkDuplicate(e.target.value, "")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company</label>
              <input name="company" defaultValue={activeLead?.company} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          {/* Row 3 — real-estate fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Purpose of Purchase</label>
              <select name="purposeOfPurchase" defaultValue={activeLead?.purposeOfPurchase || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {PURPOSE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Plot Size Required</label>
              <select name="plotSize" defaultValue={activeLead?.plotSize || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {PLOT_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Budget</label>
              <select name="budget" defaultValue={activeLead?.budget || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Plan to Purchase</label>
              <select name="planToPurchase" defaultValue={activeLead?.planToPurchase || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {PLAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {/* Row 5 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Site Visit</label>
              <select name="siteVisit" defaultValue={activeLead?.siteVisit || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {SITE_VISIT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select name="status" defaultValue={activeLead?.status || LEAD_STATUSES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Row 6 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Source</label>
              <select name="source" defaultValue={activeLead?.source || LEAD_SOURCES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Deal Value (₹)</label>
              <input type="number" name="value" defaultValue={activeLead?.value} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          {activeLead && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags</label>
              <TagsInput entityType="lead" entityId={activeLead.id} />
            </div>
          )}
          {activeLead && (
            <NextActionBanner fetchFn={() => getLeadNextAction(activeLead.id)} entityId={activeLead.id} />
          )}
          {activeLead && (
            <button type="button" onClick={() => setEmailComposerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all font-medium"
            >
              <span className="text-lg">✨</span> Compose AI Email
            </button>
          )}
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Lead"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
      </Modal>

      {/* Convert Lead Modal */}
      <ConvertLeadModal open={!!convertTarget} lead={convertTarget} onClose={() => setConvertTarget(null)}
        onConverted={({ lead: updatedLead }) => {
          setLeads((prev) => prev.map((l) => (l.id === updatedLead?.id ? { ...l, status: "Converted" } : l)));
          setConvertTarget(null);
        }}
      />

      {/* AI Email Composer */}
      {emailComposerOpen && activeLead && (
        <AIEmailComposer entityType="lead" entityId={activeLead.id} entityName={activeLead.name} onClose={() => setEmailComposerOpen(false)} />
      )}

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

      {/* Bulk Upload Modal */}
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} onDone={loadLeads} />
    </div>
  );
}
export default Leads;
