import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, LogOut, UserCircle, Settings, Check, Menu } from "lucide-react";
import OrganizationSidebar from "./OrganizationSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getOrgNotifications,
  markOrgNotificationRead,
  markAllOrgNotificationsRead,
} from "../../services/organizationService";

const PAGE_TITLES = {
  "/organization": "Dashboard",
  "/organization/employees": "Employees",
  "/organization/invitations": "Invitations",
  "/organization/settings": "Settings",
  "/organization/profile": "Profile",
  "/organization/audit-logs": "Audit Logs",
  "/organization/webhooks": "Webhooks & API",
  "/organization/custom-fields": "Custom Fields",
  "/organization/ai-settings": "AI Settings",
};

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
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }
  async function handleMarkAll() {
    await markAllOrgNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl text-[var(--color-body-text)] hover:bg-slate-100 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold text-[var(--color-heading)]">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-[var(--color-btn-primary)] hover:text-[var(--color-btn-hover)] font-medium flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-[var(--color-body-text)] text-center py-8">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[var(--color-body-text)] text-center py-8">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-blue-50/50" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-[var(--color-btn-primary)]" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold text-[var(--color-heading)]" : "text-[var(--color-body-text)]"}`}>{n.title}</p>
                    {n.description && <p className="text-xs text-[var(--color-body-text)] opacity-80 mt-0.5 truncate">{n.description}</p>}
                    <p className="text-xs text-[var(--color-body-text)] opacity-60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="shrink-0 text-xs text-[var(--color-btn-primary)] hover:text-[var(--color-btn-hover)] font-medium mt-0.5">
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
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function outside(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  function handleLogout() { logout(); navigate("/login"); }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex">
      <OrganizationSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-5 flex-shrink-0">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-[var(--color-body-text)] hover:bg-slate-100 transition-colors"
            >
              <Menu size={19} />
            </button>
            <h1 className="text-base font-bold text-[var(--color-heading)]">{pageTitle}</h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200 mx-0.5" />

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-[var(--color-sidebar-active)] text-white text-[11px] font-bold flex items-center justify-center">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[var(--color-heading)] leading-tight">{user?.name || "Admin"}</p>
                  <p className="text-[10px] text-[var(--color-body-text)]">Organization Admin</p>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-[var(--color-body-text)]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-52 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-semibold text-[var(--color-heading)] truncate">{user?.name}</p>
                    <p className="text-[11px] text-[var(--color-body-text)] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/organization/profile"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-body-text)] hover:bg-slate-50 transition-colors"
                  >
                    <UserCircle size={15} /> My Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/organization/settings"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-body-text)] hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OrganizationLayout;
