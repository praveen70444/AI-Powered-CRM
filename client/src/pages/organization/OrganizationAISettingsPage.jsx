import { useEffect, useState } from "react";
import {
  Sparkles, Save, Loader2, CheckCircle, AlertTriangle,
  Eye, EyeOff, Flame, TrendingUp, Target, Mail, Search, Brain, FileText,
} from "lucide-react";
import api from "../../services/api";

const FEATURE_LIST = [
  {
    key: "lead_scoring_enabled",
    label: "AI Lead Scoring",
    description: "Automatically score leads 0–100 as Hot / Warm / Cold based on source, value, and engagement.",
    icon: Flame,
    requiresKey: false,
  },
  {
    key: "deal_health_enabled",
    label: "Deal Health Scores",
    description: "Rate each active deal's health and flag stale, overdue, or at-risk deals automatically.",
    icon: TrendingUp,
    requiresKey: false,
  },
  {
    key: "next_actions_enabled",
    label: "Next-Action Recommendations",
    description: "Suggest the single most impactful next step for each lead, deal, and customer.",
    icon: Target,
    requiresKey: false,
  },
  {
    key: "daily_briefing_enabled",
    label: "Daily AI Briefing",
    description: "Show a personalized summary on the dashboard each day highlighting priorities.",
    icon: Brain,
    requiresKey: false,
  },
  {
    key: "email_composer_enabled",
    label: "AI Email Composer",
    description: "Generate professional email drafts for leads and customers with one click. Requires OpenAI key.",
    icon: Mail,
    requiresKey: true,
  },
  {
    key: "nl_search_enabled",
    label: "Natural Language Search",
    description: "Let employees search CRM data using plain English queries. Requires OpenAI key.",
    icon: Search,
    requiresKey: true,
  },
  {
    key: "note_summarization_enabled",
    label: "Note Summarization",
    description: "Summarize all notes on a record into a concise insight. Requires OpenAI key.",
    icon: FileText,
    requiresKey: true,
  },
];

const MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (recommended — fast, cheap)" },
  { value: "gpt-4o", label: "GPT-4o (more capable, higher cost)" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (legacy)" },
];

export default function OrganizationAISettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/organization/ai-settings");
        setSettings(res.data.data);
      } catch (e) {
        // If 404, settings not created yet — use defaults
        if (e.response?.status === 404) {
          setSettings({
            lead_scoring_enabled: true,
            deal_health_enabled: true,
            next_actions_enabled: true,
            daily_briefing_enabled: true,
            email_composer_enabled: false,
            nl_search_enabled: false,
            note_summarization_enabled: false,
            openai_api_key_set: false,
            openai_model: "gpt-4o-mini",
            monthly_token_limit: 100000,
            tokens_used_this_month: 0,
          });
        } else {
          setError("Failed to load AI settings.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      lead_scoring_enabled: settings.lead_scoring_enabled,
      deal_health_enabled: settings.deal_health_enabled,
      next_actions_enabled: settings.next_actions_enabled,
      daily_briefing_enabled: settings.daily_briefing_enabled,
      email_composer_enabled: settings.email_composer_enabled,
      nl_search_enabled: settings.nl_search_enabled,
      note_summarization_enabled: settings.note_summarization_enabled,
      openai_model: settings.openai_model,
      monthly_token_limit: Number(settings.monthly_token_limit) || 100000,
    };

    if (apiKey.trim()) {
      payload.openai_api_key = apiKey.trim();
    }

    try {
      const res = await api.put("/organization/ai-settings", payload);
      setSettings(res.data.data);
      setApiKey("");
      setSuccess("AI settings saved successfully.");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save AI settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
        <Loader2 size={16} className="animate-spin" />
        Loading AI settings…
      </div>
    );
  }

  const hasOpenAIKey = settings?.openai_api_key_set;
  const tokenPct = settings?.monthly_token_limit > 0
    ? Math.min(100, Math.round((settings.tokens_used_this_month / settings.monthly_token_limit) * 100))
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
          <Sparkles size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">AI Settings</h1>
          <p className="text-sm text-slate-500">Configure AI features for your organization.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle size={15} className="shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Feature toggles */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div className="px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">AI Features</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rule-based features work without an OpenAI key. Features marked with ✦ require one.
            </p>
          </div>
          {FEATURE_LIST.map((f) => {
            const Icon = f.icon;
            const enabled = settings?.[f.key] ?? false;
            const blocked = f.requiresKey && !hasOpenAIKey;
            return (
              <div key={f.key} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${enabled ? "bg-violet-100" : "bg-slate-100"}`}>
                    <Icon size={15} className={enabled ? "text-violet-600" : "text-slate-400"} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {f.label}
                      {f.requiresKey && (
                        <span className="ml-1.5 text-xs text-amber-600 font-normal">✦ OpenAI key required</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.description}</p>
                    {blocked && (
                      <p className="text-xs text-amber-600 mt-1">Add an OpenAI API key below to enable this feature.</p>
                    )}
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => !blocked && toggle(f.key)}
                  disabled={blocked}
                  className={`relative inline-flex h-5 w-9 shrink-0 mt-0.5 rounded-full transition-colors focus:outline-none ${
                    enabled && !blocked ? "bg-violet-600" : "bg-slate-200"
                  } ${blocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  role="switch"
                  aria-checked={enabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                      enabled && !blocked ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* OpenAI Configuration */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">OpenAI Configuration</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Required for Email Composer, Natural Language Search, and Note Summarization.
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* API Key status */}
            <div className="flex items-center gap-2">
              {hasOpenAIKey ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle size={12} /> API key is set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={12} /> No API key configured
                </span>
              )}
            </div>

            {/* API Key input */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                {hasOpenAIKey ? "Replace API Key (leave blank to keep existing)" : "OpenAI API Key"}
              </label>
              <div className="relative mt-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasOpenAIKey ? "Enter new key to replace…" : "sk-proj-…"}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your key is stored securely server-side and never returned in API responses.
              </p>
            </div>

            {/* Model selection */}
            <div>
              <label className="text-xs font-medium text-slate-500">AI Model</label>
              <select
                value={settings?.openai_model || "gpt-4o-mini"}
                onChange={(e) => setSettings((p) => ({ ...p, openai_model: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Monthly token limit */}
            <div>
              <label className="text-xs font-medium text-slate-500">Monthly Token Limit</label>
              <input
                type="number"
                value={settings?.monthly_token_limit || 100000}
                onChange={(e) => setSettings((p) => ({ ...p, monthly_token_limit: e.target.value }))}
                min={10000}
                step={10000}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                AI features will be disabled for the rest of the month once this limit is reached.
              </p>
            </div>

            {/* Token usage */}
            {settings?.monthly_token_limit > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Tokens used this month</span>
                  <span className="font-medium">
                    {(settings.tokens_used_this_month || 0).toLocaleString()} / {Number(settings.monthly_token_limit).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${tokenPct > 80 ? "bg-red-500" : tokenPct > 50 ? "bg-amber-500" : "bg-violet-500"}`}
                    style={{ width: `${tokenPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{tokenPct}% used</p>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save AI Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
