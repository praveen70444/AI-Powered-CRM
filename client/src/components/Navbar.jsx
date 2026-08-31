import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">CRM Portal</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
          <a href="#stats" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Stats</a>
          <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Sign in</Link>
          <Link
            to="/signup"
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1 animate-fade-in">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Features</a>
          <a href="#stats" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Stats</a>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">Sign in</Link>
          <Link
            to="/signup"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-center bg-blue-600 hover:bg-blue-700 text-white transition-colors mt-2"
          >
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}

export default Navbar;