import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const result = await login(
        formData.email,
        formData.password
      );
      if (result.user.role === "ORG_ADMIN") {
        navigate("/organization");
      } else {
        navigate("/employee");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to login";
      setError(message);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-full min-h-screen bg-white grid md:grid-cols-[42%_58%]">
        <div className="hidden md:flex bg-blue-600 text-white px-12 lg:px-16 py-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  CRM Portal
                </h1>
                <p className="text-sm text-blue-100">
                  Customer Relationship Management
                </p>
              </div>
            </div>
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Welcome back to your
                <span className="block">
                  CRM workspace.
                </span>
              </h2>
              <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-lg">
                Manage your organization, employees,
                customers and business activities from
                one centralized workspace.
              </p>

            </div>
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="text-blue-50">
                  Manage your employees
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="text-blue-50">
                  Track leads and customers
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="text-blue-50">
                  Manage deals and activities
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-blue-100">
            CRM Portal
          </div>
        </div>
        <div className="flex items-center justify-center px-8 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-lg">
            <div className="flex md:hidden items-center gap-3 mb-10">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  CRM Portal
                </h1>
                <p className="text-xs text-slate-500">
                  Customer Relationship Management
                </p>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-slate-500">
                Sign in to access your CRM workspace.
              </p>
            </div>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && (
                  <ArrowRight size={18} />
                )}
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?
              </p>
              <Link
                to="/signup"
                className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Create your organization account
              </Link>
              <div className="mt-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;