import React, { useState, useEffect } from "react";
import { Plus, X, Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge";
import api from "../../services/api";

export default function IndustryLeadDetailPanel({ lead, type, config, onClose, onUpdated }) {
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
    api.get(`/employee/industry-leads/${type}/${lead.id}/followups`)
      .then((r) => setFollowups(r.data.data || []))
      .catch(() => setFollowups([]))
      .finally(() => setLoadingFollowups(false));
  }, [lead, type]);

  const addFollowup = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const r = await api.post(`/employee/industry-leads/${type}/${lead.id}/followups`, {
        note: newNote.trim(),
        followupDate: new Date().toISOString().split("T")[0],
        nextFollowupDate: nextFollowupDate || null,
      });
      setFollowups((prev) => [r.data.data, ...prev]);
      setNewNote("");
      setNextFollowupDate("");
    } catch { /* silent */ }
    finally { setSavingNote(false); }
  };

  const saveEdit = async (f) => {
    try {
      const r = await api.put(`/employee/industry-leads/${type}/followups/${f.id}`, {
        note: editNote || f.note,
        followupDate: editDate || f.followupDate,
        nextFollowupDate: editNext || null,
      });
      setFollowups((prev) => prev.map((x) => (x.id === f.id ? r.data.data : x)));
      setEditingFollowup(null);
    } catch { /* silent */ }
  };

  const removeFollowup = async (id) => {
    try {
      await api.delete(`/employee/industry-leads/${type}/followups/${id}`);
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
            <p className="text-xs text-gray-400">{lead.whatsapp_number || "No phone"}</p>
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
                              <button onClick={() => { setEditingFollowup(f.id); setEditNote(f.note); setEditDate(f.followup_date?.split("T")[0] || ""); setEditNext(f.next_followup_date?.split("T")[0] || ""); }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xs"
                              >Edit</button>
                              <button onClick={() => removeFollowup(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs">Del</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(f.followup_date)}</span>
                            {f.next_followup_date && (
                              <span className="flex items-center gap-1 text-amber-600"><Calendar size={11} /> Next: {fmt(f.next_followup_date)}</span>
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
              {config.fields.map((f) => (
                <div key={f.name} className="flex flex-col">
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{lead[f.name] || "—"}</p>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex flex-col">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <StatusBadge value={lead.status} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
