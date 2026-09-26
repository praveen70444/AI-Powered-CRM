import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Contact, KanbanSquare, ListChecks,
  Trophy, IndianRupee, Clock, CalendarDays, MapPin,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle2,
} from "lucide-react";
import StatCard from "../../components/employee/StatCard";
import BarChart from "../../components/employee/BarChart";
import DonutChart from "../../components/employee/DonutChart";
import StatusBadge from "../../components/employee/StatusBadge";
import AIBriefingCard from "../../components/ai/AIBriefingCard";
import { getEmployeeDashboard } from "../../services/employeeService";

function formatCurrency(value) {
  return `₹${(value / 100000).toFixed(1)}L`;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const EVENT_TYPE_COLORS = {
  Meeting:  "bg-blue-100 text-blue-700",
  Call:     "bg-emerald-100 text-emerald-700",
  Demo:     "bg-violet-100 text-violet-700",
  Task:     "bg-amber-100 text-amber-700",
  Reminder: "bg-orange-100 text-orange-700",
  Other:    "bg-gray-100 text-gray-600",
};

// ── Today's Events Card ────────────────────────────────────────────────────
function TodayEventsCard({ events, onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
          <p className="text-xs text-gray-400 mt-0.5">{today}</p>
        </div>
        <button onClick={onNavigate}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
        >
          View Calendar <ChevronRight size={13} />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6">
          <CalendarDays size={24} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No events scheduled for today</p>
          <button onClick={onNavigate} className="mt-2 text-xs text-blue-600 hover:underline">
            Go to Calendar →
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id}
              className="flex flex-col p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
            >
              <div 
                className="flex gap-3 cursor-pointer items-start"
                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
              >
                {/* Time column */}
                <div className="flex flex-col items-center justify-start pt-0.5 w-14 shrink-0">
                  <span className="text-xs font-semibold text-gray-700">{formatTime(ev.startTime)}</span>
                  <span className="text-xs text-gray-400">{formatTime(ev.endTime)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {ev.title}
                    </p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_TYPE_COLORS[ev.eventType] || EVENT_TYPE_COLORS.Other}`}>
                      {ev.eventType}
                    </span>
                  </div>
                  {ev.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {ev.location}
                    </p>
                  )}
                </div>

                {expandedId === ev.id ? (
                  <ChevronDown size={14} className="text-blue-400 mt-0.5 shrink-0 transition-colors" />
                ) : (
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 mt-0.5 shrink-0 transition-colors" />
                )}
              </div>
              
              {expandedId === ev.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 pl-[68px] text-sm text-gray-600">
                  <p className="mb-2 whitespace-pre-wrap">{ev.description || "No additional details provided."}</p>
                  <button onClick={(e) => { e.stopPropagation(); onNavigate(); }} className="text-xs text-blue-600 hover:underline">
                    View in Calendar →
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Incomplete Tasks Card ──────────────────────────────────────────────────
function IncompleteTasksCard({ tasks, onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const getUrgency = (t) => {
    if (!t.dueDate) return "none";
    const due = t.dueDate.split("T")[0];
    if (due < todayStr) return "overdue";
    if (due === todayStr) return "today";
    return "upcoming";
  };

  const urgencyStyle = {
    overdue:  { bar: "bg-red-500",   text: "text-red-600",   chip: "bg-red-50 text-red-600 border-red-100" },
    today:    { bar: "bg-blue-500",  text: "text-blue-600",  chip: "bg-blue-50 text-blue-600 border-blue-100" },
    upcoming: { bar: "bg-gray-300",  text: "text-gray-500",  chip: "bg-gray-50 text-gray-500 border-gray-100" },
    none:     { bar: "bg-gray-200",  text: "text-gray-400",  chip: "bg-gray-50 text-gray-400 border-gray-100" },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Incomplete Tasks</h3>
          <p className="text-xs text-gray-400 mt-0.5">{tasks.length} pending</p>
        </div>
        <button onClick={onNavigate}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
        >
          View All <ChevronRight size={13} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 size={24} className="text-emerald-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">All caught up! No pending tasks.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const urgency = getUrgency(t);
            const style = urgencyStyle[urgency];
            return (
              <li key={t.id}
                className="flex flex-col p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  {/* Priority bar */}
                  <div className={`w-1 h-8 rounded-full shrink-0 ${
                    t.priority === "High" ? "bg-red-500" :
                    t.priority === "Medium" ? "bg-amber-500" :
                    "bg-gray-300"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                      {t.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.type} · {t.relatedTo || "—"}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.dueDate && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.chip}`}>
                        {urgency === "overdue" ? "Overdue" :
                         urgency === "today" ? "Today" :
                         new Date(t.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    <StatusBadge value={t.priority} />
                  </div>

                  {expandedId === t.id ? (
                    <ChevronDown size={14} className="text-blue-400 transition-colors" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>

                {expandedId === t.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 pl-4 text-sm text-gray-600">
                    <p className="mb-2 whitespace-pre-wrap">{t.description || "No additional details provided."}</p>
                    <button onClick={(e) => { e.stopPropagation(); onNavigate(); }} className="text-xs text-blue-600 hover:underline">
                      View in Tasks →
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length > 0 && (
        <button onClick={onNavigate}
          className="mt-3 w-full text-xs text-center text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Go to Tasks →
        </button>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function DashboardHome() {
  const navigate = useNavigate();
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
    return () => { isMounted = false; };
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-red-600">{error}</div>
    );
  }

  const summary = dashboard?.summary || {
    totalLeads: 0, newLeads: 0, totalCustomers: 0,
    activeDeals: 0, pendingTasks: 0, wonDeals: 0, revenue: 0,
  };
  const revenueTrend    = dashboard?.revenueTrend    || [];
  const dealsByStage    = dashboard?.dealsByStage    || [];
  const leadsBySource   = dashboard?.leadsBySource   || [];
  const upcomingTasks   = dashboard?.upcomingTasks   || [];
  const recentActivities= dashboard?.recentActivities|| [];
  const todayEvents     = dashboard?.todayEvents     || [];

  return (
    <div className="space-y-6">
      {/* AI Briefing */}
      <AIBriefingCard />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Leads"      value={summary.totalLeads}                        accent="blue" />
        <StatCard icon={UserPlus}     label="New Leads"        value={summary.newLeads}                          accent="violet" />
        <StatCard icon={Contact}      label="Total Customers"  value={summary.totalCustomers}                    accent="emerald" />
        <StatCard icon={KanbanSquare} label="Active Deals"     value={summary.activeDeals}                       accent="amber" />
        <StatCard icon={ListChecks}   label="Pending Tasks"    value={summary.pendingTasks}                      accent="red"
          onClick={() => navigate("/employee/tasks")}
          className="cursor-pointer hover:ring-2 hover:ring-red-200 transition-all"
        />
        <StatCard icon={Trophy}       label="Won Deals"        value={summary.wonDeals}                          accent="emerald" />
        <StatCard icon={IndianRupee}  label="Revenue"          value={formatCurrency(summary.revenue)}           accent="blue" />
      </div>

      {/* Charts row */}
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

      {/* Bottom row: Today's schedule + Incomplete tasks + Leads by Source */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's Events */}
        <TodayEventsCard events={todayEvents} onNavigate={() => navigate("/employee/calendar")} />

        {/* Incomplete Tasks */}
        <IncompleteTasksCard tasks={upcomingTasks} onNavigate={() => navigate("/employee/tasks")} />

        {/* Leads by Source */}
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
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(s.value / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentActivities.map((a) => (
              <li key={a.id} className="flex gap-3 py-3">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.relatedTo} · {a.timestamp ? new Date(a.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardHome;
