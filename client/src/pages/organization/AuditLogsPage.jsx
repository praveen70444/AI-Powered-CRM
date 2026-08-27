import { useEffect, useState } from "react";
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "../../services/organizationService";

const ACTION_STYLES = {
  create: "bg-green-50 text-green-700 border-green-200",
  update: "bg-blue-50 text-blue-700 border-blue-200",
  delete: "bg-red-50 text-red-700 border-red-200",
  login: "bg-gray-100 text-gray-600 border-gray-200",
  logout: "bg-gray-100 text-gray-600 border-gray-200",
  password_change: "bg-purple-50 text-purple-700 border-purple-200",
  permission_change: "bg-amber-50 text-amber-700 border-amber-200",
};

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${style}`}>
      {action?.replace(/_/g, " ")}
    </span>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const LIMIT = 20;

  async function loadLogs(p = 1) {
    setLoading(true); setError("");
    try {
      const res = await getAuditLogs(p, LIMIT);
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch { setError("Failed to load audit logs"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadLogs(page); }, [page]);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !q || (log.user_name || "").toLowerCase().includes(q) || (log.entity_type || "").toLowerCase().includes(q) || (log.user_email || "").toLowerCase().includes(q);
    const matchAction = !filterAction || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const ACTIONS = ["create", "update", "delete", "login", "logout", "password_change"];

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">Track all actions performed in your organization. ({total} total)</p>
        </div>
        <button onClick={() => loadLogs(page)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or entity..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Shield size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900">No audit logs found</p>
            <p className="text-sm text-slate-500 mt-1">Actions will be recorded here as your team uses the CRM.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">Time</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">User</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">Action</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">Entity</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-600">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{timeAgo(log.created_at)}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-800">{log.user_name || "System"}</p>
                      <p className="text-xs text-slate-400">{log.user_email || ""}</p>
                    </td>
                    <td className="px-6 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-6 py-3 text-slate-600 capitalize">
                      {log.entity_type ? `${log.entity_type} ${log.entity_id ? `#${log.entity_id}` : ""}` : "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{log.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={14} /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
