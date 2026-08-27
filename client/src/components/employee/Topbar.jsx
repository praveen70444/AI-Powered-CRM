import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/employeeService";
import GlobalSearch from "./GlobalSearch";
const TITLES = {
  "/employee": "Dashboard",
  "/employee/leads": "Leads",
  "/employee/customers": "Customers",
  "/employee/deals": "Deals",
  "/employee/tasks": "Tasks",
  "/employee/activities": "Activities",
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
      } catch {
        if (!isMounted) return;
      }
    }
    loadUnreadCount();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);
  function handleLogout() {
    logout();
    navigate("/login");
  }
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const title = TITLES[location.pathname] || "Dashboard";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("")
    : "";
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="hidden md:flex relative flex-1 max-w-md">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/employee/notifications")}
          className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              {initials || <UserCircle size={18} />}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name || "My Account"}</span>
            <ChevronDown size={16} className="hidden sm:block text-gray-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              <p className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100">{user?.email || "No account data"}</p>
              <button
                onClick={() => { setProfileOpen(false); navigate("/employee/profile"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <UserCircle size={15} /> My Account
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default Topbar;
