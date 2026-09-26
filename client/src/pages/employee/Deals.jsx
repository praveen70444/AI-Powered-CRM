import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, CalendarDays, User, X, Pencil, Trash2, IndianRupee, Building2, Calendar } from "lucide-react";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import TagsInput from "../../components/employee/TagsInput";
import StatusBadge from "../../components/employee/StatusBadge";
import DealHealthBadge from "../../components/ai/DealHealthBadge";
import NextActionBanner from "../../components/ai/NextActionBanner";
import { DEAL_STAGES } from "../../mock/deals";
import { getDeals, createDeal, updateDeal, deleteDeal, exportDeals, getNotes, createNote } from "../../services/employeeService";
import { getDealHealthSummary, getDealNextAction } from "../../services/aiService";
import api from "../../services/api";

const STAGE_STYLES = {
  New:         "border-t-blue-500",
  Qualified:   "border-t-sky-500",
  Proposal:    "border-t-amber-500",
  Negotiation: "border-t-orange-500",
  Won:         "border-t-emerald-500",
  Lost:        "border-t-red-500",
};

const STAGE_BG = {
  New:         "bg-blue-50/60",
  Qualified:   "bg-sky-50/60",
  Proposal:    "bg-amber-50/60",
  Negotiation: "bg-orange-50/60",
  Won:         "bg-emerald-50/60",
  Lost:        "bg-red-50/60",
};

function formatValue(value) {
  return `₹${(value / 100000).toFixed(1)}L`;
}

