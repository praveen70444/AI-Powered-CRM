import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, Users, BarChart3, ShieldCheck } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Users, label: "Lead Management" },
  { icon: TrendingUp, label: "Sales Pipeline" },
  { icon: BarChart3, label: "AI Analytics" },
  { icon: ShieldCheck, label: "Enterprise Security" },
];

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-4 overflow-hidden bg-[var(--color-bg-main)]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-100/80 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: "2s" }} />

      <div className="max-w-5xl mx-auto text-center animate-fade-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[var(--color-border)] text-[var(--color-btn-primary)] text-xs font-semibold mb-8 shadow-sm">
          <Sparkles size={13} />
          AI-Powered CRM Platform
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--color-heading)] leading-[1.1] tracking-tight mb-6">
          Manage{" "}
          <span className="gradient-text">Leads & Customers</span>
          <br />
          From One CRM
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[var(--color-body-text)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Track leads, manage customers, automate follow-ups and close deals
          faster — all powered by built-in AI insights.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            to="/signup"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-hover)] text-white font-semibold rounded-xl transition-all duration-150 shadow-lg text-sm"
          >
            Start free trial
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 bg-white hover:bg-slate-50 border border-[var(--color-border)] text-[var(--color-heading)] font-semibold rounded-xl transition-all duration-150 shadow-sm text-sm"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Highlights row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-body-text)] font-medium"
            >
              <Icon size={15} className="text-[var(--color-btn-primary)]" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-xs text-[var(--color-body-text)] font-medium">Scroll</span>
        <div className="w-0.5 h-8 bg-gradient-to-b from-slate-400 to-transparent rounded-full" />
      </div>
    </section>
  );
}

export default Hero;