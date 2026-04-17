"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import {
  LayoutDashboard, Users, FolderOpen, Clock, Settings,
  LogOut, Layers, GitBranch, Sun, Moon, ShieldCheck, ListTodo,
} from "lucide-react";

const adminNavItems = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/clients",     icon: Users,           label: "Clients"     },
  { href: "/projects",    icon: FolderOpen,      label: "Projects"    },
  { href: "/delegations", icon: GitBranch,       label: "Delegations", badge: "TEAM" },
  { href: "/time",        icon: Clock,           label: "Time"        },
];

const memberNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/my-tasks",  icon: ListTodo,        label: "My Tasks"  },
];

const ROLE_LABELS: Record<string, string> = {
  SENIOR_DESIGNER: "Senior Designer",
  JUNIOR_DESIGNER: "Junior Designer",
  ART_DIRECTOR: "Art Director",
  DESIGNER: "Designer",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  const isAdmin   = (session?.user as { role?: string })?.role === "ADMIN";
  const navItems  = isAdmin ? adminNavItems : memberNavItems;

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "var(--c-bg)", borderRight: "1px solid var(--c-border)" }}
    >
      {/* Logo / brand */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--c-accent)" }}
        >
          <Layers size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-tight truncate" style={{ color: "var(--c-text)" }}>
            Forma
          </p>
          <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Creative Workflow OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const { href, icon: Icon, label } = item;
          const badge  = "badge" in item ? (item as { badge?: string }).badge : undefined;
          const active = pathname === href || (href !== "/dashboard" && href !== "/my-tasks" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              )}
              style={{
                background: active ? "var(--c-accent-glow)" : "transparent",
                color: active ? "var(--c-accent-text)" : "var(--c-text-muted)",
                border: active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
              }}
            >
              <Icon size={16} />
              {label}
              {badge && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div
        className="px-3 pb-4 pt-3 space-y-0.5"
        style={{ borderTop: "1px solid var(--c-border)" }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "var(--c-text-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--c-elevated)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--c-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--c-text-muted)"; }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "var(--c-text-muted)" }}
        >
          <Settings size={16} />
          Settings
        </Link>

        {/* User card */}
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, var(--c-accent), #3b82f6)" }}
            >
              {getInitials(session.user.name ?? "EM")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>
                  {session.user.name}
                </p>
                {isAdmin && (
                  <ShieldCheck size={11} style={{ color: "var(--c-accent-text)", flexShrink: 0 }} />
                )}
              </div>
              <p className="text-[10px] truncate" style={{ color: "var(--c-text-faint)" }}>
                {isAdmin ? "Admin" : "Member"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              style={{ color: "var(--c-text-faint)" }}
              className="hover:opacity-70 transition-opacity"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
