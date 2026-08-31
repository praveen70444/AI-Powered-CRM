import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Mail, Settings, UserCircle, LogOut,
  Shield, Webhook, Sliders, Sparkles, Building2, Menu, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/organization", icon: LayoutDashboard, end: true },
  { name: "Employees", path: "/organization/employees", icon: Users },
  { name: "Invitations", path: "/organization/invitations", icon: Mail },
  { name: "Settings", path: "/organization/settings", icon: Settings },
  { name: "Profile", path: "/organization/profile", icon: UserCircle },
  { name: "Audit Logs", path: "/organization/audit-logs", icon: Shield },
  { name: "Webhooks & API", path: "/organization/webhooks", icon: Webhook },
  { name: "Custom Fields", path: "/organization/custom-fields", icon: Sliders },
  { name: "AI Settings", path: "/organization/ai-settings", icon: Sparkles, ai: true },
];

function OrganizationSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate("/login"); }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[var(--color-sidebar-bg)] border-r border-slate-800 flex flex-col min-h-screen transition-transform duration-250 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-sidebar-active)] flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">CRM Portal</p>
              <p className="text-[10px] text-slate-400">Admin workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--color-sidebar-active)] text-white shadow-md shadow-blue-900/20"
                      : "text-[var(--color-sidebar-text)] hover:bg-slate-800/50 hover:text-white"
                  }`
                }
              >
                <Icon size={18} className={item.ai ? "text-violet-400" : ""} />
                <span className="flex-1">{item.name}</span>
                {item.ai && (
                  <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-md border border-violet-500/30">AI</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-800 px-4 py-4 flex-shrink-0 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 border border-slate-600">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

export default OrganizationSidebar;