import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatDuration, formatDate } from "@/lib/utils";
import { Users, FolderOpen, MessageSquare, Clock, TrendingUp, AlertCircle, GitBranch } from "lucide-react";
import { CircularProgress } from "@/components/dashboard/circular-progress";
import { StatusPipeline } from "@/components/dashboard/status-pipeline";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { QuickStatus } from "@/components/ui/quick-status";

async function getData(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);

  const [clients, projects, pendingReviews, timeEntries, delegations] = await Promise.all([
    prisma.client.count({ where: { userId, status: "ACTIVE" } }),
    prisma.project.findMany({
      where: { client: { userId } },
      include: {
        client: { select: { name: true, color: true } },
        deliverables: { select: { status: true } },
        _count: { select: { deliverables: true } },
        timeEntries: { select: { duration: true, date: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deliverable.count({ where: { project: { client: { userId } }, status: "IN_REVIEW" } }),
    prisma.timeEntry.findMany({
      where: { userId, date: { gte: weekAgo } },
      select: { duration: true, date: true },
    }),
    prisma.delegation.count({ where: { assignedBy: { id: userId }, status: { not: "DONE" } } }),
  ]);

  // Weekly chart data: last 7 days
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyData = days.map((day, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i + 1);
    const dateStr = d.toDateString();
    const minutes = timeEntries
      .filter((e) => new Date(e.date).toDateString() === dateStr)
      .reduce((s, e) => s + e.duration, 0);
    return { day, minutes };
  });

  const totalWeekMinutes = timeEntries.reduce((s, e) => s + e.duration, 0);
  const activeProjects = projects.filter((p) => ["IN_PROGRESS", "REVIEW", "DISCOVERY"].includes(p.status));

  // Status pipeline counts
  const pipeline = [
    { status: "DISCOVERY",   label: "Discovery",   count: projects.filter(p => p.status === "DISCOVERY").length,   color: "#60a5fa" },
    { status: "IN_PROGRESS", label: "In Progress", count: projects.filter(p => p.status === "IN_PROGRESS").length, color: "#fbbf24" },
    { status: "REVIEW",      label: "In Review",   count: projects.filter(p => p.status === "REVIEW").length,      color: "#c084fc" },
    { status: "DELIVERED",   label: "Delivered",   count: projects.filter(p => p.status === "DELIVERED").length,   color: "#34d399" },
  ];

  // Overall completion across all active projects
  const totalDeliverables   = projects.flatMap(p => p.deliverables).length;
  const approvedDeliverables = projects.flatMap(p => p.deliverables).filter(d => d.status === "APPROVED").length;

  return { clients, projects, activeProjects, pendingReviews, totalWeekMinutes, weeklyData, pipeline, totalDeliverables, approvedDeliverables, delegations };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const d = await getData(userId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
      {/* Page header */}
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <p className="text-sm mb-1" style={{ color: "var(--c-text-muted)" }}>
          {greeting}, Eyuel
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Studio Dashboard
        </h1>
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="card p-4"
              style={{ borderColor: s.border }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.bg }}
              >
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div className="text-xl font-bold tracking-tight mb-0.5" style={{ color: "var(--c-text)" }}>
                {s.value}
              </div>
              <div className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Middle row: Pipeline + Weekly chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Status Pipeline */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                Project Pipeline
              </h2>
              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                {d.projects.length} total
              </span>
            </div>
            <StatusPipeline bars={d.pipeline} />

            {/* Circular summary */}
            <div className="mt-6 pt-5 flex items-center gap-6" style={{ borderTop: "1px solid var(--c-border)" }}>
              <CircularProgress
                value={d.approvedDeliverables}
                max={d.totalDeliverables}
                size={72}
                label="done"
              />
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

          {/* Weekly Hours */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                Hours This Week
              </h2>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--c-accent-text)" }}
              >
                {formatDuration(d.totalWeekMinutes)}
              </span>
            </div>
            <WeeklyChart days={d.weeklyData} />
            <div
              className="mt-4 pt-4 flex items-center gap-2 text-xs"
              style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
            >
              <Clock size={12} />
              Hover each bar to see daily totals
            </div>
          </div>
        </div>

        {/* ── Project Matrix ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Project Matrix
            </h2>
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
                const approved = project.deliverables.filter(d => d.status === "APPROVED").length;
                const inReview = project.deliverables.filter(d => d.status === "IN_REVIEW").length;
                const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
                const minutes  = project.timeEntries.reduce((s, e) => s + e.duration, 0);

                return (
                  <div
                    key={project.id}
                    className="card p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform"
                    style={{ borderTop: `3px solid ${project.client.color}` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] mb-1 truncate" style={{ color: "var(--c-text-muted)" }}>
                          {project.client.name}
                        </p>
                        <Link href={`/projects/${project.id}`}>
                          <h3
                            className="text-sm font-semibold leading-snug hover:underline truncate"
                            style={{ color: "var(--c-text)" }}
                          >
                            {project.name}
                          </h3>
                        </Link>
                      </div>
                      {/* Circular progress */}
                      <CircularProgress
                        value={approved}
                        max={Math.max(total, 1)}
                        size={52}
                        color={project.client.color}
                      />
                    </div>

                    {/* Deliverable progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--c-text-faint)" }}>
                        <span>{approved}/{total} approved</span>
                        {inReview > 0 && (
                          <span style={{ color: "#c084fc" }}>{inReview} in review</span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-elevated)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: project.client.color }}
                        />
                      </div>
                    </div>

                    {/* Footer: status + time */}
                    <div className="flex items-center justify-between">
                      <QuickStatus entity="project" id={project.id} current={project.status} />
                      <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>
                        {formatDuration(minutes)}
                      </span>
                    </div>

                    {/* Due date warning */}
                    {project.dueDate && (
                      <div className="text-[10px] -mt-2" style={{ color: "var(--c-text-faint)" }}>
                        Due {formatDate(project.dueDate)}
                      </div>
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
