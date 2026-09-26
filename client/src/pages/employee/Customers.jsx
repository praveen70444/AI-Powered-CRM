import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Contact, AlertCircle, X, Plus, ChevronRight,
  Phone, Building2, IndianRupee, Calendar, Pencil, Trash2,
} from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import TagsInput from "../../components/employee/TagsInput";
import ChurnRiskBadge from "../../components/ai/ChurnRiskBadge";
import NextActionBanner from "../../components/ai/NextActionBanner";
import AIEmailComposer from "../../components/ai/AIEmailComposer";
import { CUSTOMER_STATUSES } from "../../mock/customers";
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getCustomerFollowups, createCustomerFollowup, updateCustomerFollowup, deleteCustomerFollowup,
} from "../../services/employeeService";
import { exportCustomers } from "../../services/exportService";
import { getChurnRisk, getCustomerNextAction } from "../../services/aiService";
import api from "../../services/api";

const PAGE_SIZE = 8;

const INDUSTRY_OPTIONS = [
  "Technology", "Real Estate", "Healthcare", "Finance", "Education",
  "Manufacturing", "Retail", "Construction", "Hospitality", "Other",
];

// ── Customer Detail Side Panel ─────────────────────────────────────────────
function CustomerDetailPanel({ customer, onClose, onEdit, onDelete }) {
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editNext, setEditNext] = useState("");
  const [tab, setTab] = useState("followups");

  useEffect(() => {
    if (!customer) return;
    setLoadingFollowups(true);
    getCustomerFollowups(customer.id)
      .then((r) => setFollowups(r.data || []))
      .catch(() => setFollowups([]))
      .finally(() => setLoadingFollowups(false));
  }, [customer]);

  const addFollowup = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const r = await createCustomerFollowup(customer.id, {
        note: newNote.trim(),
        followupDate: new Date().toISOString().split("T")[0],
        nextFollowupDate: nextDate || null,
      });
      setFollowups((prev) => [r.data, ...prev]);
      setNewNote(""); setNextDate("");
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const saveEdit = async (f) => {
    try {
      const r = await updateCustomerFollowup(f.id, { note: editNote || f.note, nextFollowupDate: editNext || null });
      setFollowups((prev) => prev.map((x) => (x.id === f.id ? r.data : x)));
      setEditingId(null);
    } catch { /* silent */ }
  };

  const removeFollowup = async (id) => {
    try {
      await deleteCustomerFollowup(id);
      setFollowups((prev) => prev.filter((f) => f.id !== id));
    } catch { /* silent */ }
  };

  const fmt = (d) => !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{customer.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{customer.company} · {customer.phone || "No phone"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
              <Pencil size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: "followups", label: `Follow-up History (${followups.length})` },
            { key: "details", label: "Details" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >{t.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Follow-up Tab ── */}
          {tab === "followups" && (
            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-emerald-700">Add Follow-up Note</p>
                <textarea rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  placeholder="What was discussed? Any updates to customer status, requirements..."
                  className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white resize-none"
                />
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Next Follow-up Date</label>
                    <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <button onClick={addFollowup} disabled={saving || !newNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {saving ? "Saving..." : "Add"}
                  </button>
                </div>
              </div>

              {loadingFollowups ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading history...</p>
              ) : followups.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No follow-ups yet. Add the first one above.</p>
              ) : (
                <div className="space-y-3">
                  {followups.map((f) => (
                    <div key={f.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                      {editingId === f.id ? (
                        <div className="space-y-2">
                          <textarea rows={3} value={editNote} onChange={(e) => setEditNote(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                          <div>
                            <label className="text-xs text-gray-500">Next Follow-up</label>
                            <input type="date" value={editNext} onChange={(e) => setEditNext(e.target.value)}
                              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(f)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{f.note}</p>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => { setEditingId(f.id); setEditNote(f.note); setEditNext(f.nextFollowupDate?.split("T")[0] || ""); }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xs">Edit</button>
                              <button onClick={() => removeFollowup(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs">Del</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(f.followupDate)}</span>
                            {f.nextFollowupDate && (
                              <span className="flex items-center gap-1 text-amber-600"><Calendar size={11} /> Next: {fmt(f.nextFollowupDate)}</span>
                            )}
                            <span>by {f.author}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Details Tab ── */}
          {tab === "details" && (
            <div className="p-6 space-y-4">
              {[
                { icon: Building2, label: "Company", value: customer.company },
                { icon: Phone, label: "Phone", value: customer.phone },
                { icon: Building2, label: "Industry", value: customer.industry },
                { icon: IndianRupee, label: "Total Spend", value: customer.totalSpend ? `₹${Number(customer.totalSpend).toLocaleString("en-IN")}` : null },
                { icon: Calendar, label: "Customer Since", value: customer.since ? new Date(customer.since).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 flex gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <StatusBadge value={customer.status} />
                </div>
                {customer.ai_churn_risk && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Churn Risk</p>
                    <ChurnRiskBadge risk={customer.ai_churn_risk} />
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <TagsInput entityType="customer" entityId={customer.id} />
              </div>
              <NextActionBanner fetchFn={() => getCustomerNextAction(customer.id)} entityId={customer.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Customers Page ────────────────────────────────────────────────────
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dupWarning, setDupWarning] = useState("");
  const [analyzingChurn, setAnalyzingChurn] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const response = await getCustomers();
      setCustomers(response.data);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to load customers.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const runChurnAnalysis = async () => {
    setAnalyzingChurn(true);
    try {
      const res = await getChurnRisk();
      const riskMap = {};
      (res.data?.all || []).forEach((r) => { riskMap[r.customerId] = r.churnRisk; });
      setCustomers((prev) => prev.map((c) => riskMap[c.id] !== undefined ? { ...c, ai_churn_risk: riskMap[c.id] } : c));
    } catch { /* silent */ }
    finally { setAnalyzingChurn(false); }
  };

  const filtered = useMemo(() => customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q)) &&
      (status ? c.status === status : true)
    );
  }), [customers, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAddModal() { setActiveCustomer(null); setDupWarning(""); setModalOpen(true); }
  function openEditModal(c) { setActiveCustomer(c); setDupWarning(""); setModalOpen(true); }

  async function checkDuplicate(email, phone) {
    if (!email && !phone) return;
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);
      if (activeCustomer) params.append("excludeId", activeCustomer.id);
      const res = await api.get(`/employee/customers/check-duplicate?${params}`);
      const dupes = res.data?.data?.duplicates || [];
      setDupWarning(dupes.length > 0 ? `⚠️ Similar customer: ${dupes[0].name} (${dupes[0].email})` : "");
    } catch { /* silent */ }
  }

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get("name"),
      company: form.get("company"),
      email: form.get("email"),
      phone: form.get("phone"),
      status: form.get("status"),
      industry: form.get("industry"),
      totalSpend: Number(form.get("totalSpend")) || 0,
    };
    setSaving(true); setError("");
    try {
      if (activeCustomer) {
        const r = await updateCustomer(activeCustomer.id, payload);
        setCustomers((prev) => prev.map((c) => c.id === activeCustomer.id ? r.data : c));
        if (detailCustomer?.id === activeCustomer.id) setDetailCustomer(r.data);
      } else {
        const r = await createCustomer(payload);
        setCustomers((prev) => [r.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save customer.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true); setError("");
    try {
      await deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (detailCustomer?.id === deleteTarget.id) setDetailCustomer(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete customer.");
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 pt-4 gap-2">
        <button onClick={runChurnAnalysis} disabled={analyzingChurn || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
        >
          {analyzingChurn ? "Analyzing…" : "✨ Churn Analysis"}
        </button>
        <ExportMenu onExport={exportCustomers} />
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, phone, company..."
        addLabel="Add Customer"
        onAddClick={openAddModal}
        filters={
          <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={CUSTOMER_STATUSES} allLabel="All Statuses" />
        }
      />

      {error && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading customers...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={Contact} title="No customers found" description="Try adjusting filters or add a new customer."
          actionLabel="Add Customer" onAction={openAddModal}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source / Since</th>
                <th className="px-4 py-3 font-medium">Churn Risk</th>
                <th className="px-4 py-3 font-medium">Total Spend</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setDetailCustomer(customer)}
                  className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      </div>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors ml-1" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.company}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{customer.industry || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge value={customer.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {customer.since ? new Date(customer.since).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3"><ChurnRiskBadge risk={customer.ai_churn_risk} /></td>
                  <td className="px-4 py-3 text-gray-600">₹{Number(customer.totalSpend).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {/* Inline edit/delete — no 3-dot */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(customer); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      ><Pencil size={14} /></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(customer); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeCustomer ? "Edit Customer" : "Add Customer"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="customer-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeCustomer ? "Save Changes" : "Add Customer"}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSave} className="space-y-4">
          {dupWarning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />{dupWarning}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Full Name *</label>
              <input name="name" defaultValue={activeCustomer?.name} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <input name="phone" defaultValue={activeCustomer?.phone}
                onBlur={(e) => checkDuplicate("", e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Email *</label>
              <input type="email" name="email" defaultValue={activeCustomer?.email} required
                onBlur={(e) => checkDuplicate(e.target.value, "")}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company *</label>
              <input name="company" defaultValue={activeCustomer?.company} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Industry</label>
              <select name="industry" defaultValue={activeCustomer?.industry || ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option value="">— Select —</option>
                {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select name="status" defaultValue={activeCustomer?.status || CUSTOMER_STATUSES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Total Spend (₹)</label>
            <input type="number" name="totalSpend" defaultValue={activeCustomer?.totalSpend} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Customer"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Delete <span className="font-medium text-gray-900">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
      </Modal>

      {/* AI Email Composer */}
      {emailComposerOpen && activeCustomer && (
        <AIEmailComposer entityType="customer" entityId={activeCustomer.id} entityName={activeCustomer.name} onClose={() => setEmailComposerOpen(false)} />
      )}

      {/* Detail Panel */}
      {detailCustomer && (
        <CustomerDetailPanel
          customer={detailCustomer}
          onClose={() => setDetailCustomer(null)}
          onEdit={() => { openEditModal(detailCustomer); }}
          onDelete={() => { setDeleteTarget(detailCustomer); setDetailCustomer(null); }}
        />
      )}
    </div>
  );
}

export default Customers;
