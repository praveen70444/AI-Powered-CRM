import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2, Building2 } from "lucide-react";
import { verifyResetToken, resetPassword } from "../services/authService";

function PasswordInput({ value, onChange, placeholder, show, onToggle, label }) {
  const strength = () => {
    if (!value) return null;
    if (value.length < 8) return { w: "w-1/4", color: "bg-red-500", label: "Too short" };
    if (value.length < 10 || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { w: "w-2/4", color: "bg-amber-400", label: "Fair" };
    return { w: "w-full", color: "bg-green-500", label: "Strong" };
  };
  const s = label === "New password" ? strength() : null;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full h-11 pl-10 pr-10 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100 hover:border-slate-400"
        />
        <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {s && (
        <div className="mt-2">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${s.w} ${s.color}`} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Strength: <span className="font-medium">{s.label}</span></p>
        </div>
      )}
    </div>
  );
}

function Wrapper({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 size={19} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">CRM Portal</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">{children}</div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tokenValid, setTokenValid] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await verifyResetToken(token);
        setTokenValid(true);
        setUserEmail(res.data?.email || "");
      } catch { setTokenValid(false); }
    }
    checkToken();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.friendlyMessage || "Failed to reset password. The link may have expired.");
    } finally { setLoading(false); }
  }

  if (tokenValid === null) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center py-6 gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Verifying reset link…</p>
        </div>
      </Wrapper>
    );
  }

  if (!tokenValid) {
    return (
      <Wrapper>
        <div className="text-center animate-fade-up">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link expired</h1>
          <p className="text-sm text-slate-500 mb-6">This reset link is invalid or has expired. Request a new one.</p>
          <Link to="/forgot-password" className="inline-flex items-center justify-center h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
            Request new link
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (success) {
    return (
      <Wrapper>
        <div className="text-center animate-fade-up">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Password reset!</h1>
          <p className="text-sm text-slate-500 mb-1">Your password has been changed successfully.</p>
          <p className="text-xs text-slate-400">Redirecting to sign in in 3 seconds…</p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
        <Lock size={22} className="text-blue-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">Set new password</h1>
      {userEmail && <p className="text-sm text-slate-500 mb-6">Resetting for <strong className="text-slate-700">{userEmail}</strong></p>}

      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordInput value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }} placeholder="At least 8 characters" show={showPassword} onToggle={() => setShowPassword((v) => !v)} label="New password" />
        <PasswordInput value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(""); }} placeholder="Re-enter your password" show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} label="Confirm password" />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting…</> : "Reset password"}
        </button>
      </form>
    </Wrapper>
  );
}

export default ResetPasswordPage;
