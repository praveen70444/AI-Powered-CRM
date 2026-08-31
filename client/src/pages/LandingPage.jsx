import { Link } from "react-router-dom";
import { Building2, ArrowRight, Mail, Globe, Code2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Features from "../components/Features";

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-white">CRM Portal</span>
            </div>
            <p className="text-sm leading-relaxed">
              AI-powered CRM for modern sales teams. Manage leads, customers, and deals in one place.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#stats" className="hover:text-white transition-colors">Stats</a></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/forgot-password" className="hover:text-white transition-colors">Reset Password</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail size={13} /> support@crmportal.io</li>
              <li><a href="https://twitter.com" className="flex items-center gap-2 hover:text-white transition-colors"><Globe size={13} /> Twitter</a></li>
              <li><a href="https://github.com" className="flex items-center gap-2 hover:text-white transition-colors"><Code2 size={13} /> GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-white font-bold text-lg">Ready to grow your business?</p>
            <p className="text-blue-100 text-sm mt-1">Start your free trial today. No credit card required.</p>
          </div>
          <Link
            to="/signup"
            className="flex-shrink-0 inline-flex items-center gap-2 h-10 px-6 bg-white text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            Get started free <ArrowRight size={15} />
          </Link>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} CRM Portal. All rights reserved.</p>
          <p>Built with ❤️ for modern sales teams</p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;