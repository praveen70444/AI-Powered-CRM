import { useEffect, useMemo, useState } from "react";
import { Contact, AlertCircle } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import TagsInput from "../../components/employee/TagsInput";
import ChurnRiskBadge from "../../components/ai/ChurnRiskBadge";
import NextActionBanner from "../../components/ai/NextActionBanner";
import { CUSTOMER_STATUSES } from "../../mock/customers";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, exportCustomers } from "../../services/employeeService";
import { getChurnRisk, getCustomerNextAction } from "../../services/aiService";
import api from "../../services/api";
const PAGE_SIZE = 6;
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

  // Run churn analysis and merge risk back into local state
  const runChurnAnalysis = async () => {
    setAnalyzingChurn(true);
    try {
      const res = await getChurnRisk();
      const riskMap = {};
      (res.data?.all || []).forEach((r) => {
        riskMap[r.customerId] = r.churnRisk;
      });
      setCustomers((prev) =>
        prev.map((c) => (riskMap[c.id] !== undefined ? { ...c, ai_churn_risk: riskMap[c.id] } : c))
      );
    } catch { /* silent */ }
    finally { setAnalyzingChurn(false); }
  };
  useEffect(() => {
    let isMounted = true;
    async function loadCustomers() {
      try {
        setLoading(true);
        setError("");
        const response = await getCustomers();
        if (!isMounted) return;
        setCustomers(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load customers.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, []);
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status ? c.status === status : true;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function openAddModal() {
    setActiveCustomer(null);
    setDupWarning("");
    setModalOpen(true);
  }
  function openEditModal(customer) {
    setActiveCustomer(customer);
    setDupWarning("");
    setModalOpen(true);
  }
  async function checkDuplicate(email, phone) {
    if (!email && !phone) return;
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);
      if (activeCustomer) params.append("excludeId", activeCustomer.id);
      const res = await api.get(`/employee/customers/check-duplicate?${params}`);
      const dupes = res.data?.data?.duplicates || [];
      setDupWarning(dupes.length > 0 ? `⚠️ Similar customer exists: ${dupes[0].name} (${dupes[0].email})` : "");
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
    setSaving(true);
    setError("");
    try {
      if (activeCustomer) {
        const response = await updateCustomer(activeCustomer.id, payload);
        setCustomers((prev) => prev.map((c) => (c.id === activeCustomer.id ? response.data : c)));
      } else {
        const response = await createCustomer(payload);
        setCustomers((prev) => [response.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  }
  async function confirmDelete() {
    setSaving(true);
    setError("");
    try {
      await deleteCustomer(deleteTarget.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete customer.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 pt-4 gap-2">
        <button
          onClick={runChurnAnalysis}
          disabled={analyzingChurn || loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
        >
          {analyzingChurn ? "Analyzing…" : "✨ Churn Analysis"}
        </button>
        <ExportMenu onExport={exportCustomers} />
      </div>
      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search customers by name, company, email..."
        addLabel="Add Customer"
        onAddClick={openAddModal}
        filters={
          <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={CUSTOMER_STATUSES} allLabel="All Statuses" />
        }
      />
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading customers...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Contact}
          title="No customers found"
          description="Try adjusting your search or filters, or add a new customer to get started."
          actionLabel="Add Customer"
          onAction={openAddModal}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Industry</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Churn Risk</th>
                <th className="px-6 py-3 font-medium">Total Spend</th>
                <th className="px-6 py-3 font-medium">Customer Since</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-400">{customer.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.company}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.industry}</td>
                  <td className="px-6 py-4"><StatusBadge value={customer.status} /></td>
                  <td className="px-6 py-4">
                    <ChurnRiskBadge risk={customer.ai_churn_risk} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">₹{customer.totalSpend.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.since}</td>
                  <td className="px-6 py-4">
                    <RowActions
                      onView={() => openEditModal(customer)}
                      onEdit={() => openEditModal(customer)}
                      onDelete={() => setDeleteTarget(customer)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeCustomer ? "Edit Customer" : "Add Customer"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
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
              <label className="text-xs font-medium text-gray-500">Full Name</label>
              <input name="name" defaultValue={activeCustomer?.name} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company</label>
              <input name="company" defaultValue={activeCustomer?.company} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <input type="email" name="email" defaultValue={activeCustomer?.email} required
                onBlur={e => checkDuplicate(e.target.value, document.querySelector('[name="phone"]')?.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <input name="phone" defaultValue={activeCustomer?.phone}
                onBlur={e => checkDuplicate(document.querySelector('[name="email"]')?.value, e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Industry</label>
              <input name="industry" defaultValue={activeCustomer?.industry} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
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
          {activeCustomer && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags</label>
              <TagsInput entityType="customer" entityId={activeCustomer.id} />
            </div>
          )}
          {activeCustomer && (
            <NextActionBanner
              fetchFn={() => getCustomerNextAction(activeCustomer.id)}
              entityId={activeCustomer.id}
            />
          )}
        </form>
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
export default Customers;
