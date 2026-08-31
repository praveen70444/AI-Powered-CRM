import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Building2 } from "lucide-react";
import { requestPasswordReset } from "../services/authService";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      setError(err.friendlyMessage || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 size={19} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">CRM Portal</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {success ? (
            /* Success state */
            <div className="text-center animate-fade-up">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-500 mb-2">
                If an account exists for <strong className="text-slate-700">{email}</strong>, we've sent a reset link.
              </p>
              <p className="text-xs text-slate-400 mb-8">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft size={15} /> Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                <Mail size={22} className="text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                      placeholder="you@company.com"
                      required
                      className="w-full h-11 pl-10 pr-4 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100 hover:border-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Send reset link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
