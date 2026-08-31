import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Users,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const result = await login(formData.email, formData.password);
      if (result.user.role === "ORG_ADMIN") {
        navigate("/organization");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      const message =
        err.friendlyMessage ||
        err.response?.data?.message ||
        "Unable to login. Please check your credentials.";
      setError(message);
    }
  };

  const features = [
    { icon: Users, text: "Manage your team & employees" },
    { icon: TrendingUp, text: "Track leads, deals & revenue" },
    { icon: LayoutDashboard, text: "Centralized CRM dashboard" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl shadow-blue-100/60 overflow-hidden flex flex-col md:flex-row min-h-[580px]">

        {/* ── LEFT PANEL (desktop only) ── */}
        <div className="hidden md:flex md:w-[44%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col justify-between p-10 lg:p-12 relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 -right-12 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 -right-8 w-40 h-40 bg-indigo-500/20 rounded-full" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">CRM Portal</p>
                <p className="text-xs text-blue-200">Customer Relationship Management</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl lg:text-4xl font-bold leading-snug mb-4">
              Welcome back to your{" "}
              <span className="text-blue-200">workspace.</span>
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10">
              Manage your organization, employees, customers, and business
              activities from one centralized platform.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-blue-100" />
                  </div>
                  <span className="text-sm text-blue-50">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-blue-300 mt-8">
            © {new Date().getFullYear()} CRM Portal. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT PANEL (form) ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
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

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your CRM workspace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 pl-10 pr-4 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 hover:border-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 pl-10 pr-11 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 hover:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-7 pt-6 border-t border-slate-100 text-center space-y-1">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create your organization
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;