import { useEffect, useMemo, useState } from "react";
import { StickyNote, Plus, Trash2, X } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import { getNotes, createNote, deleteNote } from "../../services/employeeService";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailNote, setDetailNote] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadNotes() {
      try {
        setLoading(true); setError("");
        const response = await getNotes();
        if (!isMounted) return;
        setNotes(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load notes.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadNotes();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => notes.filter(
    (n) => n.content.toLowerCase().includes(search.toLowerCase()) ||
           (n.relatedTo || "").toLowerCase().includes(search.toLowerCase())
  ), [notes, search]);

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      relatedTo: form.get("relatedTo"),
      relatedType: form.get("relatedType"),
      content: form.get("content"),
    };
    setSaving(true); setError("");
    try {
      const response = await createNote(payload);
      setNotes((prev) => [response.data, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save note.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true); setError("");
    try {
      await deleteNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (detailNote?.id === deleteTarget.id) setDetailNote(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete note.");
    } finally { setSaving(false); }
  }

  const fmtTime = (d) => !d ? "" : new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const TYPE_COLORS = {
    Lead:     "bg-blue-50 text-blue-600 border-blue-100",
    Customer: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Deal:     "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search notes..."
        addLabel="Add Note"
        onAddClick={() => setModalOpen(true)}
        filters={null}
      />

      {error && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading notes...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes found"
          description="Capture context on leads, customers, and deals so nothing gets lost."
          actionLabel="Add Note" onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setDetailNote(note)}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[note.relatedType] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                      {note.relatedType}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{note.relatedTo}</p>
                </div>
                {/* Inline delete — no 3-dot */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(note); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{note.content}</p>
              <p className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                {note.author} · {fmtTime(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Note"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="note-form" disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Plus size={15} /> {saving ? "Adding..." : "Add Note"}
            </button>
          </>
        }
      >
        <form id="note-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Related To</label>
            <input name="relatedTo" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Type</label>
            <select name="relatedType" defaultValue="Lead" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
              <option>Lead</option>
              <option>Customer</option>
              <option>Deal</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Note</label>
            <textarea name="content" rows={4} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none" />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Note"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Delete this note? This cannot be undone.</p>
      </Modal>

      {/* Note Detail Panel */}
      {detailNote && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailNote(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[detailNote.relatedType] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                  {detailNote.relatedType}
                </span>
                <p className="text-base font-semibold text-gray-900 mt-1">{detailNote.relatedTo}</p>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button onClick={() => { setDeleteTarget(detailNote); setDetailNote(null); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setDetailNote(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{detailNote.content}</p>
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                {detailNote.author} · {fmtTime(detailNote.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
