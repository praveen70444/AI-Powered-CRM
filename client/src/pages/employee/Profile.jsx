import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Building2, Briefcase, MapPin, CalendarDays, UserCircle2, Camera, Lock, Bell } from "lucide-react";
import { getEmployeeProfile, updateEmployeeProfile, uploadAvatar } from "../../services/employeeService";
import ChangePasswordModal from "../../components/employee/ChangePasswordModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const BASE_URL = "http://localhost:5000";

function Profile() {
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", department: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const response = await getEmployeeProfile();
        if (!isMounted) return;
        setProfile(response.data);
        setForm({
          name: response.data.name || "",
          phone: response.data.phone || "",
          department: response.data.department || "",
          location: response.data.location || "",
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    api.get("/employee/notification-preferences").then((res) => {
      setNotifPrefs(res.data.data);
    }).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await updateEmployeeProfile(form);
      setProfile(response.data);
      setForm({
        name: response.data.name || "",
        phone: response.data.phone || "",
        department: response.data.department || "",
        location: response.data.location || "",
      });
      updateUser({ name: response.data.name });
      setSuccessMessage("Profile updated successfully");
    } catch (err) {
      setError(err.friendlyMessage || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be under 5MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const response = await uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar_url: response.data.avatarUrl }));
      setSuccessMessage("Avatar updated successfully");
    } catch (err) {
      setError(err.friendlyMessage || "Failed to upload avatar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSaveNotifPrefs() {
    if (!notifPrefs) return;
    setNotifSaving(true);
    setNotifSuccess("");
    try {
      await api.put("/employee/notification-preferences", notifPrefs);
      setNotifSuccess("Preferences saved successfully");
      setTimeout(() => setNotifSuccess(""), 3000);
    } catch {
      // silent
    } finally {
      setNotifSaving(false);
    }
  }

  function togglePref(key) {
    setNotifPrefs((p) => p ? { ...p, [key]: !p[key] } : p);
  }

  const initials = profile?.name

  const avatarSrc = profile?.avatar_url
    ? profile.avatar_url.startsWith("http") ? profile.avatar_url : `${BASE_URL}${profile.avatar_url}`
    : null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column — avatar + info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative group">
            <div className="h-20 w-20 rounded-full bg-blue-600 text-white text-2xl font-semibold flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials || <UserCircle2 size={32} />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              title="Change avatar"
            >
              {uploading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Click avatar to change photo</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-3">{profile?.name || "Not available"}</h2>
          <p className="text-sm text-gray-500">{profile?.role || "Not available"}</p>
          <span className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
            {profile?.status || "ACTIVE"}
          </span>

          <div className="w-full mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail size={15} className="text-gray-400 shrink-0" /> {profile?.email || "Not available"}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone size={15} className="text-gray-400 shrink-0" /> {profile?.phone || "Not set"}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Building2 size={15} className="text-gray-400 shrink-0" /> {profile?.organization_name || "Not available"}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Briefcase size={15} className="text-gray-400 shrink-0" /> {profile?.department || "Not set"}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin size={15} className="text-gray-400 shrink-0" /> {profile?.location || "Not set"}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CalendarDays size={15} className="text-gray-400 shrink-0" />
              {profile?.created_at ? `Joined ${formatDate(profile.created_at)}` : "Join date not available"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Lock size={14} />
            Change Password
          </button>
        </div>

        {/* Right column — edit form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserCircle2 size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Profile Settings</h3>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{successMessage}</div>
          )}

          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <input value={profile?.role || ""} disabled className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <input value={profile?.email || ""} disabled className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Sales, Support" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Mumbai, India" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Organization</label>
                <input value={profile?.organization_name || ""} disabled className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Last Login</label>
                <input value={profile?.last_login_at ? formatDate(profile.last_login_at) : "Not available"} disabled className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

      {/* Notification Preferences Card */}
      {notifPrefs && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-4">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Notification Preferences</h3>
          </div>
          {notifSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{notifSuccess}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Email Notifications</p>
              <div className="space-y-3">
                {[
                  { key: "email_on_lead", label: "New lead assigned" },
                  { key: "email_on_task_due", label: "Task due reminder" },
                  { key: "email_on_deal_won", label: "Deal won" },
                  { key: "email_on_deal_close_soon", label: "Deal closing soon" },
                  { key: "email_daily_digest", label: "Daily digest" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      type="button"
                      onClick={() => togglePref(key)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${notifPrefs[key] ? "bg-blue-600" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${notifPrefs[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">In-App Notifications</p>
              <div className="space-y-3">
                {[
                  { key: "in_app_lead", label: "Lead updates" },
                  { key: "in_app_task", label: "Task updates" },
                  { key: "in_app_deal", label: "Deal updates" },
                  { key: "in_app_customer", label: "Customer updates" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      type="button"
                      onClick={() => togglePref(key)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${notifPrefs[key] ? "bg-blue-600" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${notifPrefs[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={handleSaveNotifPrefs}
              disabled={notifSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {notifSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
