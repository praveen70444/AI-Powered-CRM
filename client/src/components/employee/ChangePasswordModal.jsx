import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import Modal from "./Modal";
import { changePassword } from "../../services/authService";

function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleClose() {
    setCurrent(""); setNext(""); setConfirm("");
    setError(""); setSuccess(false);
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!current || !next || !confirm) { setError("All fields are required"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("Passwords do not match"); return; }
    setSaving(true); setError("");
    try {
      await changePassword(current, next);
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err.friendlyMessage || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            form="change-password-form"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Change Password"}
          </button>
        </>
      }
    >
      {success ? (
        <div className="py-6 text-center text-green-600 font-medium">Password changed successfully!</div>
      ) : (
        <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          {[
            { label: "Current Password", value: current, setter: setCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: "New Password", value: next, setter: setNext, show: showNext, toggle: () => setShowNext(v => !v) },
            { label: "Confirm New Password", value: confirm, setter: setConfirm, show: showNext, toggle: () => setShowNext(v => !v) },
          ].map(({ label, value, setter, show, toggle }, i) => (
            <div key={i}>
              <label className="text-xs font-medium text-gray-500">{label}</label>
              <div className="relative mt-1">
                <input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </form>
      )}
    </Modal>
  );
}

export default ChangePasswordModal;
