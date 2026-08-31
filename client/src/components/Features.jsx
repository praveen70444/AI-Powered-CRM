import {
  Users, KanbanSquare, BarChart3, Bell, Sparkles, Shield, Calendar, FileText,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    color: "bg-blue-50 text-[var(--color-btn-primary)]",
    title: "Lead Management",
    desc: "Capture, track and nurture leads through a structured pipeline with custom stages.",
  },
  {
    icon: KanbanSquare,
    color: "bg-indigo-50 text-indigo-600",
    title: "Sales Pipeline",
    desc: "Visualize your deals across stages. Never let an opportunity slip through the cracks.",
  },
  {
    icon: BarChart3,
    color: "bg-emerald-50 text-emerald-600",
    title: "Analytics & Reports",
    desc: "Real-time dashboards with conversion rates, revenue forecasts and team performance.",
  },
  {
    icon: Sparkles,
    color: "bg-amber-50 text-amber-600",
    title: "AI Insights",
    desc: "AI-powered suggestions, lead scoring and automated follow-up recommendations.",
  },
  {
    icon: Bell,
    color: "bg-rose-50 text-rose-600",
    title: "Smart Notifications",
    desc: "Stay on top of every task, meeting and follow-up with intelligent reminders.",
  },
  {
    icon: Shield,
    color: "bg-sky-50 text-sky-600",
    title: "Role-Based Access",
    desc: "Granular permissions for admins, managers and agents — full security control.",
  },
  {
    icon: Calendar,
    color: "bg-violet-50 text-violet-600",
    title: "Calendar & Tasks",
    desc: "Plan your day with an integrated calendar. Link tasks to deals and contacts.",
  },
  {
    icon: FileText,
    color: "bg-teal-50 text-teal-600",
    title: "Quotes & Products",
    desc: "Build and send professional quotes in seconds. Manage your product catalog.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-btn-secondary)] border border-blue-100 text-[var(--color-btn-primary)] text-xs font-semibold mb-4">
            Everything you need
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-heading)] mb-4">
            Built for modern sales teams
          </h2>
          <p className="text-[var(--color-body-text)] max-w-xl mx-auto">
            From lead capture to closed deals — every feature your team needs to grow faster and smarter.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="group p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-main)] hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-default"
            >
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={19} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-heading)] mb-2">{title}</h3>
              <p className="text-xs text-[var(--color-body-text)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;