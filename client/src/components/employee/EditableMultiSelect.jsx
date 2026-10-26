import { useState } from "react";
import { Plus, Check, X, Trash2, ChevronDown, Pencil } from "lucide-react";
import { useDropdown } from "../../services/dropdownService";
import { useAuth } from "../../context/AuthContext";

/**
 * EditableMultiSelect — checkbox-style multi-select with editable options.
 *
 * Props:
 *   vertical    — 'real_estate' | 'construction'
 *   category    — e.g. 'lead_location'
 *   value       — array of selected strings (controlled)
 *   onChange    — called with new string[] value
 *   placeholder — placeholder text
 */
export default function EditableMultiSelect({
  vertical, category, value = [], onChange, placeholder = "— Select locations —",
  id, className = "",
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ORG_ADMIN";
  const { options, loading, addOption, renameOption, deactivateOption } = useDropdown(vertical, category);

  const [open, setOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = Array.isArray(value) ? value : (value ? value.split(",").map(s => s.trim()).filter(Boolean) : []);

  const toggle = (v) => {
    const next = selected.includes(v)
      ? selected.filter((s) => s !== v)
      : [...selected, v];
    onChange(next);
  };

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true); setError("");
    try {
      const opt = await addOption(newValue.trim());
      onChange([...selected, opt.value]);
      setNewValue(""); setAddingNew(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleRename = async (id, oldValue) => {
    if (!editValue.trim()) return;
    setSaving(true); setError("");
    try {
      await renameOption(id, editValue.trim());
      // Update selected if old value was in selection
      if (selected.includes(oldValue)) {
        onChange(selected.map((s) => (s === oldValue ? editValue.trim() : s)));
      }
      setEditingId(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id, optValue, e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await deactivateOption(id);
      onChange(selected.filter((s) => s !== optValue));
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? selected[0]
    : `${selected.length} locations selected`;

  return (
    <div className="relative" id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setAddingNew(false); setError(""); }}
        className={`w-full flex items-center justify-between mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors text-left ${className}`}
      >
        <span className={selected.length > 0 ? "text-gray-900" : "text-gray-400"}>
          {displayText}
        </span>
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Selected chips below trigger */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-blue-900">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-3 text-sm text-gray-400">Loading...</p>
            ) : options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No options yet.</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center group px-4 py-2.5 hover:bg-blue-50 transition-colors ${selected.includes(opt.value) ? "bg-blue-50/70" : ""}`}
                >
                  {editingId === opt.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(opt.id, opt.value); if (e.key === "Escape") setEditingId(null); }}
                        className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-sm focus:outline-none"
                      />
                      <button type="button" onClick={() => handleRename(opt.id, opt.value)} disabled={saving} className="text-blue-600"><Check size={14} /></button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-gray-400"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.includes(opt.value)}
                          onChange={() => toggle(opt.value)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                        <span className={`text-sm ${selected.includes(opt.value) ? "font-medium text-blue-700" : "text-gray-700"}`}>
                          {opt.value}
                        </span>
                      </label>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditValue(opt.value); }} className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600" title="Rename">
                            <Pencil size={12} />
                          </button>
                          <button type="button" onClick={(e) => handleDeactivate(opt.id, opt.value, e)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Remove">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add + Close */}
          <div className="border-t border-gray-100 p-2 space-y-2">
            {addingNew ? (
              <div className="flex items-center gap-2">
                <input autoFocus value={newValue} onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingNew(false); setNewValue(""); } }}
                  placeholder="New location..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
                <button type="button" onClick={handleAdd} disabled={saving || !newValue.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">
                  {saving ? "..." : "Add"}
                </button>
                <button type="button" onClick={() => { setAddingNew(false); setNewValue(""); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={13} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingNew(true)} className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                <Plus size={13} /> Add new location
              </button>
            )}
            {error && <p className="text-xs text-red-600 px-2">{error}</p>}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-gray-400">{selected.length} selected</span>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden input for form serialization */}
      <input type="hidden" value={JSON.stringify(selected)} />
    </div>
  );
}