// ── Deal Detail Panel ──────────────────────────────────────────────────────
function DealDetailPanel({ deal, onClose, onEdit, onDelete, onStageChange }) {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [tab, setTab] = useState("notes");

  useEffect(() => {
    if (!deal) return;
    setLoadingNotes(true);
    // Fetch notes related to this deal
    api.get(`/employee/notes?relatedType=Deal`)
      .then((r) => {
        const dealNotes = (r.data?.data || r.data || []).filter(
          (n) => n.relatedTo === deal.title || n.relatedId === deal.id
        );
        setNotes(dealNotes);
      })
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, [deal]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const r = await api.post("/employee/notes", {
        relatedTo: deal.title,
        relatedType: "Deal",
        content: newNote.trim(),
      });
      setNotes((prev) => [r.data.data || r.data, ...prev]);
      setNewNote("");
    } catch { /* silent */ }
    finally { setSavingNote(false); }
  };

  const removeNote = async (id) => {
    try {
      await api.delete(`/employee/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch { /* silent */ }
  };

  const fmt = (d) => !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = (d) => !d ? "" : new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-100 shrink-0 border-t-4 ${STAGE_STYLES[deal.stage]}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{deal.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">{deal.company}</span>
                <StatusBadge value={deal.stage} />
                <span className="text-sm font-bold text-blue-600">{formatValue(deal.value)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
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
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: "notes", label: `Notes (${notes.length})` },
            { key: "details", label: "Details" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Notes Tab */}
          {tab === "notes" && (
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-amber-700">Add Deal Note</p>
                <textarea rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Progress updates, meeting outcomes, next steps..."
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white resize-none"
                />
                <div className="flex justify-end">
                  <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {savingNote ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>

              {loadingNotes ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notes yet. Add one above.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{n.content}</p>
                        <button onClick={() => removeNote(n.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs shrink-0">Del</button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{n.author}</span>
                        <span>·</span>
                        <span>{fmtTime(n.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {tab === "details" && (
            <div className="p-6 space-y-4">
              {[
                { icon: Building2, label: "Company", value: deal.company },
                { icon: IndianRupee, label: "Deal Value", value: formatValue(deal.value) },
                { icon: Calendar, label: "Expected Close", value: fmt(deal.closeDate) },
                { icon: User, label: "Owner", value: deal.owner },
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

              {/* Stage change */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Move Stage</p>
                <div className="flex flex-wrap gap-2">
                  {DEAL_STAGES.map((s) => (
                    <button key={s} onClick={() => onStageChange(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        s === deal.stage
                          ? "bg-blue-600 text-white border-blue-600"
                          : "text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {deal.ai_health_score != null && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Deal Health</p>
                  <DealHealthBadge score={deal.ai_health_score} label={deal.ai_health_label} riskFlags={deal.ai_risk_flags || []} showFlags />
                </div>
              )}

              <NextActionBanner fetchFn={() => getDealNextAction(deal.id)} entityId={deal.id} />

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <TagsInput entityType="deal" entityId={deal.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Deals Page ────────────────────────────────────────────────────────
function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [detailDeal, setDetailDeal] = useState(null);
  const [scoringDeals, setScoringDeals] = useState(false);

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const response = await getDeals();
      setDeals(response.data);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to load deals.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const runDealHealth = async () => {
    setScoringDeals(true);
    try {
      await getDealHealthSummary();
      await loadDeals();
    } catch { /* silent */ }
    finally { setScoringDeals(false); }
  };

  const columns = useMemo(() => DEAL_STAGES.map((stage) => ({
    stage,
    items: deals.filter((d) => d.stage === stage),
  })), [deals]);

  async function handleDrop(stage) {
    if (!draggedId) return;
    const dealId = draggedId;
    setDraggedId(null);
    if (deals.find((d) => d.id === dealId)?.stage === stage) return;
    const previous = deals;
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage } : d));
    if (detailDeal?.id === dealId) setDetailDeal((p) => ({ ...p, stage }));
    try {
      const r = await updateDeal(dealId, { stage });
      setDeals((prev) => prev.map((d) => d.id === dealId ? r.data : d));
    } catch {
      setDeals(previous);
    }
  }

  async function handleStageChange(stage) {
    if (!detailDeal || detailDeal.stage === stage) return;
    const previous = deals;
    setDeals((prev) => prev.map((d) => d.id === detailDeal.id ? { ...d, stage } : d));
    setDetailDeal((p) => ({ ...p, stage }));
    try {
      const r = await updateDeal(detailDeal.id, { stage });
      setDeals((prev) => prev.map((d) => d.id === detailDeal.id ? r.data : d));
      setDetailDeal(r.data);
    } catch {
      setDeals(previous);
    }
  }

  async function handleAddSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      title: form.get("title"),
      company: form.get("company"),
      stage: form.get("stage"),
      value: Number(form.get("value")) || 0,
      closeDate: form.get("closeDate") || null,
    };
    setSaving(true); setError("");
    try {
      const r = await createDeal(payload);
      setDeals((prev) => [r.data, ...prev]);
      setAddModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to create deal.");
    } finally { setSaving(false); }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      title: form.get("title"),
      company: form.get("company"),
      stage: form.get("stage"),
      value: Number(form.get("value")) || 0,
      closeDate: form.get("closeDate") || null,
    };
    setSaving(true); setError("");
    try {
      const r = await updateDeal(editTarget.id, payload);
      setDeals((prev) => prev.map((d) => d.id === editTarget.id ? r.data : d));
      if (detailDeal?.id === editTarget.id) setDetailDeal(r.data);
      setEditModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to update deal.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true); setError("");
    try {
      await deleteDeal(deleteTarget.id);
      setDeals((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      if (detailDeal?.id === deleteTarget.id) setDetailDeal(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete deal.");
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {deals.length} deals · Pipeline {formatValue(deals.reduce((s, d) => s + d.value, 0))}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={runDealHealth} disabled={scoringDeals || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            {scoringDeals ? "Analyzing…" : "✨ Deal Health"}
          </button>
          <ExportMenu onExport={exportDeals} />
          <button onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading deals...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.stage)}
              className="w-72 shrink-0"
            >
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl ${STAGE_BG[col.stage] || "bg-gray-50"}`}>
                <h3 className="text-sm font-semibold text-gray-700">{col.stage}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatValue(col.items.reduce((s, d) => s + d.value, 0))}</span>
                  <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 border border-gray-200">{col.items.length}</span>
                </div>
              </div>
              <div className="space-y-3 min-h-[120px]">
                {col.items.map((deal) => (
                  <div key={deal.id}
                    draggable
                    onDragStart={() => setDraggedId(deal.id)}
                    onClick={() => setDetailDeal(deal)}
                    className={`bg-white rounded-xl border border-gray-200 border-t-4 ${STAGE_STYLES[deal.stage]} shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">{deal.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{deal.company}</p>
                      </div>
                      {/* Inline edit/delete appear on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditTarget(deal); setEditModalOpen(true); }}
                          className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        ><Pencil size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(deal); }}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        ><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 mt-3">{formatValue(deal.value)}</p>
                    {deal.ai_health_score != null && (
                      <div className="mt-2">
                        <DealHealthBadge score={deal.ai_health_score} label={deal.ai_health_label} riskFlags={deal.ai_risk_flags || []} showFlags />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User size={12} /> {deal.owner?.split(" ")[0]}</span>
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {deal.closeDate || "—"}</span>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Deal Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Deal"
        footer={
          <>
            <button onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="add-deal-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Add Deal"}
            </button>
          </>
        }
      >
        <form id="add-deal-form" onSubmit={handleAddSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Deal Title *</label>
            <input name="title" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Company *</label>
            <input name="company" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Stage</label>
              <select name="stage" defaultValue={DEAL_STAGES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Value (₹)</label>
              <input type="number" name="value" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Expected Close Date</label>
            <input type="date" name="closeDate" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Edit Deal Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Deal"
        footer={
          <>
            <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="edit-deal-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-deal-form" onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Deal Title *</label>
              <input name="title" defaultValue={editTarget.title} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company *</label>
              <input name="company" defaultValue={editTarget.company} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Stage</label>
                <select name="stage" defaultValue={editTarget.stage} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Value (₹)</label>
                <input type="number" name="value" defaultValue={editTarget.value} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Expected Close Date</label>
              <input type="date" name="closeDate" defaultValue={editTarget.closeDate} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Deal"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Delete <span className="font-medium text-gray-900">{deleteTarget?.title}</span>? This cannot be undone.</p>
      </Modal>

      {/* Deal Detail Panel */}
      {detailDeal && (
        <DealDetailPanel
          deal={detailDeal}
          onClose={() => setDetailDeal(null)}
          onEdit={() => { setEditTarget(detailDeal); setEditModalOpen(true); }}
          onDelete={() => { setDeleteTarget(detailDeal); setDetailDeal(null); }}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}

export default Deals;
