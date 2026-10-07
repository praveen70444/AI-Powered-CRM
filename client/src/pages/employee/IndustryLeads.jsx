import React, { useEffect, useState, useCallback } from "react";
import { Users, Building2, ListChecks } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import StatusBadge from "../../components/employee/StatusBadge";
import Pagination from "../../components/employee/Pagination";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import api from "../../services/api";

const PAGE_SIZE = 10;

const LEAD_CONFIG = {
  construction: {
    title: "Construction Leads",
    icon: Users,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "whatsapp_number", label: "WhatsApp Number", type: "text" },
      { name: "goal", label: "Goal", type: "select", options: ["Residential Apartment", "Independent House", "Villa", "Duplex", "Rental Property", "Commercial", "Others"] },
      { name: "plot_size", label: "Plot Size", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "budget", label: "Budget", type: "text" },
      { name: "timeline", label: "Timeline", type: "select", options: ["Immediately", "Within 1 Month", "Within 3 Months", "Within 6 Months"] }
    ]
  },
  redevelopment: {
    title: "Redevelopment Leads",
    icon: Building2,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "whatsapp_number", label: "WhatsApp Number", type: "text" },
      { name: "reason", label: "Reason", type: "text" },
      { name: "building_age", label: "Building Age", type: "text" },
      { name: "no_of_owners", label: "No. of Owners", type: "number" },
      { name: "no_of_floors", label: "No. of Floors", type: "number" },
      { name: "goal", label: "Goal", type: "select", options: ["Residential Apartment", "Independent House", "Villa", "Duplex", "Rental Property", "Commercial", "Others"] },
      { name: "plot_size", label: "Plot Size", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "budget", label: "Budget", type: "text" },
      { name: "timeline", label: "Timeline", type: "select", options: ["Immediately", "Within 1 Month", "Within 3 Months", "Within 6 Months"] }
    ]
  },
  maintenance: {
    title: "Maintenance Leads",
    icon: ListChecks,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "whatsapp_number", label: "WhatsApp Number", type: "text" },
      { name: "service_required", label: "Service Required", type: "select", options: ["Painting", "Waterproofing", "Plumbing", "Electrical", "Civil Works", "Structural Repairs", "Flooring/Tiling", "False Ceiling", "General Maintenance", "Complete Renovation"] },
      { name: "property_type", label: "Property Type", type: "select", options: ["Residential Apartment", "Independent House", "Villa", "Duplex", "Rental Property", "Commercial", "Other"] },
      { name: "plot_size", label: "Plot Size", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "budget", label: "Budget", type: "text" },
      { name: "timeline", label: "Timeline", type: "select", options: ["Immediately", "Within 1 Month", "Within 3 Months", "Within 6 Months"] }
    ]
  }
};

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted"];

export default function IndustryLeads({ type }) {
  const config = LEAD_CONFIG[type];
  const Icon = config.icon;

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employee/industry-leads/${type}`);
      setLeads(res.data.data);
    } catch (err) {
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.whatsapp_number?.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { status: formData.get("status") };
    
    config.fields.forEach(f => {
      payload[f.name] = formData.get(f.name);
    });

    setSaving(true);
    try {
      if (activeLead) {
        await api.put(`/employee/industry-leads/${type}/${activeLead.id}`, payload);
      } else {
        await api.post(`/employee/industry-leads/${type}`, payload);
      }
      fetchLeads();
      setModalOpen(false);
    } catch (err) {
      setError("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await api.delete(`/employee/industry-leads/${type}/${id}`);
      fetchLeads();
    } catch (err) {
      setError("Failed to delete lead");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 pt-6 pb-2 border-b border-gray-100 flex items-center gap-3">
         <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Icon className="text-blue-600" size={20} />
         </div>
         <div>
            <h1 className="text-lg font-bold text-gray-900">{config.title}</h1>
            <p className="text-xs text-gray-500">Manage specialized leads</p>
         </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, whatsapp..."
        addLabel={`Add ${config.title}`}
        onAddClick={() => { setActiveLead(null); setModalOpen(true); }}
      />

      {error && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading {config.title}...</div>
      ) : pageItems.length === 0 ? (
        <EmptyState icon={Icon} title="No leads found" actionLabel="Add Lead" onAction={() => { setActiveLead(null); setModalOpen(true); }} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                {config.fields.slice(0, 5).map(f => (
                  <th key={f.name} className="px-4 py-3 font-medium">{f.label}</th>
                ))}
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(lead => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  {config.fields.slice(0, 5).map(f => (
                    <td key={f.name} className="px-4 py-3 text-gray-600">
                      {lead[f.name] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3"><StatusBadge value={lead.status} /></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setActiveLead(lead); setModalOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeLead ? "Edit Lead" : "Add Lead"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="industry-lead-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeLead ? "Save Changes" : "Add Lead"}
            </button>
          </>
        }
      >
        <form id="industry-lead-form" onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          {config.fields.map(f => (
            <div key={f.name}>
              <label className="text-xs font-medium text-gray-500">{f.label} {f.required && "*"}</label>
              {f.type === "select" ? (
                <select name={f.name} defaultValue={activeLead?.[f.name] || ""} required={f.required} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="">— Select —</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} name={f.name} defaultValue={activeLead?.[f.name] || ""} required={f.required} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              )}
            </div>
          ))}
          <div>
             <label className="text-xs font-medium text-gray-500">Status</label>
             <select name="status" defaultValue={activeLead?.status || "New"} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
