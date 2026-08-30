import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, RefreshCw, ArrowRight, TrendingUp, AlertTriangle,
  Flame, Users, Target, Loader2, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import AIBriefingCard from "../../components/ai/AIBriefingCard";
import LeadScoreBadge from "../../components/ai/LeadScoreBadge";
import DealHealthBadge from "../../components/ai/DealHealthBadge";
import ChurnRiskBadge from "../../components/ai/ChurnRiskBadge";
import {
  scoreAllLeads,
  getDealHealthSummary,
  getTopNextActions,
  getRevenueForecast,
  getChurnRisk,
} from "../../services/aiService";

// ─── Tiny stat card ─────────────────────────────────────────────────────────
function AIStat({ label, value, sub, color = "blue" }) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Priority chip ───────────────────────────────────────────────────────────
function PriorityChip({ priority }) {
  const cfg = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg[priority] || cfg.low}`}>
      {priority}
    </span>
  );
}

// ─── Forecast bar ───────────────────────────────────────────────────────────
function ForecastBar({ label, actual, predicted, low, high, maxVal, type }) {
  const isActual = type === "actual";
  const val = isActual ? actual : predicted;
  const pct = maxVal > 0 ? Math.max(4, (val / maxVal) * 100) : 4;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs text-gray-400 font-medium">
        ₹{(val / 1000).toFixed(0)}k
      </span>
      <div className="relative w-full flex flex-col justify-end" style={{ height: 80 }}>
        {/* confidence range for forecast */}
        {!isActual && low !== undefined && high !== undefined && maxVal > 0 && (
          <div
            className="absolute w-full rounded-sm bg-violet-100 opacity-60"
            style={{
              bottom: 0,
              height: `${Math.max(4, (high / maxVal) * 100)}%`,
            }}
          />
        )}
        <div
          className={`w-full rounded-t-sm ${isActual ? "bg-blue-500" : "bg-violet-500"}`}
          style={{ height: `${pct}%` }}
          title={`₹${val.toLocaleString("en-IN")}`}
        />
      </div>
      <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
      {!isActual && (
        <span className="text-[9px] text-violet-400">forecast</span>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AIDashboard() {
  const [leads, setLeads] = useState(null);
  const [deals, setDeals] = useState(null);
  const [actions, setActions] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [churn, setChurn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [lRes, dRes, aRes, fRes, cRes] = await Promise.allSettled([
        scoreAllLeads(),
        getDealHealthSummary(),
        getTopNextActions(),
        getRevenueForecast(3),
        getChurnRisk(),
      ]);
      if (lRes.status === "fulfilled") setLeads(lRes.value.data);
      if (dRes.status === "fulfilled") setDeals(dRes.value.data);
      if (aRes.status === "fulfilled") setActions(aRes.value.data);
      if (fRes.status === "fulfilled") setForecast(fRes.value.data);
      if (cRes.status === "fulfilled") setChurn(cRes.value.data);
    } catch {
      setError("Failed to load AI insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  // Build combined forecast chart data
  const allMonths = [
    ...(forecast?.historical || []),
    ...(forecast?.forecast || []),
  ];
  const maxVal = Math.max(...allMonths.map((m) => Math.max(m.actual || 0, m.predicted || 0, m.high || 0)), 1);

  // Lead score summary
  const hotCount = leads?.results?.filter((l) => l.label === "Hot").length || 0;
  const warmCount = leads?.results?.filter((l) => l.label === "Warm").length || 0;
  const coldCount = leads?.results?.filter((l) => l.label === "Cold").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles size={17} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            <p className="text-xs text-gray-400">Rule-based intelligence from your CRM data</p>
          </div>
        </div>
        <button
          onClick={() => loadAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh All"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Daily briefing */}
      <AIBriefingCard />

      {/* AI stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AIStat label="Hot Leads" value={hotCount} sub="Score ≥ 70" color="red" />
        <AIStat label="Warm Leads" value={warmCount} sub="Score 40–69" color="amber" />
        <AIStat
          label="At Risk Deals"
          value={(deals?.summary?.atRisk || 0) + (deals?.summary?.critical || 0)}
          sub="Need attention"
          color="violet"
        />
        <AIStat
          label="Churn Risk"
          value={(churn?.summary?.HIGH || 0) + (churn?.summary?.MEDIUM || 0)}
          sub="Customers at risk"
          color="red"
        />
      </div>

      {/* Two column: Next Actions + Deal Health */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Next Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-violet-600" />
              <h3 className="text-sm font-semibold text-gray-900">Top Next Actions</h3>
            </div>
            <span className="text-xs text-gray-400">{actions?.length || 0} items</span>
          </div>
          <div className="divide-y divide-gray-50">
            {!actions || actions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No actions to show yet. Add some leads and deals first.</p>
            ) : (
              actions.slice(0, 7).map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">{a.entityType}</span>
                      <PriorityChip priority={a.priority} />
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-snug">{a.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{a.entityName} · {a.entityLabel}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deal Health */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-600" />
              <h3 className="text-sm font-semibold text-gray-900">Deal Health</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-emerald-600 font-medium">{deals?.summary?.healthy || 0} healthy</span>
              <span>·</span>
              <span className="text-amber-600 font-medium">{deals?.summary?.atRisk || 0} at risk</span>
              <span>·</span>
              <span className="text-red-600 font-medium">{deals?.summary?.critical || 0} critical</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {!deals?.atRisk || deals.atRisk.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                {deals?.summary?.healthy > 0
                  ? "All your active deals look healthy 🎉"
                  : "No active deals to evaluate."}
              </p>
            ) : (
              deals.atRisk.map((d) => (
                <div key={d.dealId} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.dealTitle}</p>
                      <p className="text-xs text-gray-400">{d.stage} · ₹{Number(d.value).toLocaleString("en-IN")}</p>
                    </div>
                    <DealHealthBadge score={d.healthScore} label={d.healthLabel} />
                  </div>
                  {d.riskFlags?.slice(0, 1).map((f) => (
                    <p key={f.type} className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{f.message}</p>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Forecast chart */}
      {allMonths.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue Forecast</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                History (blue) · Weighted pipeline forecast (purple) ·{" "}
                <span className="text-violet-400">shaded = confidence range</span>
              </p>
            </div>
            {forecast?.pipelineSummary && (
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  ₹{Number(forecast.pipelineSummary.weightedPipelineValue).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">weighted pipeline</p>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            {allMonths.map((m, i) => (
              <ForecastBar
                key={i}
                label={m.month}
                actual={m.actual}
                predicted={m.predicted}
                low={m.low}
                high={m.high}
                maxVal={maxVal}
                type={m.type}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lead score distribution */}
      {leads && leads.results?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Lead Score Distribution</h3>
            <span className="text-xs text-gray-400 ml-1">({leads.scored} scored)</span>
          </div>
          <div className="space-y-2">
            {leads.results
              .sort((a, b) => b.score - a.score)
              .slice(0, 8)
              .map((l) => (
                <div key={l.leadId} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 truncate w-40">{l.leadName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${l.label === "Hot" ? "bg-red-500" : l.label === "Warm" ? "bg-amber-500" : "bg-blue-400"}`}
                      style={{ width: `${l.score}%` }}
                    />
                  </div>
                  <LeadScoreBadge score={l.score} label={l.label} />
                </div>
              ))}
          </div>
          <Link to="/employee/leads" className="mt-4 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
            View all leads <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Churn risk */}
      {churn && churn.highRisk?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">At-Risk Customers</h3>
          </div>
          <div className="space-y-3">
            {churn.highRisk.map((c) => (
              <div key={c.customerId} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.customerName}</p>
                  <p className="text-xs text-gray-400">{c.company}</p>
                  {c.factors?.[0] && (
                    <p className="text-xs text-amber-600 mt-1">{c.factors[0]}</p>
                  )}
                </div>
                <ChurnRiskBadge risk={c.churnRisk} />
              </div>
            ))}
          </div>
          <Link to="/employee/customers" className="mt-4 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
            View all customers <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
