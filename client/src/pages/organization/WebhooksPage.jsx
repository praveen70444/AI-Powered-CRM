import { useEffect, useState } from "react";
import { Webhook, Plus, Trash2, Edit2, Key, CheckCircle, XCircle } from "lucide-react";
import Modal from "../../components/employee/Modal";
import api from "../../services/api";

const WEBHOOK_EVENTS = ["lead.created", "lead.updated", "lead.converted", "customer.created", "customer.updated", "deal.created", "deal.won", "deal.lost", "task.completed"];

function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("webhooks");
  const [modalOpen, setModalOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [] });
  const [keyForm, setKeyForm] = useState({ key_name: "", permissions: ["read"] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/organization/webhooks"),
      api.get("/organization/api-keys"),
    ]).then(([wRes, kRes]) => {
      setWebhooks(wRes.data.data || []);
      setApiKeys(kRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function saveWebhook(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await api.post("/organization/webhooks", form);
      setWebhooks(prev => [res.data.data, ...prev]);
      setModalOpen(false); setForm({ name: "", url: "", events: [] });
    } catch (err) { setError(err.response?.data?.message || "Failed to create webhook"); }
    finally { setSaving(false); }
  }

  async function deleteWebhook(id) {
    if (!window.confirm("Delete this webhook?")) return;
    await api.delete(`/organization/webhooks/${id}`);
    setWebhooks(prev => prev.filter(w => w.id !== id));
  }

  async function toggleWebhook(id, current) {
    const res = await api.put(`/organization/webhooks/${id}`, { is_active: !current });
    setWebhooks(prev => prev.map(w => w.id === id ? res.data.data : w));
  }

  async function createApiKey(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await api.post("/organization/api-keys", keyForm);
      setCreatedKey(res.data.data);
      setApiKeys(prev => [{ ...res.data.data, api_key: res.data.data.api_key?.slice(0, 8) + "..." }, ...prev]);
    } catch (err) { setError(err.response?.data?.message || "Failed to create API key"); }
    finally { setSaving(false); }
  }

  async function revokeKey(id) {
    if (!window.confirm("Revoke this API key? This cannot be undone.")) return;
    await api.delete(`/organization/api-keys/${id}`);
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  }

  function toggleEvent(ev) {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(ev) ? prev.events.filter(e => e !== ev) : [...prev.events, ev],
    }));
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhooks & API Keys</h1>
        <p className="mt-1 text-sm text-slate-500">Integrate your CRM with external systems.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {["webhooks", "api-keys"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-800"}`}>
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading ? <div className="text-sm text-slate-400 p-4">Loading...</div> : (
        <>
          {tab === "webhooks" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                  <Plus size={16} /> Add Webhook
                </button>
              </div>
              {webhooks.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Webhook size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">No webhooks configured</p>
                  <p className="text-xs text-slate-400 mt-1">Add a webhook to receive CRM events in your systems.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {webhooks.map(w => (
                    <div key={w.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{w.name}</p>
                          {w.is_active ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-400" />}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{w.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(w.events || []).map(ev => (
                            <span key={ev} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">{ev}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleWebhook(w.id, w.is_active)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${w.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
                          {w.is_active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => deleteWebhook(w.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "api-keys" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setKeyModalOpen(true); setCreatedKey(null); setKeyForm({ key_name: "", permissions: ["read"] }); setError(""); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                  <Key size={16} /> Generate API Key
                </button>
              </div>
              {apiKeys.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Key size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">No API keys</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {apiKeys.map(k => (
                    <div key={k.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{k.key_name}</p>
                          {k.is_active ? <CheckCircle size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{k.api_key}</p>
                        <div className="flex gap-1 mt-1">
                          {(k.permissions || []).map(p => (
                            <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">{p}</span>
                          ))}
                        </div>
                      </div>
                      {k.is_active && (
                        <button onClick={() => revokeKey(k.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Webhook Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Webhook"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="webhook-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Create Webhook"}
            </button>
          </>
        }>
        <form id="webhook-form" onSubmit={saveWebhook} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} placeholder="My Webhook" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
            <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required className={inputClass} placeholder="https://hooks.example.com/crm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Events to subscribe</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="rounded accent-blue-600" />
                  {ev}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Create API Key Modal */}
      <Modal open={keyModalOpen} onClose={() => { setKeyModalOpen(false); setCreatedKey(null); }} title="Create API Key"
        footer={
          createdKey ? (
            <button onClick={() => { setKeyModalOpen(false); setCreatedKey(null); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Done</button>
          ) : (
            <>
              <button onClick={() => setKeyModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
              <button type="submit" form="apikey-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Generating..." : "Generate Key"}
              </button>
            </>
          )
        }>
        {createdKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              API key created! Copy it now — it will not be shown again.
            </div>
            <div className="flex gap-2">
              <input readOnly value={createdKey.api_key} onFocus={e => e.target.select()}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 outline-none" />
              <button onClick={async () => { await navigator.clipboard.writeText(createdKey.api_key); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 whitespace-nowrap transition">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <form id="apikey-form" onSubmit={createApiKey} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Name *</label>
              <input value={keyForm.key_name} onChange={e => setKeyForm(p => ({ ...p, key_name: e.target.value }))} required className={inputClass} placeholder="e.g. Zapier Integration" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
              {["read", "write", "delete"].map(p => (
                <label key={p} className="flex items-center gap-2 text-sm text-slate-600 mb-2 cursor-pointer capitalize">
                  <input type="checkbox" checked={keyForm.permissions.includes(p)}
                    onChange={e => setKeyForm(prev => ({ ...prev, permissions: e.target.checked ? [...prev.permissions, p] : prev.permissions.filter(x => x !== p) }))}
                    className="rounded accent-blue-600" />
                  {p}
                </label>
              ))}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default WebhooksPage;
