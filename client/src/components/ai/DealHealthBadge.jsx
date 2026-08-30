/**
 * Renders a deal health badge + compact risk flags.
 * Props:
 *   score      {number|null}
 *   label      {string|null}  "Healthy" | "At Risk" | "Critical"
 *   riskFlags  {Array}        [{ type, message }]
 *   showFlags  {boolean}      whether to show flag chips (default false)
 */
function DealHealthBadge({ score, label, riskFlags = [], showFlags = false }) {
  if (score === null || score === undefined) return null;

  const resolvedLabel = label || (score >= 70 ? "Healthy" : score >= 40 ? "At Risk" : "Critical");

  const config = {
    Healthy: {
      bar: "bg-emerald-500",
      badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    "At Risk": {
      bar: "bg-amber-500",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
    },
    Critical: {
      bar: "bg-red-500",
      badge: "bg-red-50 border-red-200 text-red-700",
    },
  };
  const c = config[resolvedLabel] || config["At Risk"];

  return (
    <div className="flex flex-col gap-1">
      {/* Score bar + label */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>
          {resolvedLabel}
        </span>
      </div>

      {/* Risk flags */}
      {showFlags && riskFlags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {riskFlags.slice(0, 2).map((f) => (
            <span
              key={f.type}
              title={f.message}
              className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200"
            >
              {f.message.length > 28 ? f.message.slice(0, 28) + "…" : f.message}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default DealHealthBadge;
