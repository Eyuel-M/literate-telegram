"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Clock,
  Settings,
  LogOut,
  Layers,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/projects", icon: FolderOpen, label: "Projects" },
  { href: "/time", icon: Clock, label: "Time" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-screen bg-[#0c0c14] border-r border-[#1e1e2e] sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e1e2e]">
        <div className="w-8 h-8 bg-violet-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Layers size={15} className="text-white" />
        </div>
        <span className="font-semibold text-[#f0f0f8] tracking-tight">Forma</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-violet-700/15 text-violet-300 border border-violet-700/20"
                  : "text-[#6b6b85] hover:text-[#f0f0f8] hover:bg-[#1a1a2e]"
              )}
            >
              <Icon size={16} className={active ? "text-violet-400" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-[#1e1e2e] pt-3 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6b6b85] hover:text-[#f0f0f8] hover:bg-[#1a1a2e] transition-all"
        >
          <Settings size={16} />
          Settings
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
            >
              {getInitials(session.user.name ?? "U")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#f0f0f8] truncate">{session.user.name}</p>
              <p className="text-xs text-[#3a3a50] truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[#3a3a50] hover:text-[#6b6b85] transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
