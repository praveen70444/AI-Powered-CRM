import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

/**
 * useColumnLabels – persists column label overrides in localStorage.
 *
 * @param {string} storageKey  – unique key per page, e.g. "col_labels_leads"
 * @param {Object} defaults    – { colKey: "Default Label", ... }
 */
export function useColumnLabels(storageKey, defaults = {}) {
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  });

  // Re-sync if storageKey or defaults change (e.g. dynamic tabs)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setLabels(saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults });
    } catch {
      setLabels({ ...defaults });
    }
  }, [storageKey, JSON.stringify(defaults)]);

  const updateLabel = (colKey, newLabel) => {
    const trimmed = newLabel.trim() || defaults[colKey] || colKey;
    setLabels((prev) => {
      const next = { ...prev, [colKey]: trimmed };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return { labels, updateLabel };
}

/**
 * EditableColumnHeader – renders a <th> with inline rename capability.
 *
 * - Hover over any column header: subtle blue tint + pencil button brightens
 * - Click the ✏️ icon OR double-click the cell to rename
 * - Press Enter or click away to save
 * - Press Escape to cancel
 * - Custom names are highlighted in bold blue
 * - Labels persist across page reloads (localStorage)
 */
export function EditableColumnHeader({
  colKey,
  labels = {},
  defaults = {},
  updateLabel,
  className = "",
  style = {},
  align = "left",
  dark = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  const currentLabel = labels?.[colKey] ?? defaults?.[colKey] ?? colKey;
  const defaultLabel = defaults?.[colKey] ?? colKey;
  const isCustom = currentLabel !== defaultLabel;

  const startEdit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDraft(currentLabel);
    setEditing(true);
  };

  // Auto-focus + select text when edit mode opens
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    if (updateLabel) {
      updateLabel(colKey, draft || currentLabel);
    }
    setEditing(false);
  };

  // ── Edit Mode ──────────────────────────────────────────────
  if (editing) {
    return (
      <th
        className={`px-4 py-3 font-medium ${className}`}
        style={{ ...style, whiteSpace: "nowrap" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "inline-flex", alignItems: "center", width: "100%", maxWidth: "160px" }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              minWidth: "70px",
              padding: "3px 8px",
              fontSize: "12px",
              fontWeight: 600,
              border: dark ? "2px solid #38bdf8" : "2px solid #2563eb",
              borderRadius: "6px",
              background: dark ? "#0f172a" : "#ffffff",
              color: dark ? "#f8fafc" : "#0f172a",
              outline: "none",
              boxShadow: dark ? "0 0 0 3px rgba(56,189,248,0.25)" : "0 0 0 3px rgba(37,99,235,0.2)",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          />
        </div>
      </th>
    );
  }

  // ── Display Mode ───────────────────────────────────────────
  return (
    <th
      className={`px-4 py-3 font-medium transition-colors select-none ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={startEdit}
      title="Double-click or click ✏️ to rename column"
      style={{
        whiteSpace: "nowrap",
        cursor: "pointer",
        position: "relative",
        backgroundColor: hovered
          ? (dark ? "rgba(255, 255, 255, 0.08)" : "rgba(239, 246, 255, 0.7)")
          : undefined,
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        }}
      >
        <span
          style={{
            color: isCustom ? (dark ? "#38bdf8" : "#2563eb") : undefined,
            fontWeight: isCustom ? 700 : undefined,
            transition: "color 0.15s",
          }}
        >
          {currentLabel}
        </span>

        {/* Pencil button — subtle hint by default, bright on hover */}
        <button
          type="button"
          onClick={startEdit}
          title="Rename column"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 4px",
            background: hovered
              ? (dark ? "rgba(56, 189, 248, 0.15)" : "rgba(37, 99, 235, 0.12)")
              : "transparent",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            color: hovered
              ? (dark ? "#38bdf8" : "#2563eb")
              : (dark ? "#64748b" : "#94a3b8"),
            opacity: hovered ? 1 : 0.4,
            transition: "all 0.15s ease",
            lineHeight: 1,
          }}
        >
          <Pencil size={11} />
        </button>
      </div>
    </th>
  );
}

export default EditableColumnHeader;
