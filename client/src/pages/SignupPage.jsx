import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, User, Mail, Lock, ArrowRight, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, Users, TrendingUp, LayoutDashboard,
} from "lucide-react";

const FEATURES = [
  { icon: Users, text: "Manage your team & employees" },
  { icon: TrendingUp, text: "Track leads, deals & revenue" },
  { icon: LayoutDashboard, text: "Centralized CRM dashboard" },
];

function InputField({ id, name, type = "text", value, onChange, placeholder, icon: Icon, required, minLength, autoComplete, rightSlot, hint }) {
  return (
    <div>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full h-11 pl-10 pr-10 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 hover:border-slate-400"
        />
        {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SignupPage() {
  const [formData, setFormData] = useState({ organizationName: "", adminName: "", email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await register(formData);
      setSuccess("Organization created successfully. Redirecting to login…");
      setFormData({ organizationName: "", adminName: "", email: "", password: "" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || "Unable to create organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl shadow-blue-100/60 overflow-hidden flex flex-col md:flex-row">

        {/* Left panel */}
        <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col justify-between p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-lg font-bold">CRM Portal</p>
                <p className="text-xs text-blue-200">Customer Relationship Management</p>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-snug mb-4">
              Start managing your{" "}
              <span className="text-blue-200">organization today.</span>
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10">
              Create your workspace and bring your entire team onto one powerful CRM platform.
            </p>
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-blue-100" />
                  </div>
                  <span className="text-sm text-blue-50">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs text-blue-300">© {new Date().getFullYear()} CRM Portal</p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 overflow-y-auto">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">CRM Portal</p>
              <p className="text-xs text-slate-500">Customer Relationship Management</p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Create your organization</h2>
            <p className="mt-1.5 text-sm text-slate-500">Set up your admin account to get started.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm animate-fade-in">
              <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5 text-green-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-1.5">Organization name</label>
              <InputField id="organizationName" name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="ABC Technologies" icon={Building2} required />
            </div>
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
              <InputField id="adminName" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Full name" icon={User} required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Admin email</label>
              <InputField id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="admin@company.com" icon={Mail} required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <InputField
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                icon={Lock}
                required
                minLength={6}
                autoComplete="new-password"
                hint="Use at least 6 characters."
                rightSlot={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <> Create organization <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;