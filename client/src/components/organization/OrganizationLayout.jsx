import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, UserCircle, Settings, Check } from "lucide-react";
import OrganizationSidebar from "./OrganizationSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getOrgNotifications,
  markOrgNotificationRead,
  markAllOrgNotificationsRead,
} from "../../services/organizationService";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      setLoading(true);
      const res = await getOrgNotifications();
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function handleMarkRead(id) {
    await markOrgNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAll() {
    await markAllOrgNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(v => !v); if (!open) load(); }}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No notifications</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${!n.is_read ? "bg-blue-50/40" : ""}`}
                >
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                  {n.is_read && <span className="w-2 h-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold text-slate-800" : "text-slate-700"}`}>{n.title}</p>
                    {n.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-medium mt-0.5">
                      Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OrganizationLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function outside(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function handleLogout() { logout(); navigate("/login"); }

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OrganizationSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6">
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            <div className="h-8 w-px bg-slate-200" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">{user?.name || "Organization Admin"}</p>
                  <p className="text-xs text-slate-500">Organization Admin</p>
                </div>
                <ChevronDown size={15} className="text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <p className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100 truncate">{user?.email}</p>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/organization/profile"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <UserCircle size={15} /> My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/organization/settings"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <div className="border-t border-slate-100 mt-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OrganizationLayout;
