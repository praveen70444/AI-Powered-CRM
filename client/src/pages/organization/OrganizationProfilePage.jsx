import { useEffect, useState, useRef } from "react";
import { UserCircle, Mail, Shield, Save, CheckCircle, AlertCircle, Camera, Lock, Phone, Briefcase, MapPin } from "lucide-react";
import { getOrganizationProfile, updateOrganizationProfile } from "../../services/organizationService";
import api from "../../services/api";

const BASE_URL = "http://localhost:5000";

function ChangePasswordInline() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("Passwords do not match"); return; }
    setSaving(true); setError("");
    try {
      await api.post("/password/change", { currentPassword: current, newPassword: next });
      setSuccess(true);
      setTimeout(() => { setOpen(false); setCurrent(""); setNext(""); setConfirm(""); setSuccess(false); }, 1500);
    } catch (err) {
      setError(err.friendlyMessage || "Failed to change password");
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
        <Lock size={14} />Change Password
      </button>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-5 space-y-3 mt-4">
      <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
      {success ? <p className="text-sm text-green-600 font-medium">Password changed!</p> : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {[["Current Password", current, setCurrent], ["New Password", next, setNext], ["Confirm New Password", confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label}>
              <label className="text-xs font-medium text-slate-500">{label}</label>
              <input type="password" value={val} onChange={e => setter(e.target.value)} required
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Update"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function OrganizationProfilePage() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", department: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getOrganizationProfile();
        setProfile(res.data);
        setForm({
          name: res.data?.name || "",
          phone: res.data?.phone || "",
          department: res.data?.department || "",
          location: res.data?.location || "",
        });
      } catch (err) {
        setError(err.friendlyMessage || "Unable to load profile.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    try {
      setSaving(true);
      const res = await updateOrganizationProfile(form);
      setProfile(res.data);
      setForm({ name: res.data.name || "", phone: res.data.phone || "", department: res.data.department || "", location: res.data.location || "" });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.friendlyMessage || "Unable to update profile.");
    } finally { setSaving(false); }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/files/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile(p => ({ ...p, avatar_url: res.data.data.avatarUrl }));
      setSuccess("Avatar updated!");
    } catch (err) { setError(err.friendlyMessage || "Failed to upload avatar"); }
    finally { setUploading(false); e.target.value = ""; }
  }

  const avatarSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith("http") ? profile.avatar_url : `${BASE_URL}${profile.avatar_url}`)
    : null;

  const initials = profile?.name ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "";

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div><h1 className="text-2xl font-bold text-slate-900">Profile</h1></div>
        <div className="h-72 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your administrator profile.</p>
      </div>

      {error && <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} /><span>{error}</span></div>}
      {success && <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"><CheckCircle size={18} /><span>{success}</span></div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            <div className="h-20 w-20 rounded-full bg-blue-600 text-white text-2xl font-semibold flex items-center justify-center overflow-hidden">
              {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" /> : (initials || <UserCircle size={32} />)}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Camera size={18} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-xs text-slate-400 mb-3">Click to change photo</p>
          <p className="text-base font-semibold text-slate-900">{profile?.name}</p>
          <p className="text-sm text-slate-500 mt-1">{profile?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Shield size={12} /> {profile?.role || "ORG_ADMIN"}
          </span>
          <ChangePasswordInline />
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><UserCircle size={18} /></div>
            <h2 className="text-base font-semibold text-slate-900">Administrator Information</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={profile?.email || ""} disabled className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Administration"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Mumbai, India"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                <span className="inline-flex px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">{profile?.status || "ACTIVE"}</span>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                <Save size={16} />{saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrganizationProfilePage;
