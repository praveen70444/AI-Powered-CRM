import { useEffect, useState } from "react";
import { Mail, Clock, RefreshCw, UserPlus, XCircle } from "lucide-react";
import {
  getOrganizationInvitations,
  createOrganizationInvitation,
  cancelInvitation,
} from "../../services/organizationService";
import Modal from "../../components/employee/Modal";

const EMPLOYEE_ROLE_OPTIONS = [
  { value: "SALES_EXECUTIVE", label: "Sales Executive" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SUPPORT_AGENT", label: "Support Agent" },
];

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "SALES_EXECUTIVE" });
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getOrganizationInvitations();
      setInvitations(response.data || []);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvitations(); }, []);

  function openModal() {
    setInviteForm({ email: "", role: "SALES_EXECUTIVE" });
    setInviteError(""); setInviteSuccess(""); setInviteLink(""); setLinkCopied(false);
    setModalOpen(true);
  }

  function closeModal() {
    if (sending) return;
    setModalOpen(false);
  }

  async function handleCopyLink() {
    try { await navigator.clipboard.writeText(inviteLink); setLinkCopied(true); }
    catch { setLinkCopied(false); }
  }

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInviteError(""); setInviteSuccess(""); setInviteLink(""); setLinkCopied(false);
    if (!inviteForm.email.trim()) { setInviteError("Employee email is required."); return; }
    setSending(true);
    try {
      const response = await createOrganizationInvitation({ email: inviteForm.email.trim(), role: inviteForm.role });
      const token = response?.data?.invitationToken;
      if (token) {
        setInviteLink(`${window.location.origin}/accept-invitation/${token}`);
      }
      setInviteSuccess(
        process.env.NODE_ENV === "production"
          ? "Invitation email sent successfully."
          : "Invitation created. Share the link below with the employee."
      );
      await loadInvitations();
    } catch (err) {
      setInviteError(err.friendlyMessage || "Unable to send invitation.");
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this invitation?")) return;
    setCancelling(id);
    try {
      await cancelInvitation(id);
      setInvitations(prev => prev.map(i => i.id === id ? { ...i, status: "CANCELLED" } : i));
    } catch (err) {
      setError(err.friendlyMessage || "Unable to cancel invitation.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invitations</h1>
          <p className="mt-1 text-sm text-slate-500">Invite employees and manage pending invitations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadInvitations}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={17} /> Refresh
          </button>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <UserPlus size={17} /> Invite Employee
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      ) : invitations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mail size={26} />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No invitations yet</h2>
          <p className="mt-1 text-sm text-slate-500">Click "Invite Employee" to send your first invitation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-slate-600">Employee</th>
                  <th className="text-left px-6 py-4 font-medium text-slate-600">Role</th>
                  <th className="text-left px-6 py-4 font-medium text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 font-medium text-slate-600">Expires</th>
                  <th className="text-left px-6 py-4 font-medium text-slate-600">Invited By</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <span className="font-medium text-slate-900">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{inv.role?.replaceAll("_", " ")}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} /> {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{inv.invited_by_name || "Organization Admin"}</td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          disabled={cancelling === inv.id}
                          className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          title="Cancel invitation"
                        >
                          <XCircle size={14} />
                          {cancelling === inv.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Invite Employee"
        footer={
          inviteLink ? (
            <button onClick={closeModal} className="px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition">
              Done
            </button>
          ) : (
            <>
              <button onClick={closeModal} disabled={sending} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" form="invite-employee-form" disabled={sending} className="px-4 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60">
                {sending ? "Sending..." : "Send Invitation"}
              </button>
            </>
          )
        }
      >
        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {inviteSuccess}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invitation link</label>
              <p className="text-xs text-slate-500 mb-2">
                An invitation email has been sent. You can also share this link directly — it expires in 7 days.
              </p>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={e => e.target.select()}
                  className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 h-10 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition whitespace-nowrap"
                >
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form id="invite-employee-form" onSubmit={handleInviteSubmit} className="space-y-4">
            {inviteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee email</label>
              <input
                type="email"
                name="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                placeholder="employee@company.com"
                required
                className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                name="role"
                value={inviteForm.role}
                onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                className="w-full h-11 px-4 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {EMPLOYEE_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default InvitationsPage;
