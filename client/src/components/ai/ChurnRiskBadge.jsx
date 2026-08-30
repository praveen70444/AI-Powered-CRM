/**
 * Renders a churn risk badge for customers.
 * Props:
 *   risk  "HIGH" | "MEDIUM" | "LOW" | null
 */
function ChurnRiskBadge({ risk }) {
  if (!risk) return null;

  const config = {
    HIGH: "bg-red-50 border-red-200 text-red-700",
    MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
    LOW: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${config[risk] || config.LOW}`}
      title="AI Churn Risk"
    >
      Churn: {risk}
    </span>
  );
}

export default ChurnRiskBadge;
