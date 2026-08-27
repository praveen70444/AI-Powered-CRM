import { useEffect, useMemo, useState, useCallback } from "react";
import { Users, AlertCircle } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import RowActions from "../../components/employee/RowActions";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import ConvertLeadModal from "../../components/employee/ConvertLeadModal";
import TagsInput from "../../components/employee/TagsInput";
import { LEAD_STATUSES, LEAD_SOURCES } from "../../mock/leads";
import { getLeads, createLead, updateLead, deleteLead, exportLeads } from "../../services/employeeService";
import api from "../../services/api";
const PAGE_SIZE = 6;
function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [convertTarget, setConvertTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // ponytail: simple state for duplicate warning — no abstraction needed
  const [dupWarning, setDupWarning] = useState("");
  useEffect(() => {
    let isMounted = true;
    async function loadLeads() {
      try {
        setLoading(true);
        setError("");
        const response = await getLeads();
        if (!isMounted) return;
        setLeads(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load leads.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLeads();
    return () => {
      isMounted = false;
    };
  }, []);
  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status ? l.status === status : true;
      const matchesSource = source ? l.source === source : true;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, status, source]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function openAddModal() {
    setActiveLead(null);
    setDupWarning("");
    setModalOpen(true);
  }
  function openEditModal(lead) {
    setActiveLead(lead);
    setDupWarning("");
    setModalOpen(true);
  }
  async function checkDuplicate(email, phone) {
    if (!email && !phone) return;
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);
      if (activeLead) params.append("excludeId", activeLead.id);
      const res = await api.get(`/employee/leads/check-duplicate?${params}`);
      const dupes = res.data?.data?.duplicates || [];
      setDupWarning(dupes.length > 0 ? `⚠️ Similar lead exists: ${dupes[0].name} (${dupes[0].email})` : "");
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
      source: form.get("source"),
      value: Number(form.get("value")) || 0,
    };
    setSaving(true);
    setError("");
    try {
      if (activeLead) {
        const response = await updateLead(activeLead.id, payload);
        setLeads((prev) => prev.map((l) => (l.id === activeLead.id ? response.data : l)));
      } else {
        const response = await createLead(payload);
        setLeads((prev) => [response.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save lead.");
    } finally {
      setSaving(false);
    }
  }
  async function confirmDelete() {
    setSaving(true);
    setError("");
    try {
      await deleteLead(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete lead.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 pt-4 gap-2">
        <ExportMenu onExport={exportLeads} />
      </div>
      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search leads by name, company, email..."
        addLabel="Add Lead"
        onAddClick={openAddModal}
        filters={
          <>
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={LEAD_STATUSES} allLabel="All Statuses" />
            <FilterSelect value={source} onChange={(v) => { setSource(v); setPage(1); }} options={LEAD_SOURCES} allLabel="All Sources" />
          </>
        }
      />
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading leads...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description="Try adjusting your search or filters, or add a new lead to get started."
          actionLabel="Add Lead"
          onAction={openAddModal}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Lead</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{lead.company}</td>
                  <td className="px-6 py-4"><StatusBadge value={lead.status} /></td>
                  <td className="px-6 py-4 text-gray-600">{lead.source}</td>
                  <td className="px-6 py-4 text-gray-600">₹{lead.value.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.owner}</td>
                  <td className="px-6 py-4">
                    <RowActions
                      onView={() => openEditModal(lead)}
                      onEdit={() => openEditModal(lead)}
                      onDelete={() => setDeleteTarget(lead)}
                      extra={lead.status !== "Converted" ? [
                        { label: "Convert to Customer", onClick: () => setConvertTarget(lead) }
                      ] : []}
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
        title={activeLead ? "Edit Lead" : "Add Lead"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" form="lead-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeLead ? "Save Changes" : "Add Lead"}
            </button>
          </>
        }
      >
        <form id="lead-form" onSubmit={handleSave} className="space-y-4">
          {dupWarning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />{dupWarning}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Full Name</label>
              <input name="name" defaultValue={activeLead?.name} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Company</label>
              <input name="company" defaultValue={activeLead?.company} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <input type="email" name="email" defaultValue={activeLead?.email} required
                onBlur={e => checkDuplicate(e.target.value, document.querySelector('[name="phone"]')?.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <input name="phone" defaultValue={activeLead?.phone}
                onBlur={e => checkDuplicate(document.querySelector('[name="email"]')?.value, e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select name="status" defaultValue={activeLead?.status || LEAD_STATUSES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Source</label>
              <select name="source" defaultValue={activeLead?.source || LEAD_SOURCES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Deal Value (₹)</label>
            <input type="number" name="value" defaultValue={activeLead?.value} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          {activeLead && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags</label>
              <TagsInput entityType="lead" entityId={activeLead.id} />
            </div>
          )}
        </form>
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Lead"
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

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        open={!!convertTarget}
        lead={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConverted={({ lead: updatedLead, customer }) => {
          // Update the lead in the list to show "Converted" status
          setLeads((prev) =>
            prev.map((l) => (l.id === updatedLead?.id ? { ...l, status: "Converted" } : l))
          );
          setConvertTarget(null);
        }}
      />
    </div>
  );
}
export default Leads;
