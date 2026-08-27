import { useEffect, useState } from "react";
import { Bell, UserPlus, ListChecks, KanbanSquare, Contact, Settings } from "lucide-react";
import EmptyState from "../../components/employee/EmptyState";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/employeeService";
import api from "../../services/api";

const TYPE_ICON = {
  lead: UserPlus, task: ListChecks, deal: KanbanSquare, customer: Contact,
  reminder: Bell, alert: Bell, system: Bell,
};
const TYPE_COLOR = {
  lead: "bg-blue-50 text-blue-600", task: "bg-amber-50 text-amber-600",
  deal: "bg-emerald-50 text-emerald-600", customer: "bg-violet-50 text-violet-600",
  reminder: "bg-orange-50 text-orange-600", alert: "bg-red-50 text-red-600",
  system: "bg-gray-100 text-gray-600",
};
function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("notifications"); // "notifications" | "preferences"
  const [prefs, setPrefs] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true); setError("");
        const response = await getNotifications();
        if (!isMounted) return;
        setNotifications(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load notifications.");
      } finally { if (isMounted) setLoading(false); }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  // Load preferences when tab switches to preferences
  useEffect(() => {
    if (tab !== "preferences" || prefs) return;
    setPrefsLoading(true);
    api.get("/employee/notification-preferences")
      .then(res => setPrefs(res.data.data))
      .catch(() => setPrefs({
        email_on_lead: true, email_on_task_due: true, email_on_deal_won: true,
        email_on_deal_close_soon: true, email_daily_digest: false,
        in_app_lead: true, in_app_task: true, in_app_deal: true, in_app_customer: true,
      }))
      .finally(() => setPrefsLoading(false));
  }, [tab, prefs]);

  async function savePrefs() {
    try {
      await api.put("/employee/notification-preferences", prefs);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch { setError("Failed to save preferences"); }
  }

  async function markAllRead() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await markAllNotificationsRead(); }
    catch (err) { setNotifications(previous); setError(err.friendlyMessage || "Unable to update notifications."); }
  }

  async function markRead(id) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await markNotificationRead(id); }
    catch (err) { setNotifications(previous); setError(err.friendlyMessage || "Unable to update notification."); }
  }

  function Toggle({ value, onChange, label, description }) {
    return (
      <label className="flex items-center justify-between py-3 cursor-pointer group">
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <div onClick={onChange}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-200"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </label>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        <button onClick={() => setTab("notifications")}
          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === "notifications" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          Notifications {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab("preferences")}
          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === "preferences" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          <Settings size={14} /> Preferences
        </button>
      </div>

      {error && <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {tab === "notifications" && (
        <>
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm font-medium text-blue-600 hover:text-blue-700">Mark all as read</button>
            )}
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up for now." />
          ) : (
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <li key={n.id} onClick={() => markRead(n.id)}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${n.read ? "bg-white" : "bg-blue-50/40"} hover:bg-gray-50`}>
                    <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLOR[n.type] || "bg-gray-100 text-gray-500"}`}>
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.timestamp}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0" />}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {tab === "preferences" && (
        <div className="p-6 max-w-lg">
          {prefsLoading ? (
            <p className="text-sm text-gray-400">Loading preferences...</p>
          ) : prefs && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Email Notifications</h3>
                <p className="text-xs text-gray-400 mb-3">Choose when to receive email alerts.</p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl px-4">
                  <Toggle value={prefs.email_on_lead} onChange={() => setPrefs(p => ({ ...p, email_on_lead: !p.email_on_lead }))} label="New Lead" description="When a lead is added to your account" />
                  <Toggle value={prefs.email_on_task_due} onChange={() => setPrefs(p => ({ ...p, email_on_task_due: !p.email_on_task_due }))} label="Task Due Tomorrow" description="Day-before reminder for upcoming tasks" />
                  <Toggle value={prefs.email_on_deal_won} onChange={() => setPrefs(p => ({ ...p, email_on_deal_won: !p.email_on_deal_won }))} label="Deal Won" description="When a deal is marked as Won" />
                  <Toggle value={prefs.email_on_deal_close_soon} onChange={() => setPrefs(p => ({ ...p, email_on_deal_close_soon: !p.email_on_deal_close_soon }))} label="Deal Closing Soon" description="3-day warning before expected close date" />
                  <Toggle value={prefs.email_daily_digest} onChange={() => setPrefs(p => ({ ...p, email_daily_digest: !p.email_daily_digest }))} label="Daily Digest" description="Morning summary of your pipeline" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">In-App Notifications</h3>
                <p className="text-xs text-gray-400 mb-3">Control which in-app alerts you see.</p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl px-4">
                  <Toggle value={prefs.in_app_lead} onChange={() => setPrefs(p => ({ ...p, in_app_lead: !p.in_app_lead }))} label="Leads" />
                  <Toggle value={prefs.in_app_task} onChange={() => setPrefs(p => ({ ...p, in_app_task: !p.in_app_task }))} label="Tasks" />
                  <Toggle value={prefs.in_app_deal} onChange={() => setPrefs(p => ({ ...p, in_app_deal: !p.in_app_deal }))} label="Deals" />
                  <Toggle value={prefs.in_app_customer} onChange={() => setPrefs(p => ({ ...p, in_app_customer: !p.in_app_customer }))} label="Customers" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={savePrefs}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Save Preferences
                </button>
                {prefsSaved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default Notifications;
