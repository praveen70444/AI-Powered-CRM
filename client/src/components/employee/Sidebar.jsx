import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, Contact, KanbanSquare, ListChecks, History,
  StickyNote, Bell, UserCircle, LogOut, X, CalendarDays, TrendingUp, Package, FileText,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/employee", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/employee/ai", label: "AI Insights", icon: Sparkles },
  { to: "/employee/leads", label: "Leads", icon: Users },
  { to: "/employee/customers", label: "Customers", icon: Contact },
  { to: "/employee/deals", label: "Deals", icon: KanbanSquare },
  { to: "/employee/tasks", label: "Tasks", icon: ListChecks },
  { to: "/employee/activities", label: "Activities", icon: History },
  { to: "/employee/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/employee/notes", label: "Notes", icon: StickyNote },
  { to: "/employee/products", label: "Products", icon: Package },
  { to: "/employee/quotes", label: "Quotes", icon: FileText },
  { to: "/employee/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/employee/notifications", label: "Notifications", icon: Bell },
  { to: "/employee/profile", label: "Profile", icon: UserCircle },
];
function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  function handleLogout() {
    logout();
    navigate("/login");
  }
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">CRM Portal</span>
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.label === "AI Insights"
                    ? isActive
                      ? "bg-violet-100 text-violet-700"
                      : "text-violet-600 hover:bg-violet-50"
                    : isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
              {item.label === "AI Insights" && (
                <span className="ml-auto text-[10px] font-semibold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">AI</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
