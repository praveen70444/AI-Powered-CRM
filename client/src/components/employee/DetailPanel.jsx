/**
 * Generic slide-in detail panel used by Leads, Customers, Deals.
 * Children render inside the scrollable body.
 */
import { X } from "lucide-react";

function DetailPanel({ open, onClose, title, subtitle, tabs, activeTab, onTabChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex border-b border-gray-100 px-6 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default DetailPanel;
