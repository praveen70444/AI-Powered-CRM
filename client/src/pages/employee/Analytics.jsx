import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, Target, Award, RefreshCw } from "lucide-react";
import api from "../../services/api";

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function KPICard({ title, value, sub, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function HBar({ label, value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-12 text-right shrink-0">{value}</span>
    </div>
  );
}

function ValueBar({ label, value, max, color = "bg-green-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-24 text-right shrink-0">
        ₹{Number(value || 0).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [winLoss, setWinLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll(p) {
    setLoading(true); setError("");
    try {
      const [ovRes, fcRes, wlRes] = await Promise.all([
        api.get(`/employee/analytics/overview?period=${p}`),
        api.get(`/employee/analytics/forecast`),
        api.get(`/employee/analytics/win-loss?period=${p}`),
      ]);
      setOverview(ovRes.data.data);
      setForecast(fcRes.data.data);
      setWinLoss(wlRes.data.data);
    } catch { setError("Failed to load analytics"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAll(period); }, [period]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => loadAll(period)} className="mt-3 text-blue-600 text-sm hover:underline">Retry</button>
      </div>
    );
  }

  const leads = overview?.leads || {};
  const deals = overview?.deals || {};
  const customers = overview?.customers || {};
  const tasks = overview?.tasks || {};
  const charts = overview?.charts || {};

  const maxLeadSource = Math.max(...(charts.leadsBySource || []).map(s => parseInt(s.count) || 0), 1);
  const maxDealStageValue = Math.max(...(charts.dealsByStage || []).map(s => Number(s.value) || 0), 1);

  const won = winLoss?.winLoss?.find(r => r.stage === "Won");
  const lost = winLoss?.winLoss?.find(r => r.stage === "Lost");
  const totalWL = (parseInt(won?.count) || 0) + (parseInt(lost?.count) || 0);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === p.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => loadAll(period)} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={leads.total || 0} sub={`${leads.new_this_period || 0} new this period`} icon={Users} color="blue" />
        <KPICard title="Conversion Rate" value={`${overview?.conversionRate || 0}%`} sub={`${leads.converted || 0} converted`} icon={Target} color="green" />
        <KPICard title="Active Pipeline" value={`₹${Number(overview?.activePipelineValue || 0).toLocaleString("en-IN")}`} sub={`${deals.total || 0} total deals`} icon={TrendingUp} color="amber" />
        <KPICard title="Won Revenue" value={`₹${Number(deals.won_value || 0).toLocaleString("en-IN")}`} sub={`${deals.won || 0} deals won`} icon={Award} color="purple" />
      </div>

      {/* Secondary stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Customers" value={customers.total || 0} sub={`${customers.at_risk || 0} at risk`} icon={Users} color="green" />
        <KPICard title="Total Revenue" value={`₹${Number(customers.total_revenue || 0).toLocaleString("en-IN")}`} sub="from all customers" icon={DollarSign} color="blue" />
        <KPICard title="Tasks Completed" value={`${tasks.completed || 0}/${tasks.total || 0}`} sub={`${tasks.overdue || 0} overdue`} icon={Target} color="purple" />
        <KPICard title="Win Rate" value={`${winLoss?.winRate || 0}%`} sub={`Avg deal ₹${Number(winLoss?.avgDealSize || 0).toLocaleString("en-IN")}`} icon={Award} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        {(charts.leadsBySource?.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Source</h3>
            <div className="space-y-3">
              {charts.leadsBySource.map(s => (
                <HBar key={s.source} label={s.source} value={parseInt(s.count)} max={maxLeadSource} color="bg-blue-500" />
              ))}
            </div>
          </div>
        )}

        {/* Deals by Stage */}
        {(charts.dealsByStage?.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
            <div className="space-y-3">
              {charts.dealsByStage.map(s => (
                <ValueBar key={s.stage} label={s.stage} value={s.value} max={maxDealStageValue}
                  color={s.stage === "Won" ? "bg-green-500" : s.stage === "Lost" ? "bg-red-400" : "bg-blue-500"} />
              ))}
            </div>
          </div>
        )}

        {/* Win / Loss */}
        {totalWL > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Win / Loss ({period} days)</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalWL ? (parseInt(won?.count || 0) / totalWL) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Won: {won?.count || 0}</span>
              <span className="text-red-500 font-medium">Lost: {lost?.count || 0}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">Avg sales cycle: {winLoss?.avgSalesCycleDays || 0} days</p>
          </div>
        )}

        {/* Sales Forecast */}
        {forecast && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Sales Forecast</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1">₹{Number(forecast.weightedForecast || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mb-4">Weighted by stage probability</p>
            {forecast.closingThisMonth?.count > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-sm">
                <span className="font-medium text-amber-700">{forecast.closingThisMonth.count} deal(s)</span>
                <span className="text-amber-600"> closing this month — ₹{Number(forecast.closingThisMonth.value || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="space-y-2">
              {(forecast.stageBreakdown || []).map(s => (
                <div key={s.stage} className="flex justify-between text-xs text-gray-600">
                  <span>{s.stage} ({s.probability}%)</span>
                  <span className="font-medium">₹{Number(s.weightedValue || 0).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Revenue trend */}
      {charts.revenueByMonth?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Customer Revenue Trend (6 months)</h3>
          <div className="flex items-end gap-2 h-32">
            {charts.revenueByMonth.map((m, i) => {
              const maxRev = Math.max(...charts.revenueByMonth.map(r => Number(r.revenue) || 0), 1);
              const h = Number(m.revenue) > 0 ? Math.max((Number(m.revenue) / maxRev) * 100, 4) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">
                    ₹{(Number(m.revenue) / 1000).toFixed(0)}k
                  </span>
                  <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }} title={`₹${Number(m.revenue).toLocaleString("en-IN")}`} />
                  <span className="text-[10px] text-gray-400">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
