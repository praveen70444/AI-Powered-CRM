import { useState, useRef, useEffect } from "react";
import { Pencil, RotateCcw } from "lucide-react";

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
    setLabels((prev) => {
      const next = { ...prev, [colKey]: newLabel.trim() || defaults[colKey] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const resetLabel = (colKey) => {
    setLabels((prev) => {
      const next = { ...prev, [colKey]: defaults[colKey] };
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        delete saved[colKey];
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {}
      return next;
    });
  };

  const resetAll = () => {
    setLabels({ ...defaults });
    try { localStorage.removeItem(storageKey); } catch {}
  };

  return { labels, updateLabel, resetLabel, resetAll };
}

/**
 * EditableColumnHeader – renders a <th> with inline rename capability.
 *
 * Props:
 *   colKey     – key to match against labels map
 *   labels     – current labels object from useColumnLabels
 *   defaults   – default labels object (for reset tooltip)
 *   updateLabel – function(colKey, newLabel)
 *   className  – extra className for <th>
 *   children   – fallback content (unused if labels[colKey] is set)
 */
export function EditableColumnHeader({
  colKey,
  labels,
  defaults,
  updateLabel,
  className = "",
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const isCustom = labels[colKey] !== defaults[colKey];

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(labels[colKey]);
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    updateLabel(colKey, draft || labels[colKey]);
    setEditing(false);
  };

  const label = labels[colKey] ?? children;

  if (editing) {
    return (
      <th className={`px-4 py-3 font-medium ${className}`}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="
            w-full min-w-[60px] max-w-[140px]
            px-1.5 py-0.5 text-xs font-medium
            border border-blue-400 rounded
            bg-white text-gray-800
            focus:outline-none focus:ring-1 focus:ring-blue-500
          "
          style={{ textTransform: "none", letterSpacing: "normal" }}
        />
      </th>
    );
  }

  return (
    <th
      className={`px-4 py-3 font-medium group/th relative whitespace-nowrap ${className}`}
      onDoubleClick={startEdit}
      title="Double-click to rename column"
    >
      <span className={isCustom ? "text-blue-500" : ""}>{label}</span>
      <button
        onClick={startEdit}
        title="Rename column"
        className="
          ml-1 opacity-0 group-hover/th:opacity-100 transition-opacity
          text-gray-400 hover:text-blue-500
          inline-flex items-center
        "
      >
        <Pencil size={10} />
      </button>
    </th>
  );
}
