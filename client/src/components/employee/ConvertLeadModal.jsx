import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import Modal from "./Modal";
import { convertLead } from "../../services/employeeService";

function ConvertLeadModal({ open, lead, onClose, onConverted }) {
  const [createDeal, setCreateDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  function handleClose() {
    setCreateDeal(false); setDealTitle(""); setDealValue("");
    setIndustry(""); setNotes(""); setError(""); setDone(false); setResult(null);
    onClose();
  }

  async function handleConvert(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await convertLead(lead.id, {
        industry: industry || undefined,
        notes: notes || undefined,
        createDeal,
        dealTitle: dealTitle || `Deal with ${lead.company}`,
        dealValue: dealValue ? Number(dealValue) : lead.value,
      });
      setResult(res.data);
      setDone(true);
      onConverted && onConverted(res.data);
    } catch (err) {
      setError(err.friendlyMessage || "Failed to convert lead");
    } finally {
      setSaving(false);
    }
  }

  if (!lead) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Convert Lead to Customer"
      footer={
        done ? (
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
            Done
          </button>
        ) : (
          <>
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              form="convert-lead-form"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Converting..." : "Convert to Customer"}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center space-y-3">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">Lead Converted!</p>
          <p className="text-sm text-gray-500">
            <strong>{lead.name}</strong> has been converted to a customer.
            {result?.deal && <span> A deal <strong>{result.deal.title}</strong> was also created.</span>}
          </p>
        </div>
      ) : (
        <form id="convert-lead-form" onSubmit={handleConvert} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {/* Lead summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
            <ArrowRight size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">{lead.name}</p>
              <p className="text-gray-500">{lead.company} · {lead.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Value: ₹{lead.value?.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Industry (optional)</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology, Healthcare..."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Conversion notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this conversion..."
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Create deal option */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Also create a Deal</span>
            </label>

            {createDeal && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Deal Title</label>
                  <input
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder={`Deal with ${lead.company}`}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Deal Value (₹)</label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder={lead.value}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

export default ConvertLeadModal;
