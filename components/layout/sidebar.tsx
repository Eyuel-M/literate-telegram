"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import {
  LayoutDashboard, Users, FolderOpen, Clock, Settings,
  LogOut, Layers, GitBranch, Sun, Moon, ShieldCheck, ListTodo, Archive,
  ChevronLeft, ChevronRight, MessageCircle,
} from "lucide-react";

const adminNavItems = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/clients",     icon: Users,           label: "Clients"     },
  { href: "/projects",    icon: FolderOpen,      label: "Projects"    },
  { href: "/delegations", icon: GitBranch,       label: "Delegations", badge: "TEAM" },
  { href: "/chat",        icon: MessageCircle,   label: "Team Chat",   chat: true },
  { href: "/templates",   icon: Layers,          label: "Templates"   },
  { href: "/time",        icon: Clock,           label: "Time"        },
  { href: "/archive",     icon: Archive,         label: "Archive"     },
];

const memberNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/my-tasks",  icon: ListTodo,        label: "My Tasks"  },
  { href: "/chat",      icon: MessageCircle,   label: "Team Chat", chat: true },
];

const ROLE_LABELS: Record<string, string> = {
  SENIOR_DESIGNER: "Senior Designer",
  JUNIOR_DESIGNER: "Junior Designer",
  ART_DIRECTOR:    "Art Director",
  DESIGNER:        "Designer",
  ADMIN:           "Admin",
  MEMBER:          "Member",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; } catch { return false; }
  });

  const [unread, setUnread] = useState(0);

  // Poll unread mention count every 10 s
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res  = await fetch("/api/chat/unread");
        const data = await res.json();
        if (active) setUnread(data.count ?? 0);
      } catch {}
    }
    check();
    const id = setInterval(check, 10_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Clear badge when on chat page
  useEffect(() => {
    if (pathname.startsWith("/chat")) {
      setUnread(0);
      fetch("/api/chat/read", { method: "POST" }).catch(() => {});
    }
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed(v => {
      const next = !v;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }

  const isAdmin  = (session?.user as { role?: string })?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : memberNavItems;

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 overflow-hidden flex-shrink-0"
      style={{
        width:       collapsed ? 56 : 220,
        transition:  "width 0.2s ease",
        background:  "var(--c-bg)",
        borderRight: "1px solid var(--c-border)",
      }}
    >
      {/* Logo / brand */}
      {collapsed ? (
        <div
          className="flex flex-col items-center gap-3 py-4"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--c-accent)" }}
          >
            <Layers size={14} className="text-white" />
          </div>
          <button
            onClick={toggleCollapse}
            title="Expand sidebar"
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all hover:opacity-80"
            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 px-4 py-5"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--c-accent)" }}
          >
            <Layers size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs font-bold tracking-tight truncate" style={{ color: "var(--c-text)" }}>Forma</p>
            <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Creative Workflow OS</p>
          </div>
          <button
            onClick={toggleCollapse}
            title="Collapse sidebar"
            className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: "var(--c-text-faint)" }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const { href, icon: Icon, label } = item;
          const badge    = "badge" in item ? (item as { badge?: string }).badge : undefined;
          const isChat   = "chat"  in item && (item as { chat?: boolean }).chat;
          const active   = pathname === href || (href !== "/dashboard" && href !== "/my-tasks" && pathname.startsWith(href));
          const chatDot  = isChat && unread > 0;

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                justifyContent: collapsed ? "center" : "flex-start",
                background:     active ? "var(--c-accent-glow)" : "transparent",
                color:          active ? "var(--c-accent-text)" : "var(--c-text-muted)",
                border:         active ? "1px solid rgba(124,58,237,0.2)" : "1px solid transparent",
                position:       "relative",
              }}
            >
              {/* Icon with notification dot for chat */}
              <span style={{ position: "relative", flexShrink: 0 }}>
                <Icon size={16} />
                {chatDot && (
                  <span
                    style={{
                      position:     "absolute",
                      top:          -3,
                      right:        -3,
                      width:        8,
                      height:       8,
                      borderRadius: "50%",
                      background:   "#ef4444",
                      border:       "1.5px solid var(--c-bg)",
                    }}
                  />
                )}
              </span>

              {!collapsed && label}

              {!collapsed && badge && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
                >
                  {badge}
                </span>
              )}

              {!collapsed && chatDot && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: "#ef4444" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-2 pb-4 pt-3 space-y-0.5" style={{ borderTop: "1px solid var(--c-border)" }}>
        <button
          onClick={toggle}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "var(--c-text-muted)", justifyContent: collapsed ? "center" : "flex-start" }}
          onMouseEnter={e => { (e.currentTarget).style.background = "var(--c-elevated)"; (e.currentTarget).style.color = "var(--c-text)"; }}
          onMouseLeave={e => { (e.currentTarget).style.background = "transparent"; (e.currentTarget).style.color = "var(--c-text-muted)"; }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
        </button>

        <Link
          href="/settings"
          title="Settings"
          className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "var(--c-text-muted)", justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <Settings size={16} />
          {!collapsed && "Settings"}
        </Link>

        {session?.user && (
          <div
            className="flex items-center gap-2.5 px-2 py-2.5 mt-1"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, var(--c-accent), #3b82f6)" }}
              title={collapsed ? (session.user.name ?? "") : undefined}
            >
              {getInitials(session.user.name ?? "EM")}
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>
                      {session.user.name}
                    </p>
                    {isAdmin && <ShieldCheck size={11} style={{ color: "var(--c-accent-text)", flexShrink: 0 }} />}
                  </div>
                  <p className="text-[10px] truncate" style={{ color: "var(--c-text-faint)" }}>
                    {ROLE_LABELS[(session.user as { role?: string }).role ?? ""] ?? "Member"}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sign out"
                  style={{ color: "var(--c-text-faint)" }}
                  className="hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
