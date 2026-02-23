import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/utils";
import {
  LayoutDashboard, FileText, MessageSquare,
  User, LogOut, Brain, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/documents", icon: FileText,        label: "Documents" },
  { to: "/chat",      icon: MessageSquare,   label: "AI Chat"   },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [slim, setSlim]  = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "flex flex-col flex-shrink-0 bg-surface-900 border-r border-border transition-all duration-300",
          slim ? "w-[64px]" : "w-[256px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(13,150,242,.35)]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!slim && (
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent whitespace-nowrap">
              DocMind AI
            </span>
          )}
          <button
            onClick={() => setSlim(!slim)}
            className={cn(
              "p-1.5 rounded-lg text-ink-500 hover:text-ink-200 hover:bg-surface-700 transition-all",
              slim ? "mx-auto" : "ml-auto"
            )}
          >
            {slim ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {!slim && (
            <p className="text-[10px] font-bold text-ink-600 uppercase tracking-widest px-3 mb-2">
              Workspace
            </p>
          )}
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(isActive ? "nav-link-active" : "nav-link", slim && "justify-center px-2")
              }
              title={slim ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!slim && <span>{label}</span>}
            </NavLink>
          ))}

          <div className="my-3 border-t border-border" />

          {!slim && (
            <p className="text-[10px] font-bold text-ink-600 uppercase tracking-widest px-3 mb-2">
              Account
            </p>
          )}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(isActive ? "nav-link-active" : "nav-link", slim && "justify-center px-2")
            }
            title={slim ? "Profile" : undefined}
          >
            <User size={17} className="flex-shrink-0" />
            {!slim && <span>Profile</span>}
          </NavLink>
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          {slim ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold text-white">
                {initials(user?.full_name || user?.username)}
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="p-1.5 rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-700 transition-all">
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials(user?.full_name || user?.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-100 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-ink-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
