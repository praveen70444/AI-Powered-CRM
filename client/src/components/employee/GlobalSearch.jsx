import { useState, useRef, useEffect } from "react";
import { Search, Users, Contact, Briefcase, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults(null); return; }
    let cancelled = false;
    setLoading(true);
    api.get(`/employee/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => { if (!cancelled) { setResults(res.data.data); setSelectedIdx(-1); } })
      .catch(() => { if (!cancelled) setResults(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    function outside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current?.contains(e.target))
        setFocused(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const allItems = results ? [
    ...results.leads.map(r => ({ ...r, route: "/employee/leads", color: "text-blue-500", Icon: Users })),
    ...results.customers.map(r => ({ ...r, route: "/employee/customers", color: "text-green-500", Icon: Contact })),
    ...results.deals.map(r => ({ ...r, name: r.name || r.title, route: "/employee/deals", color: "text-amber-500", Icon: Briefcase })),
  ] : [];

  function handleKeyDown(e) {
    if (!allItems.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && selectedIdx >= 0) { navigate(allItems[selectedIdx].route); setQuery(""); setFocused(false); }
    else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
  }

  const showDropdown = focused && query.length >= 2;

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search leads, customers, deals..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Searching...</p>
          ) : !results || allItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No results for "{query}"</p>
          ) : (
            <>
              {[
                { key: "leads", label: "Leads", items: results.leads, offset: 0, color: "text-blue-500", Icon: Users },
                { key: "customers", label: "Customers", items: results.customers, offset: results.leads.length, color: "text-green-500", Icon: Contact },
                { key: "deals", label: "Deals", items: results.deals, offset: results.leads.length + results.customers.length, color: "text-amber-500", Icon: Briefcase },
              ].map(({ key, label, items, offset, color, Icon }) => items.length > 0 && (
                <div key={key}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">{label}</p>
                  {items.map((item, i) => {
                    const idx = offset + i;
                    return (
                      <button key={item.id} onClick={() => { navigate(allItems[offset + i].route); setQuery(""); setFocused(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${selectedIdx === idx ? "bg-blue-50" : ""}`}>
                        <Icon size={14} className={`${color} shrink-0`} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{item.name || item.title}</p>
                          <p className="text-xs text-gray-400 truncate">{item.company} · {item.status}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
