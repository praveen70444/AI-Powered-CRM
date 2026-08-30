import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getInvitation, acceptInvitation } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  User,
  Lock,
  Mail,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let isMounted = true;
    async function loadInvitation() {
      if (!token) {
        if (isMounted) {
          setInvitationError("No invitation token provided");
          setLoadingInvitation(false);
        }
        return;
      }
      try {
        const response = await getInvitation(token);
        if (!isMounted) return;
        setInvitation(response.data);
      } catch (err) {
        if (!isMounted) return;
        setInvitationError(
          err.response?.data?.message || "This invitation is invalid or has expired"
        );
      } finally {
        if (isMounted) setLoadingInvitation(false);
      }
    }
    loadInvitation();
    return () => {
      isMounted = false;
    };
  }, [token]);
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
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await acceptInvitation({
        token,
        name: formData.name,
        password: formData.password,
      });
      await login(invitation.email, formData.password);
      navigate("/employee");
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to complete account setup";
      setError(message);
    } finally {
      setSubmitting(false);
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
                <h1 className="text-xl font-bold">CRM Portal</h1>
                <p className="text-sm text-blue-100">Customer Relationship Management</p>
              </div>
            </div>
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                You've been invited
                <span className="block">to join the team.</span>
              </h2>
              <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-lg">
                Set a password to activate your account and get started.
              </p>
            </div>
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="text-blue-50">Access your employee dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="text-blue-50">Track leads, deals and tasks</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-blue-100">CRM Portal</div>
        </div>
        <div className="flex items-center justify-center px-8 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-lg">
            <div className="flex md:hidden items-center gap-3 mb-10">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">CRM Portal</h1>
                <p className="text-xs text-slate-500">Customer Relationship Management</p>
              </div>
            </div>
            {loadingInvitation ? (
              <p className="text-slate-500">Checking your invitation...</p>
            ) : invitationError ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Invitation unavailable</h2>
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {invitationError}
                </div>
                <Link to="/login" className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Go to login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Activate your account</h2>
                  <p className="mt-2 text-slate-500">
                    You've been invited to join {invitation.organizationName} as {invitation.role.replace("_", " ").toLowerCase()}.
                  </p>
                </div>
                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={invitation.email}
                        disabled
                        className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full name
                    </label>
                    <div className="relative">
                      <User size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        autoComplete="name"
                        required
                        className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                        className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        required
                        className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Activating..." : "Activate account"}
                    {!submitting && <ArrowRight size={18} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AcceptInvitationPage;
