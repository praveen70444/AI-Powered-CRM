function StatCard({ icon: Icon, label, value, trend, trendLabel, accent = "blue", description }) {
  const accents = {
    blue:    { icon: "bg-blue-50 text-blue-600",    border: "border-blue-100" },
    emerald: { icon: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
    amber:   { icon: "bg-amber-50 text-amber-600",  border: "border-amber-100" },
    violet:  { icon: "bg-violet-50 text-violet-600", border: "border-violet-100" },
    rose:    { icon: "bg-rose-50 text-rose-600",    border: "border-rose-100" },
    sky:     { icon: "bg-sky-50 text-sky-600",      border: "border-sky-100" },
  };
  const a = accents[accent] || accents.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${a.icon}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {(trendLabel || description) && (
        <p className="text-xs text-slate-400 mt-1">{trendLabel || description}</p>
      )}
    </div>
  );
}

export default StatCard;
