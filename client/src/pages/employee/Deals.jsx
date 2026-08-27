import { useEffect, useMemo, useState } from "react";
import { Plus, CalendarDays, User } from "lucide-react";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import TagsInput from "../../components/employee/TagsInput";
import { DEAL_STAGES } from "../../mock/deals";
import { getDeals, createDeal, updateDeal, exportDeals } from "../../services/employeeService";
const STAGE_STYLES = {
  New: "border-t-blue-500",
  Qualified: "border-t-sky-500",
  Proposal: "border-t-amber-500",
  Negotiation: "border-t-orange-500",
  Won: "border-t-emerald-500",
  Lost: "border-t-red-500",
};
function formatValue(value) {
  return `₹${(value / 100000).toFixed(1)}L`;
}
function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [viewDeal, setViewDeal] = useState(null);
  useEffect(() => {
    let isMounted = true;
    async function loadDeals() {
      try {
        setLoading(true);
        setError("");
        const response = await getDeals();
        if (!isMounted) return;
        setDeals(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load deals.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDeals();
    return () => {
      isMounted = false;
    };
  }, []);
  const columns = useMemo(() => {
    return DEAL_STAGES.map((stage) => ({
      stage,
      items: deals.filter((d) => d.stage === stage),
    }));
  }, [deals]);
  async function handleDrop(stage) {
    if (!draggedId) return;
    const dealId = draggedId;
    setDraggedId(null);
    const previous = deals;
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    try {
      const response = await updateDeal(dealId, { stage });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? response.data : d)));
    } catch (err) {
      setDeals(previous);
      setError(err.friendlyMessage || "Unable to update deal stage.");
    }
  }
  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      title: form.get("title"),
      company: form.get("company"),
      stage: form.get("stage"),
      value: Number(form.get("value")) || 0,
      closeDate: form.get("closeDate") || null,
    };
    setSaving(true);
    setError("");
    try {
      const response = await createDeal(payload);
      setDeals((prev) => [response.data, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to create deal.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {deals.length} deals · Total pipeline value {formatValue(deals.reduce((s, d) => s + d.value, 0))}
        </p>
        <div className="flex items-center gap-2">
          <ExportMenu onExport={exportDeals} />
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Deal
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading deals...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.stage)}
              className="w-72 shrink-0"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-gray-700">{col.stage}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{col.items.length}</span>
              </div>
              <div className="space-y-3 min-h-[120px]">
                {col.items.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDraggedId(deal.id)}
                    onClick={() => setViewDeal(deal)}
                    className={`bg-white rounded-xl border border-gray-200 border-t-4 ${STAGE_STYLES[deal.stage]} shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
                  >
                    <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{deal.company}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-3">{formatValue(deal.value)}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {deal.owner?.split(" ")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} /> {deal.closeDate}
                      </span>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                    No deals here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Deal"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" form="deal-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Add Deal"}
            </button>
          </>
        }
      >
        <form id="deal-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Deal Title</label>
            <input name="title" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Company</label>
            <input name="company" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Stage</label>
              <select name="stage" defaultValue={DEAL_STAGES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Value (₹)</label>
              <input type="number" name="value" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Expected Close Date</label>
            <input type="date" name="closeDate" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Deal detail / tags modal */}
      <Modal
        open={!!viewDeal}
        onClose={() => setViewDeal(null)}
        title={viewDeal?.title || "Deal"}
        footer={<button onClick={() => setViewDeal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Close</button>}
      >
        {viewDeal && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-400">Company:</span> <span className="font-medium">{viewDeal.company}</span></div>
              <div><span className="text-gray-400">Stage:</span> <span className="font-medium">{viewDeal.stage}</span></div>
              <div><span className="text-gray-400">Value:</span> <span className="font-semibold text-blue-600">{formatValue(viewDeal.value)}</span></div>
              <div><span className="text-gray-400">Close:</span> <span>{viewDeal.closeDate || "—"}</span></div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1.5">Tags</span>
              <TagsInput entityType="deal" entityId={viewDeal.id} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default Deals;
