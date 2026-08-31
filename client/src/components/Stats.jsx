function Stats() {
  const stats = [
    { value: "500+", label: "Organizations", desc: "Trust our platform" },
    { value: "20K+", label: "Leads Managed", desc: "Across all teams" },
    { value: "99.9%", label: "Uptime", desc: "SLA guaranteed" },
    { value: "1M+", label: "Activities Logged", desc: "And counting" },
  ];

  return (
    <section id="stats" className="py-24 px-4 bg-[var(--color-btn-primary)]">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Trusted by growing teams worldwide
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            Numbers that speak for themselves.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tighter">
                {item.value}
              </p>
              <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs text-blue-200 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;