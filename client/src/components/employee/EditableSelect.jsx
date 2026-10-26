import { useState } from "react";
import { Plus, Pencil, Check, X, Trash2, ChevronDown } from "lucide-react";
import { useDropdown } from "../../services/dropdownService";
import { useAuth } from "../../context/AuthContext";

/**
 * EditableSelect — a dropdown where Org Admins can add/rename/deactivate options.
 *
 * Props:
 *   vertical    — 'real_estate' | 'construction'
 *   category    — e.g. 'lead_language'
 *   value       — current selected value (controlled)
 *   onChange    — called with new string value
 *   placeholder — placeholder text
 *   required    — HTML required attr
 *   id          — HTML id
 */
export default function EditableSelect({
  vertical, category, value, onChange, placeholder = "— Select —",
  required = false, id, className = "",
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

  const selectValue = (v) => {
    onChange(v);
    setOpen(false);
  };

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true); setError("");
    try {
      const opt = await addOption(newValue.trim());
      onChange(opt.value);
      setNewValue(""); setAddingNew(false); setOpen(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleRename = async (id) => {
    if (!editValue.trim()) return;
    setSaving(true); setError("");
    try {
      await renameOption(id, editValue.trim());
      setEditingId(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id, e) => {
    e.stopPropagation();
    setSaving(true); setError("");
    try {
      await deactivateOption(id);
      if (value === options.find((o) => o.id === id)?.value) onChange("");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const displayValue = value || "";

  return (
    <div className="relative" id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setAddingNew(false); setError(""); }}
        className={`w-full flex items-center justify-between mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors text-left ${className}`}
      >
        <span className={displayValue ? "text-gray-900" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {/* Clear option */}
            {!required && (
              <button
                type="button"
                onClick={() => selectValue("")}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
              >
                — Clear —
              </button>
            )}

            {loading ? (
              <p className="px-4 py-3 text-sm text-gray-400">Loading...</p>
            ) : options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No options yet. Add one below.</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center group px-4 py-2.5 hover:bg-blue-50 transition-colors ${value === opt.value ? "bg-blue-50" : ""}`}
                >
                  {editingId === opt.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(opt.id); if (e.key === "Escape") setEditingId(null); }}
                        className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-sm focus:outline-none"
                      />
                      <button type="button" onClick={() => handleRename(opt.id)} disabled={saving} className="text-blue-600 hover:text-blue-700">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => selectValue(opt.value)}
                        className={`flex-1 text-left text-sm ${value === opt.value ? "font-semibold text-blue-700" : "text-gray-700"}`}
                      >
                        {opt.value}
                      </button>
                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingId(opt.id); setEditValue(opt.value); }}
                            className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
                            title="Rename"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeactivate(opt.id, e)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Remove option"
                          >
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

          {/* Add new option */}
          <div className="border-t border-gray-100 p-2">
            {addingNew ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingNew(false); setNewValue(""); } }}
                  placeholder="New option..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button type="button" onClick={handleAdd} disabled={saving || !newValue.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "..." : "Add"}
                </button>
                <button type="button" onClick={() => { setAddingNew(false); setNewValue(""); }} className="px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingNew(true)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={13} /> Add new option
              </button>
            )}
            {error && <p className="text-xs text-red-600 mt-1 px-2">{error}</p>}
          </div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" value={value || ""} required={required} />
    </div>
  );
}
