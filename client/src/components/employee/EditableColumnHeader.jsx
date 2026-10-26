import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

/**
 * useColumnLabels – persists column label overrides in localStorage.
 *
 * @param {string} storageKey  – unique key per page, e.g. "col_labels_leads"
 * @param {Object} defaults    – { colKey: "Default Label", ... }
 */
export function useColumnLabels(storageKey, defaults) {
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  });

  const updateLabel = (colKey, newLabel) => {
    const trimmed = newLabel.trim() || defaults[colKey];
    setLabels((prev) => {
      const next = { ...prev, [colKey]: trimmed };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { labels, updateLabel };
}

/**
 * EditableColumnHeader – renders a <th> with inline rename capability.
 *
 * Usage:
 *   <EditableColumnHeader colKey="name" labels={colLabels} defaults={DEFAULTS} updateLabel={updateColLabel} />
 *
 * - Click the ✏️ icon OR double-click the text to rename
 * - Press Enter or click away to save
 * - Press Escape to cancel
 * - Custom names are shown in blue
 * - Labels persist across page reloads (localStorage)
 */
export function EditableColumnHeader({
  colKey,
  labels,
  defaults,
  updateLabel,
  className = "",
}) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState("");
  const [hovered, setHovered]   = useState(false);
  const inputRef                = useRef(null);

  const isCustom = labels[colKey] !== defaults[colKey];
  const label    = labels[colKey];

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(label);
    setEditing(true);
  };

  // Auto-focus + select all when edit mode opens
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    updateLabel(colKey, draft || label);
    setEditing(false);
  };

  // ── Edit Mode ──────────────────────────────────────────────
  if (editing) {
    return (
      <th className={`px-4 py-3 font-medium ${className}`}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter")  { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            minWidth: "60px",
            maxWidth: "150px",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 500,
            border: "1.5px solid #3b82f6",
            borderRadius: "4px",
            background: "#fff",
            color: "#1e293b",
            outline: "none",
            boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
            textTransform: "none",
            letterSpacing: "normal",
          }}
        />
      </th>
    );
  }

  // ── Display Mode ───────────────────────────────────────────
  return (
    <th
      className={`px-4 py-3 font-medium ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={startEdit}
      title="Double-click or click ✏️ to rename"
      style={{ whiteSpace: "nowrap", cursor: "default", position: "relative" }}
    >
      <span
        style={{
          color: isCustom ? "#3b82f6" : undefined,
          transition: "color 0.15s",
        }}
      >
        {label}
      </span>

      {/* Pencil button — shows on hover */}
      <button
        onClick={startEdit}
        title="Rename column"
        style={{
          marginLeft: "4px",
          padding: "1px 2px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s, color 0.15s",
          verticalAlign: "middle",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#3b82f6"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
      >
        <Pencil size={10} />
      </button>
    </th>
  );
}
