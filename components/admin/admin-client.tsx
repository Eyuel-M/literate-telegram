"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Layers, Users, Folder, Clock, ShieldCheck, LogOut, Edit2, Check, X } from "lucide-react";
import { PLANS, getPlan, trialDaysLeft, type PlanKey } from "@/lib/plans";

interface Workspace {
  id:                    string;
  name:                  string;
  slug:                  string;
  plan:                  string;
  subscriptionStatus:    string;
  subscriptionExpiresAt: Date | string | null;
  createdAt:             Date | string;
  _count: { users: number; clients: number; teamMembers: number };
}

interface Props { workspaces: Workspace[] }

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    "#10b981",
  EXPIRED:   "#ef4444",
  CANCELLED: "#6b7280",
  PAST_DUE:  "#f59e0b",
};

const PLAN_COLORS: Record<string, string> = {
  TRIAL:  "#7c3aed",
  FREE:   "#6b7280",
  PRO:    "#3b82f6",
  AGENCY: "#f59e0b",
};

export function AdminClient({ workspaces: initial }: Props) {
  const [workspaces, setWorkspaces] = useState(initial);
  const [editing,    setEditing]    = useState<string | null>(null);
  const [editPlan,   setEditPlan]   = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving,     setSaving]     = useState(false);

  function startEdit(ws: Workspace) {
    setEditing(ws.id);
    setEditPlan(ws.plan);
    setEditStatus(ws.subscriptionStatus);
  }

  async function save(id: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workspaces", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, plan: editPlan, subscriptionStatus: editStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
        setEditing(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const totalWorkspaces = workspaces.length;
  const activeWorkspaces = workspaces.filter((w) => w.subscriptionStatus === "ACTIVE").length;
  const paidWorkspaces   = workspaces.filter((w) => w.plan === "PRO" || w.plan === "AGENCY").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--c-bg)", borderBottom: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-accent)" }}>
            <Layers size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Forma Admin</p>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Super-admin panel</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2" style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}>
            <ShieldCheck size={10} /> SUPER ADMIN
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ color: "var(--c-text-muted)", border: "1px solid var(--c-border)" }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total workspaces", value: totalWorkspaces,  icon: Layers },
            { label: "Active",           value: activeWorkspaces, icon: Check  },
            { label: "Paid plans",       value: paidWorkspaces,   icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-5"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} style={{ color: "var(--c-accent-text)" }} />
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Workspaces table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: "var(--c-elevated)", borderBottom: "1px solid var(--c-border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>All Workspaces</p>
            <p className="text-xs" style={{ color: "var(--c-text-faint)" }}>{totalWorkspaces} total</p>
          </div>

          <div style={{ background: "var(--c-bg)" }}>
            {workspaces.map((ws, i) => {
              const plan     = getPlan(ws.plan as PlanKey);
              const daysLeft = ws.plan === "TRIAL" ? trialDaysLeft(ws.subscriptionExpiresAt) : null;
              const isEditing = editing === ws.id;

              return (
                <div
                  key={ws.id}
                  className="px-5 py-4"
                  style={{ borderTop: i > 0 ? "1px solid var(--c-border)" : "none" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Workspace info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{ws.name}</p>
                        <span className="text-[10px] font-mono" style={{ color: "var(--c-text-faint)" }}>/{ws.slug}</span>
                      </div>
                      <p className="text-[10px] font-mono" style={{ color: "var(--c-text-faint)" }}>{ws.id}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--c-text-muted)" }}>
                          <Users size={11} /> {ws._count.users} users
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--c-text-muted)" }}>
                          <Folder size={11} /> {ws._count.clients} clients
                        </div>
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--c-text-muted)" }}>
                          <Clock size={11} /> {new Date(ws.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Plan + status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <select
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value)}
                            className="text-xs rounded-lg px-2 py-1"
                            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                          >
                            {(["TRIAL", "FREE", "PRO", "AGENCY"] as PlanKey[]).map((p) => (
                              <option key={p} value={p}>{PLANS[p].label}</option>
                            ))}
                          </select>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-xs rounded-lg px-2 py-1"
                            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
                          >
                            {["ACTIVE", "EXPIRED", "CANCELLED", "PAST_DUE"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => save(ws.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ background: "#10b981", color: "#fff" }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${PLAN_COLORS[ws.plan]}22`, color: PLAN_COLORS[ws.plan] ?? "#7c3aed" }}
                          >
                            {plan.label}
                            {daysLeft !== null && ` · ${daysLeft}d`}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${STATUS_COLORS[ws.subscriptionStatus]}22`, color: STATUS_COLORS[ws.subscriptionStatus] ?? "#10b981" }}
                          >
                            {ws.subscriptionStatus}
                          </span>
                          <button
                            onClick={() => startEdit(ws)}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {workspaces.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No workspaces yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
