/**
 * Renders an AI lead score badge: 🔴 Hot / 🟡 Warm / 🔵 Cold
 * Props:
 *   score  {number|null}
 *   label  {string|null}  "Hot" | "Warm" | "Cold"
 *   size   "sm" | "md"    (default "sm")
 */
function LeadScoreBadge({ score, label, size = "sm" }) {
  if (score === null || score === undefined) return null;

  const config = {
    Hot: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
    Warm: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    Cold: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      dot: "bg-blue-400",
    },
  };

  const resolvedLabel = label || (score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold");
  const c = config[resolvedLabel] || config.Cold;

  const sizeClasses = size === "md"
    ? "px-2.5 py-1 text-xs gap-1.5"
    : "px-2 py-0.5 text-xs gap-1";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${c.bg} ${c.border} ${c.text} ${sizeClasses}`}
      title={`AI Lead Score: ${score}/100`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {resolvedLabel} · {score}
    </span>
  );
}

export default LeadScoreBadge;
