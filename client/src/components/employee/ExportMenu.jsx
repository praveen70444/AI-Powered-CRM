import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileText, FileSpreadsheet, File } from "lucide-react";

function ExportMenu({ onExport, label = "Export" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formats = [
    { key: "csv", label: "Export as CSV", icon: FileText },
    { key: "excel", label: "Export as Excel", icon: FileSpreadsheet },
    { key: "pdf", label: "Export as PDF", icon: File },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download size={14} />
        {label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
          {formats.map(({ key, label: fLabel, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { onExport(key); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon size={14} className="text-gray-400" />
              {fLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
