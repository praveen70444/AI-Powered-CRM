import { useEffect, useState } from "react";
import { Sliders, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import Modal from "../../components/employee/Modal";
import api from "../../services/api";

const ENTITY_TYPES = ["lead", "customer", "deal", "task"];
const FIELD_TYPES = ["text", "number", "date", "dropdown", "checkbox", "textarea"];

function CustomFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeEntity, setActiveEntity] = useState("lead");
  const [modalOpen, setModalOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  const [form, setForm] = useState({ entity_type: "lead", field_name: "", field_label: "", field_type: "text", field_options: "", is_required: false, display_order: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/organization/custom-fields")
      .then(res => setFields(res.data.data || []))
      .catch(() => setError("Failed to load custom fields"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = fields.filter(f => f.entity_type === activeEntity);

  function openAdd() {
    setEditField(null);
    setForm({ entity_type: activeEntity, field_name: "", field_label: "", field_type: "text", field_options: "", is_required: false, display_order: filtered.length });
    setModalOpen(true);
  }

  function openEdit(field) {
    setEditField(field);
    setForm({
      entity_type: field.entity_type,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options ? (Array.isArray(field.field_options) ? field.field_options.join(", ") : field.field_options) : "",
      is_required: field.is_required,
      display_order: field.display_order || 0,
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.field_name.trim() || !form.field_label.trim()) { setError("Name and label are required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        field_options: form.field_type === "dropdown" && form.field_options
          ? form.field_options.split(",").map(s => s.trim()).filter(Boolean)
          : null,
      };
      if (editField) {
        const res = await api.put(`/organization/custom-fields/${editField.id}`, payload);
        setFields(prev => prev.map(f => f.id === editField.id ? res.data.data : f));
      } else {
        const res = await api.post("/organization/custom-fields", payload);
        setFields(prev => [...prev, res.data.data]);
      }
      setModalOpen(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to save field"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await api.delete(`/organization/custom-fields/${deleteTarget.id}`);
      setFields(prev => prev.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setError("Failed to delete field"); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Custom Fields</h1>
        <p className="mt-1 text-sm text-slate-500">Define extra fields for leads, customers, deals, and tasks.</p>
      </div>

      {/* Entity tabs */}
      <div className="flex border-b border-slate-200">
        {ENTITY_TYPES.map(e => (
          <button key={e} onClick={() => setActiveEntity(e)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${activeEntity === e ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-800"}`}>
            {e}s
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end">
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
          <Plus size={16} /> Add Field
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 p-4">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sliders size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No custom fields for {activeEntity}s</p>
          <p className="text-xs text-slate-400 mt-1">Add fields to capture extra data on {activeEntity} records.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Field Label</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Field Name</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Required</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map(field => (
                <tr key={field.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3 font-medium text-slate-800">{field.field_label}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">{field.field_name}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">{field.field_type}</span>
                  </td>
                  <td className="px-6 py-3">
                    {field.is_required
                      ? <Check size={14} className="text-green-500" />
                      : <X size={14} className="text-slate-300" />}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(field)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(field)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editField ? "Edit Custom Field" : "Add Custom Field"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="cf-form" disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editField ? "Save Changes" : "Add Field"}
            </button>
          </>
        }>
        <form id="cf-form" onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type *</label>
              <select value={form.entity_type} onChange={e => setForm(p => ({ ...p, entity_type: e.target.value }))}
                disabled={!!editField} className={inputClass}>
                {ENTITY_TYPES.map(e => <option key={e} value={e}>{e}s</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Field Type *</label>
              <select value={form.field_type} onChange={e => setForm(p => ({ ...p, field_type: e.target.value }))}
                disabled={!!editField} className={inputClass}>
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Field Label *</label>
              <input value={form.field_label}
                onChange={e => {
                  const label = e.target.value;
                  setForm(p => ({ ...p, field_label: label, field_name: editField ? p.field_name : label.toLowerCase().replace(/[^a-z0-9]/g, '_') }));
                }}
                required className={inputClass} placeholder="e.g. Company Size" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Field Name (auto)</label>
              <input value={form.field_name} onChange={e => setForm(p => ({ ...p, field_name: e.target.value }))}
                disabled={!!editField} className={`${inputClass} ${editField ? "bg-slate-50 text-slate-400" : ""}`}
                placeholder="e.g. company_size" />
            </div>
          </div>
          {form.field_type === "dropdown" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Options (comma-separated)</label>
              <input value={form.field_options} onChange={e => setForm(p => ({ ...p, field_options: e.target.value }))}
                placeholder="Option 1, Option 2, Option 3" className={inputClass} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
              <input type="number" min="0" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                className={`${inputClass} w-24`} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <input type="checkbox" checked={form.is_required} onChange={e => setForm(p => ({ ...p, is_required: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm text-slate-700">Required field</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Custom Field"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }>
        <p className="text-sm text-gray-600">Delete field <strong>{deleteTarget?.field_label}</strong>? All saved values for this field will also be deleted.</p>
      </Modal>
    </div>
  );
}

export default CustomFieldsPage;
