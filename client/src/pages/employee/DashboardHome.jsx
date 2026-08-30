import { useEffect, useState } from "react";
import { Users, UserPlus, Contact, KanbanSquare, ListChecks, Trophy, IndianRupee } from "lucide-react";
import StatCard from "../../components/employee/StatCard";
import BarChart from "../../components/employee/BarChart";
import DonutChart from "../../components/employee/DonutChart";
import StatusBadge from "../../components/employee/StatusBadge";
import AIBriefingCard from "../../components/ai/AIBriefingCard";
import { getEmployeeDashboard } from "../../services/employeeService";
function formatCurrency(value) {
  return `₹${(value / 100000).toFixed(1)}L`;
}
function DashboardHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const response = await getEmployeeDashboard();
        if (!isMounted) return;
        setDashboard(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-gray-500">
        Loading dashboard...
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }
  const summary = dashboard?.summary || {
    totalLeads: 0,
    newLeads: 0,
    totalCustomers: 0,
    activeDeals: 0,
    pendingTasks: 0,
    wonDeals: 0,
    revenue: 0,
  };
  const revenueTrend = dashboard?.revenueTrend || [];
  const dealsByStage = dashboard?.dealsByStage || [];
  const leadsBySource = dashboard?.leadsBySource || [];
  const upcomingTasks = dashboard?.upcomingTasks || [];
  const recentActivities = dashboard?.recentActivities || [];
  return (
    <div className="space-y-6">
      {/* AI Briefing */}
      <AIBriefingCard />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={summary.totalLeads} accent="blue" />
        <StatCard icon={UserPlus} label="New Leads" value={summary.newLeads} accent="violet" />
        <StatCard icon={Contact} label="Total Customers" value={summary.totalCustomers} accent="emerald" />
        <StatCard icon={KanbanSquare} label="Active Deals" value={summary.activeDeals} accent="amber" />
        <StatCard icon={ListChecks} label="Pending Tasks" value={summary.pendingTasks} accent="red" />
        <StatCard icon={Trophy} label="Won Deals" value={summary.wonDeals} accent="emerald" />
        <StatCard icon={IndianRupee} label="Revenue" value={formatCurrency(summary.revenue)} accent="blue" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <BarChart data={revenueTrend} valueFormatter={formatCurrency} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Deals by Stage</h3>
          <DonutChart data={dealsByStage} />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Source</h3>
          {leadsBySource.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No data available</p>
          ) : (
            <div className="space-y-3">
              {leadsBySource.map((s) => {
                const max = Math.max(...leadsBySource.map((x) => x.value));
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{s.label}</span>
                      <span>{s.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(s.value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No upcoming tasks</p>
          ) : (
            <ul className="space-y-3">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Due {t.dueDate}</p>
                  </div>
                  <StatusBadge value={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
          ) : (
            <ul className="space-y-4">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.relatedTo} · {a.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
export default DashboardHome;
