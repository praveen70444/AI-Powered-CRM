import { useEffect, useState } from "react";
import { Building2, Save, CheckCircle, AlertCircle, Globe, Phone, MapPin } from "lucide-react";
import { getOrganizationSettings, updateOrganizationSettings } from "../../services/organizationService";

const TIMEZONES = ["UTC", "Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Singapore"];
const CURRENCIES = ["USD", "INR", "EUR", "GBP", "AUD", "SGD"];

function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "", industry: "", website: "", phone: "",
    address: "", city: "", state: "", country: "", postalCode: "",
    timezone: "UTC", currency: "USD",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getOrganizationSettings();
        const d = res.data || {};
        setForm({
          name: d.name || "",
          industry: d.industry || "",
          website: d.website || "",
          phone: d.phone || "",
          address: d.address || "",
          city: d.city || "",
          state: d.state || "",
          country: d.country || "",
          postalCode: d.postal_code || "",
          timezone: d.timezone || "UTC",
          currency: d.currency || "USD",
        });
      } catch (err) {
        setError(err.friendlyMessage || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim()) { setError("Organization name is required."); return; }
    try {
      setSaving(true);
      await updateOrganizationSettings(form);
      setSuccess("Organization settings updated successfully.");
    } catch (err) {
      setError(err.friendlyMessage || "Unable to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div><h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1></div>
        <div className="h-96 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your organization information and preferences.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} /><span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
              <input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Technology, Healthcare" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourcompany.com" className={`${inputClass} pl-9`} />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Address</h2>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
              <input name="state" value={form.state} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <input name="country" value={form.country} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
              <select name="timezone" value={form.timezone} onChange={handleChange} className={inputClass}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <select name="currency" value={form.currency} onChange={handleChange} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrganizationSettingsPage;
