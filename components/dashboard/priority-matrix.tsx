"use client";

import Link from "next/link";
import { AlertTriangle, Calendar } from "lucide-react";

interface Project {
  id:          string;
  name:        string;
  status:      string;
  priority:    string;
  dueDate:     string | Date | null;
  client:      { name: string; color: string };
  deliverables: { status: string }[];
}

interface Props {
  projects: Project[];
}

const PRIORITY_BANDS = [
  { key: "HIGH",   label: "High",   bg: "#fef2f2", border: "#fecaca", color: "#dc2626", ring: "#ef4444" },
  { key: "MEDIUM", label: "Medium", bg: "#fffbeb", border: "#fde68a", color: "#d97706", ring: "#f59e0b" },
  { key: "LOW",    label: "Low",    bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", ring: "#22c55e" },
];

const STATUS_COLS = [
  { key: "DISCOVERY",   label: "Discovery",   dot: "#60a5fa" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "#fbbf24" },
  { key: "REVIEW",      label: "In Review",   dot: "#c084fc" },
  { key: "DELIVERED",   label: "Delivered",   dot: "#34d399" },
];

export function PriorityMatrix({ projects }: Props) {
  const now = new Date();

  const byPriority = (p: string) => projects.filter((x) => x.priority === p);
  const overdue    = (list: Project[]) =>
    list.filter((x) => x.dueDate && new Date(x.dueDate) < now && x.status !== "DELIVERED");
  const dueSoon    = (list: Project[]) =>
    list.filter((x) => {
      if (!x.dueDate || x.status === "DELIVERED") return false;
      const d = new Date(x.dueDate);
      return d >= now && d <= new Date(now.getTime() + 7 * 86400_000);
    });

  const needsAttention = projects
    .filter((x) => x.dueDate && new Date(x.dueDate) < now && x.status !== "DELIVERED")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="card p-6 flex flex-col gap-6">
      <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Priority Matrix</h2>

      {/* ── Top: 3 priority summary bands ── */}
      <div className="grid grid-cols-3 gap-3">
        {PRIORITY_BANDS.map((band) => {
          const list      = byPriority(band.key);
          const overdueN  = overdue(list).length;
          const dueSoonN  = dueSoon(list).length;
          const delivered = list.filter((x) => x.status === "DELIVERED").length;
          const pct       = list.length > 0 ? Math.round((delivered / list.length) * 100) : 0;

          return (
            <div
              key={band.key}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: band.bg, border: `1px solid ${band.border}` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: band.color }}>{band.label}</span>
                <span className="text-2xl font-bold" style={{ color: band.color }}>{list.length}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${band.ring}33` }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: band.ring }}
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px]" style={{ color: band.color }}>
                  {delivered}/{list.length} delivered
                </span>
                {overdueN > 0 && (
                  <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#dc2626" }}>
                    <AlertTriangle size={9} /> {overdueN} overdue
                  </span>
                )}
                {dueSoonN > 0 && overdueN === 0 && (
                  <span className="text-[10px] flex items-center gap-1" style={{ color: "#d97706" }}>
                    <Calendar size={9} /> {dueSoonN} due soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Cross-tab: Priority × Status ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--c-elevated)" }}>
              <th className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--c-text-muted)", width: "30%" }}>Priority</th>
              {STATUS_COLS.map((s) => (
                <th key={s.key} className="px-3 py-2.5 font-semibold text-center" style={{ color: "var(--c-text-muted)" }}>
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                    {s.label}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold text-center" style={{ color: "var(--c-text-muted)" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {PRIORITY_BANDS.map((band, bi) => {
              const list = byPriority(band.key);
              return (
                <tr
                  key={band.key}
                  style={{ borderTop: "1px solid var(--c-border)" }}
                >
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: band.bg, color: band.color, border: `1px solid ${band.border}` }}
                    >
                      {band.label}
                    </span>
                  </td>
                  {STATUS_COLS.map((s) => {
                    const n = list.filter((x) => x.status === s.key).length;
                    return (
                      <td key={s.key} className="px-3 py-2.5 text-center">
                        {n > 0 ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                            style={{ background: `${s.dot}22`, color: s.dot }}
                          >
                            {n}
                          </span>
                        ) : (
                          <span style={{ color: "var(--c-text-faint)" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-sm font-bold" style={{ color: band.color }}>{list.length}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Overdue / needs attention ── */}
      {needsAttention.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#dc2626" }}>
            <AlertTriangle size={11} /> Needs Attention
          </p>
          <div className="flex flex-col gap-1.5">
            {needsAttention.map((p) => {
              const band = PRIORITY_BANDS.find((b) => b.key === p.priority) ?? PRIORITY_BANDS[1];
              const daysOverdue = Math.floor((now.getTime() - new Date(p.dueDate!).getTime()) / 86400_000);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity hover:opacity-75"
                  style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block" style={{ color: "var(--c-text)" }}>{p.name}</span>
                    <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>{p.client.name}</span>
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: band.bg, color: band.color }}
                  >
                    {band.label}
                  </span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#dc2626" }}>
                    {daysOverdue}d overdue
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
