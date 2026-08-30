import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

/**
 * Shows the AI-suggested next action for a record.
 * Props:
 *   fetchFn   {() => Promise}  function that returns next action data
 *   entityId  {number|string}  used to re-fetch when it changes
 */
function NextActionBanner({ fetchFn, entityId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId || !fetchFn) return;
    let mounted = true;
    setLoading(true);
    fetchFn()
      .then((res) => { if (mounted) setData(res.data || res); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [entityId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 text-sm">
        <Loader2 size={14} className="animate-spin shrink-0" />
        <span className="text-xs">Getting AI suggestion…</span>
      </div>
    );
  }

  if (!data) return null;

  const priorityColors = {
    high: "bg-red-50 border-red-200 text-red-700",
    medium: "bg-amber-50 border-amber-200 text-amber-700",
    low: "bg-blue-50 border-blue-100 text-blue-700",
  };
  const color = priorityColors[data.priority] || priorityColors.low;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${color}`}>
      <Sparkles size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">AI Suggestion</p>
        <p className="text-sm font-medium leading-snug">{data.action}</p>
        <p className="text-xs opacity-70 mt-0.5">{data.reason}</p>
      </div>
      <ArrowRight size={14} className="mt-1 shrink-0 opacity-50" />
    </div>
  );
}

export default NextActionBanner;
