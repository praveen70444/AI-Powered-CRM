import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Flame, Users, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getDailyBriefing } from "../../services/aiService";

const ICON_MAP = {
  alert: AlertTriangle,
  clock: AlertTriangle,
  dollar: TrendingUp,
  fire: Flame,
  warning: AlertTriangle,
  user: Users,
};

const TYPE_STYLES = {
  urgent: "text-red-600 bg-red-50 border-red-100",
  opportunity: "text-emerald-700 bg-emerald-50 border-emerald-100",
  risk: "text-amber-700 bg-amber-50 border-amber-100",
  info: "text-blue-700 bg-blue-50 border-blue-100",
};

function AIBriefingCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await getDailyBriefing();
      setData(res.data);
    } catch {
      // silently fail — briefing is non-critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!data) return null;

  const highlights = data.highlights || [];
  const urgent = highlights.filter((h) => h.type === "urgent" || h.type === "risk");
  const positive = highlights.filter((h) => h.type === "opportunity" || h.type === "info");
  const shown = expanded ? highlights : highlights.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-violet-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles size={15} className="text-violet-600" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">AI Daily Briefing</span>
            <span className="ml-2 text-xs text-gray-400">
              {new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
          title="Refresh briefing"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Briefing text */}
      <div className="px-5 py-3">
        <p className="text-sm text-gray-700 leading-relaxed">{data.briefing}</p>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          {shown.map((h, i) => {
            const Icon = ICON_MAP[h.icon] || Sparkles;
            const style = TYPE_STYLES[h.type] || TYPE_STYLES.info;
            return (
              <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-sm ${style}`}>
                <Icon size={14} className="mt-0.5 shrink-0" />
                <span>{h.message}</span>
              </div>
            );
          })}
          {highlights.length > 3 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Show less" : `${highlights.length - 3} more items`}
            </button>
          )}
        </div>
      )}

      {/* Stats bar */}
      {data.stats && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          {data.stats.overdueTasks > 0 && (
            <span><span className="font-semibold text-red-600">{data.stats.overdueTasks}</span> overdue</span>
          )}
          {data.stats.dueTodayTasks > 0 && (
            <span><span className="font-semibold text-amber-600">{data.stats.dueTodayTasks}</span> due today</span>
          )}
          {data.stats.closingDeals > 0 && (
            <span><span className="font-semibold text-blue-600">{data.stats.closingDeals}</span> closing this week</span>
          )}
          {data.stats.hotLeads > 0 && (
            <span><span className="font-semibold text-violet-600">{data.stats.hotLeads}</span> hot leads</span>
          )}
          {data.stats.atRiskCustomers > 0 && (
            <span><span className="font-semibold text-red-600">{data.stats.atRiskCustomers}</span> at-risk customers</span>
          )}
        </div>
      )}
    </div>
  );
}

export default AIBriefingCard;
