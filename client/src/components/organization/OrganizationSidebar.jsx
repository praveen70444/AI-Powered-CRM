import {
  LayoutDashboard, Users, Mail, Settings, UserCircle, LogOut, Shield, Webhook, Sliders, Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function OrganizationSidebar() {
  const { user, logout } = useAuth();
  const navigation = [
    { name: "Dashboard", path: "/organization", icon: LayoutDashboard, end: true },
    { name: "Employees", path: "/organization/employees", icon: Users },
    { name: "Invitations", path: "/organization/invitations", icon: Mail },
    { name: "Organization Settings", path: "/organization/settings", icon: Settings },
    { name: "Profile", path: "/organization/profile", icon: UserCircle },
    { name: "Audit Logs", path: "/organization/audit-logs", icon: Shield },
    { name: "Webhooks & API", path: "/organization/webhooks", icon: Webhook },
    { name: "Custom Fields", path: "/organization/custom-fields", icon: Sliders },
    { name: "AI Settings", path: "/organization/ai-settings", icon: Sparkles, ai: true },
  ];
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="h-16 px-6 flex items-center border-b border-slate-200">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            CRM Portal
          </h1>

          <p className="text-xs text-slate-500">
            Organization Admin
          </p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user?.name || "Organization Admin"}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {user?.email || ""}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
export default OrganizationSidebar;