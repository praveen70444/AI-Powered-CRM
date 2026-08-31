import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Mail, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrganizationDashboard } from "../../services/organizationService";

const STAT_CONFIG = [
  { key: "totalEmployees",    label: "Total Employees",     icon: Users,      accent: "blue",    desc: "In your organization" },
  { key: "activeEmployees",   label: "Active Employees",    icon: UserCheck,  accent: "emerald", desc: "Currently active" },
  { key: "inactiveEmployees", label: "Inactive Employees",  icon: UserX,      accent: "amber",   desc: "Currently inactive" },
  { key: "pendingInvitations",label: "Pending Invites",     icon: Mail,       accent: "violet",  desc: "Awaiting response" },
];

const ACCENT_COLORS = {
  blue:    { icon: "bg-blue-50 text-blue-600",    bar: "bg-blue-500" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber:   { icon: "bg-amber-50 text-amber-600",  bar: "bg-amber-500" },
  violet:  { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
};

function StatCard({ icon: Icon, label, value, desc, accent }) {
  const c = ACCENT_COLORS[accent] || ACCENT_COLORS.blue;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />;
}

function QuickAction({ label, to, navigate }) {
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all group text-sm"
    >
      <span className="font-medium text-slate-700 group-hover:text-blue-700">{label}</span>
      <ArrowRight size={15} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function OrganizationDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getOrganizationDashboard();
        setDashboard(response.data);
      } catch {
        setError("Unable to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const data = dashboard || {};
  const totalEmployees = data.totalEmployees ?? 0;
  const activeEmployees = data.activeEmployees ?? 0;
  const inactiveEmployees = data.inactiveEmployees ?? 0;
  const pendingInvitations = data.pendingInvitations ?? 0;

  const stats = [
    { key: "totalEmployees", value: totalEmployees },
    { key: "activeEmployees", value: activeEmployees },
    { key: "inactiveEmployees", value: inactiveEmployees },
    { key: "pendingInvitations", value: pendingInvitations },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]} 👋` : "Organization Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's an overview of your organization today.</p>
        </div>
        <button
          onClick={() => navigate("/organization/employees")}
          className="flex-shrink-0 inline-flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          <Users size={15} /> Manage team
        </button>
      </div>

      {/* Stat cards */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
            : STAT_CONFIG.map((cfg) => (
                <StatCard
                  key={cfg.key}
                  icon={cfg.icon}
                  label={cfg.label}
                  value={stats.find((s) => s.key === cfg.key)?.value ?? 0}
                  desc={cfg.desc}
                  accent={cfg.accent}
                />
              ))
          }
        </div>
      )}

      {/* Content grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Employee overview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Employee Overview</h2>
                <p className="text-xs text-slate-400">Current status distribution</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Active", value: activeEmployees, color: "bg-emerald-500" },
                { label: "Inactive", value: inactiveEmployees, color: "bg-slate-300" },
                { label: "Pending Invites", value: pendingInvitations, color: "bg-violet-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">{value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: totalEmployees > 0 ? `${(value / Math.max(totalEmployees, 1)) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
                <p className="text-xs text-slate-400">Common admin tasks</p>
              </div>
            </div>
            <div className="space-y-2">
              <QuickAction label="Invite a new employee" to="/organization/invitations" navigate={navigate} />
              <QuickAction label="View all employees" to="/organization/employees" navigate={navigate} />
              <QuickAction label="Organization settings" to="/organization/settings" navigate={navigate} />
              <QuickAction label="View audit logs" to="/organization/audit-logs" navigate={navigate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationDashboard;