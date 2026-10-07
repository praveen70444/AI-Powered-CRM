import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, ChevronDown, LogOut, UserCircle, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/employeeService";
import GlobalSearch from "./GlobalSearch";
const TITLES = {
  "/employee": "Dashboard",
  "/employee/leads": "Leads",
  "/employee/customers": "Customers",
  "/employee/tasks": "Tasks",
  "/employee/notes": "Notes",
  "/employee/notifications": "Notifications",
  "/employee/profile": "Profile",
  "/employee/calendar": "Calendar",
  "/employee/analytics": "Analytics",
  "/employee/products": "Products",
};

function Topbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUnreadCount() {
      try {
        const response = await getNotifications();
        if (!isMounted) return;
        setUnreadCount(response.data.filter((n) => !n.read).length);
      } catch { if (!isMounted) return; }
    }
    loadUnreadCount();
    return () => { isMounted = false; };
  }, [location.pathname]);

  function handleLogout() { logout(); navigate("/login"); }

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const title = TITLES[location.pathname] || "Dashboard";
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <header className="h-16 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4 lg:px-5 gap-4 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-[var(--color-body-text)] hover:bg-slate-100 transition-colors"
        >
          <Menu size={19} />
        </button>
        <h1 className="text-base font-bold text-[var(--color-heading)]">{title}</h1>
      </div>

      {/* Centre search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Bell */}
        <button
          onClick={() => navigate("/employee/notifications")}
          className="relative h-9 w-9 flex items-center justify-center rounded-xl text-[var(--color-body-text)] hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[var(--color-border)] mx-0.5" />

        {/* Profile */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-[var(--color-sidebar-active)] text-white text-[11px] font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="hidden sm:block text-xs font-semibold text-[var(--color-heading)] max-w-24 truncate">{user?.name || "Account"}</span>
            <ChevronDown size={14} className="hidden sm:block text-[var(--color-body-text)]" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-52 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                <p className="text-xs font-semibold text-[var(--color-heading)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--color-body-text)] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); navigate("/employee/profile"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-body-text)] hover:bg-slate-50 transition-colors"
              >
                <UserCircle size={15} /> My Profile
              </button>
              <div className="border-t border-[var(--color-border)] my-1" />
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
  );
}

export default Topbar;
