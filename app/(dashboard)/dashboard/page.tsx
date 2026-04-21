export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDuration, formatDate } from "@/lib/utils";
import { Users, FolderOpen, MessageSquare, Clock, TrendingUp, AlertCircle, GitBranch, CheckCircle2, Circle, Calendar } from "lucide-react";
import { CircularProgress } from "@/components/dashboard/circular-progress";
import { StatusPipeline } from "@/components/dashboard/status-pipeline";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { QuickStatus } from "@/components/ui/quick-status";

/* ─── helpers ─────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function buildWeekly(entries: { duration: number; date: Date }[]) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i + 1);
    const ds = d.toDateString();
    const minutes = entries
      .filter((e) => new Date(e.date).toDateString() === ds)
      .reduce((s, e) => s + e.duration, 0);
    return { day, minutes };
  });
}

/* ─── admin data ──────────────────────────────────────────── */

async function getAdminData(userId: string, workspaceId: string) {
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [clients, projects, pendingReviews, timeEntries, delegations] = await Promise.all([
    prisma.client.count({ where: { workspaceId, status: "ACTIVE", deletedAt: null } }),
    prisma.project.findMany({
      where: { deletedAt: null, client: { workspaceId, deletedAt: null } },
      include: {
        client: { select: { name: true, color: true } },
        deliverables: { select: { status: true } },
        _count: { select: { deliverables: true } },
        timeEntries: { select: { duration: true, date: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deliverable.count({ where: { deletedAt: null, project: { deletedAt: null, client: { workspaceId, deletedAt: null } }, status: "IN_REVIEW" } }),
    prisma.timeEntry.findMany({ where: { userId, date: { gte: weekAgo } }, select: { duration: true, date: true } }),
    prisma.delegation.count({ where: { teamMember: { workspaceId }, status: { not: "DONE" }, deletedAt: null } }),
  ]);

  const totalWeekMinutes = timeEntries.reduce((s, e) => s + e.duration, 0);
  const activeProjects = projects.filter((p) => ["IN_PROGRESS", "REVIEW", "DISCOVERY"].includes(p.status));
  const totalDeliverables    = projects.flatMap((p) => p.deliverables).length;
  const approvedDeliverables = projects.flatMap((p) => p.deliverables).filter((d) => d.status === "APPROVED").length;
  const pipeline = [
    { status: "DISCOVERY",   label: "Discovery",   count: projects.filter((p) => p.status === "DISCOVERY").length,   color: "#60a5fa" },
    { status: "IN_PROGRESS", label: "In Progress", count: projects.filter((p) => p.status === "IN_PROGRESS").length, color: "#fbbf24" },
    { status: "REVIEW",      label: "In Review",   count: projects.filter((p) => p.status === "REVIEW").length,      color: "#c084fc" },
    { status: "DELIVERED",   label: "Delivered",   count: projects.filter((p) => p.status === "DELIVERED").length,   color: "#34d399" },
  ];

  return { clients, projects, activeProjects, pendingReviews, totalWeekMinutes, weeklyData: buildWeekly(timeEntries), pipeline, totalDeliverables, approvedDeliverables, delegations };
}

/* ─── member data ─────────────────────────────────────────── */

async function getMemberData(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [profile, timeEntries] = await Promise.all([
    prisma.teamMember.findUnique({
      where: { linkedUserId: userId },
      include: {
        delegations: {
          include: {
            project: { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
          },
          orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
        },
      },
    }),
    prisma.timeEntry.findMany({ where: { userId, date: { gte: weekAgo } }, select: { duration: true, date: true } }),
  ]);

  const delegations       = profile?.delegations ?? [];
  const totalWeekMinutes  = timeEntries.reduce((s, e) => s + e.duration, 0);
  return {
    profile,
    delegations: delegations.map((d) => ({ ...d, dueDate: d.dueDate?.toISOString() ?? null, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
    weeklyData:  buildWeekly(timeEntries),
    totalWeekMinutes,
    total:       delegations.length,
    pending:     delegations.filter((d) => d.status === "PENDING").length,
    inProgress:  delegations.filter((d) => d.status === "IN_PROGRESS").length,
    done:        delegations.filter((d) => d.status === "DONE").length,
  };
}

/* ─── priority helpers ────────────────────────────────────── */

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "var(--c-danger)",
  HIGH:   "#f97316",
  MEDIUM: "var(--c-accent-text)",
  LOW:    "var(--c-text-muted)",
};

/* ─── page ────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const session  = await getServerSession(authOptions);
  const user = session!.user as { id: string; name: string; role: string; workspaceId: string };
  const isMember = user.role !== "ADMIN";

  /* ── MEMBER DASHBOARD ── */
  if (isMember) {
    const m = await getMemberData(user.id);

    const memberStats = [
      { label: "Total Tasks",  value: m.total,      color: "var(--c-text)"        },
      { label: "Pending",      value: m.pending,    color: "var(--c-warning)"     },
      { label: "In Progress",  value: m.inProgress, color: "var(--c-accent-text)" },
      { label: "Done",         value: m.done,       color: "var(--c-success)"     },
      { label: "Hours (week)", value: formatDuration(m.totalWeekMinutes), color: "#10b981" },
    ];

    const activeTasks = m.delegations.filter((d) => d.status !== "DONE");
    const doneTasks   = m.delegations.filter((d) => d.status === "DONE");

    return (
      <div className="animate-fade-in">
        <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <p className="text-sm mb-1" style={{ color: "var(--c-text-muted)" }}>
            {greeting()}, {user.name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
            My Dashboard
          </h1>
          {m.profile && (
            <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>
              {m.profile.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          )}
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {memberStats.map((s) => (
              <div
                key={s.label}
                className="card px-5 py-4 flex flex-col min-w-[110px]"
              >
                <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[11px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Weekly chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Hours This Week</h2>
              <span className="text-sm font-bold" style={{ color: "var(--c-accent-text)" }}>
                {formatDuration(m.totalWeekMinutes)}
              </span>
            </div>
            <WeeklyChart days={m.weeklyData} />
          </div>

          {/* Active tasks */}
          <div>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>
              Active Tasks{activeTasks.length > 0 && <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--c-text-muted)" }}>({activeTasks.length})</span>}
            </h2>

            {activeTasks.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-2 opacity-30" style={{ color: "var(--c-success)" }} />
                <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>All caught up — no active tasks.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTasks.map((task) => {
                  const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div
                      key={task.id}
                      className="card p-4 flex items-start gap-4"
                    >
                      <Circle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--c-text-faint)" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{task.title}</p>
                          <QuickStatus entity="delegation" id={task.id} current={task.status} />
                        </div>
                        {task.description && (
                          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: PRIORITY_COLOR[task.priority] }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: PRIORITY_COLOR[task.priority] }} />
                            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                          </span>
                          {task.project && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: task.project.client.color + "22", color: task.project.client.color, border: `1px solid ${task.project.client.color}44` }}
                            >
                              {task.project.client.name} · {task.project.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px] flex items-center gap-1" style={{ color: overdue ? "var(--c-danger)" : "var(--c-text-faint)" }}>
                              <Calendar size={10} />
                              {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {doneTasks.length > 0 && (
              <p className="text-xs mt-4" style={{ color: "var(--c-text-faint)" }}>
                + {doneTasks.length} completed task{doneTasks.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── ADMIN DASHBOARD ── */
  const d = await getAdminData(user.id, user.workspaceId);

  const stats = [
    { label: "Active Clients",   value: d.clients,                          icon: Users,         color: "#3b82f6",  bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)"  },
    { label: "Active Projects",  value: d.activeProjects.length,             icon: FolderOpen,    color: "#7c3aed",  bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)"  },
    { label: "Pending Reviews",  value: d.pendingReviews,                    icon: MessageSquare, color: "#f59e0b",  bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
    { label: "Open Delegations", value: d.delegations,                       icon: GitBranch,     color: "#ef4444",  bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)"   },
    { label: "This Week",        value: formatDuration(d.totalWeekMinutes),  icon: Clock,         color: "#10b981",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
    { label: "Overall Progress", value: `${d.totalDeliverables > 0 ? Math.round((d.approvedDeliverables / d.totalDeliverables) * 100) : 0}%`, icon: TrendingUp, color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <p className="text-sm mb-1" style={{ color: "var(--c-text-muted)" }}>
          {greeting()}, {user.name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Studio Dashboard
        </h1>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="card p-4" style={{ borderColor: s.border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div className="text-xl font-bold tracking-tight mb-0.5" style={{ color: "var(--c-text)" }}>{s.value}</div>
              <div className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline + Weekly chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Project Pipeline</h2>
              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{d.projects.length} total</span>
            </div>
            <StatusPipeline bars={d.pipeline} />
            <div className="mt-6 pt-5 flex items-center gap-6" style={{ borderTop: "1px solid var(--c-border)" }}>
              <CircularProgress value={d.approvedDeliverables} max={d.totalDeliverables} size={72} label="done" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                  {d.approvedDeliverables}/{d.totalDeliverables} deliverables approved
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                  Across {d.projects.length} active project{d.projects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Hours This Week</h2>
              <span className="text-sm font-bold" style={{ color: "var(--c-accent-text)" }}>{formatDuration(d.totalWeekMinutes)}</span>
            </div>
            <WeeklyChart days={d.weeklyData} />
            <div className="mt-4 pt-4 flex items-center gap-2 text-xs" style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
              <Clock size={12} />
              Hover each bar to see daily totals
            </div>
          </div>
        </div>

        {/* Project Matrix */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Project Matrix</h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--c-text-muted)" }}>
              <AlertCircle size={12} />
              Click any status to update instantly
            </div>
          </div>

          {d.projects.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderOpen size={32} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {d.projects.map((project) => {
                const total    = project.deliverables.length;
                const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
                const inReview = project.deliverables.filter((d) => d.status === "IN_REVIEW").length;
                const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
                const minutes  = project.timeEntries.reduce((s, e) => s + e.duration, 0);
                return (
                  <div
                    key={project.id}
                    className="card p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform"
                    style={{ borderTop: `3px solid ${project.client.color}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] mb-1 truncate" style={{ color: "var(--c-text-muted)" }}>{project.client.name}</p>
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="text-sm font-semibold leading-snug hover:underline truncate" style={{ color: "var(--c-text)" }}>
                            {project.name}
                          </h3>
                        </Link>
                      </div>
                      <CircularProgress value={approved} max={Math.max(total, 1)} size={52} color={project.client.color} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--c-text-faint)" }}>
                        <span>{approved}/{total} approved</span>
                        {inReview > 0 && <span style={{ color: "#c084fc" }}>{inReview} in review</span>}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-elevated)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.client.color }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <QuickStatus entity="project" id={project.id} current={project.status} />
                      <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>{formatDuration(minutes)}</span>
                    </div>
                    {project.dueDate && (
                      <div className="text-[10px] -mt-2" style={{ color: "var(--c-text-faint)" }}>Due {formatDate(project.dueDate)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
