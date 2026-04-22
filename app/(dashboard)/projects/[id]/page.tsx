import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, DollarSign, Clock, Plus } from "lucide-react";
import { NewDeliverableButton } from "@/components/deliverables/new-deliverable-button";
import { DeliverableCard } from "@/components/deliverables/deliverable-card";
import { QuickStatus } from "@/components/ui/quick-status";
import { QuickPriority } from "@/components/ui/quick-priority";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { CircularProgress } from "@/components/dashboard/circular-progress";

async function getProject(id: string, workspaceId: string) {
  return prisma.project.findFirst({
    where: { id, client: { workspaceId } },
    include: {
      client: { select: { id: true, name: true, color: true } },
      deliverables: {
        where: { deletedAt: null },
        include: {
          versions: {
            orderBy: { number: "desc" },
            include: {
              assets: { take: 1, orderBy: { createdAt: "desc" } },
              _count: { select: { feedback: true } },
            },
            take: 1,
          },
          _count: { select: { versions: true } },
          timeEntries: { select: { duration: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      timeEntries: { select: { duration: true } },
    },
  });
}

const KANBAN_COLS = [
  { status: "PENDING",     label: "Pending"     },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW",   label: "In Review"   },
  { status: "APPROVED",    label: "Approved"    },
];

const COL_COLORS: Record<string, string> = {
  PENDING: "#9ca3af",
  IN_PROGRESS: "#fbbf24",
  IN_REVIEW: "#c084fc",
  APPROVED: "#34d399",
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = session!.user as { id: string; workspaceId: string };
  const project = await getProject(params.id, workspaceId);
  if (!project) notFound();

  const totalMinutes = project.timeEntries.reduce((s, e) => s + e.duration, 0);
  const total = project.deliverables.length;
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;

  return (
    <div className="animate-fade-in" style={{ color: "var(--c-text)" }}>
      {/* Header */}
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <Link
          href={`/clients/${project.client.id}`}
          className="flex items-center gap-1.5 text-xs mb-4 w-fit transition-opacity hover:opacity-70"
          style={{ color: "var(--c-text-muted)" }}
        >
          <ArrowLeft size={12} /> {project.client.name}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: project.color }} />
              <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
              <QuickStatus entity="project" id={project.id} current={project.status} />
              <QuickPriority id={project.id} current={project.priority} />
            </div>
            {project.description && (
              <p className="text-sm max-w-xl" style={{ color: "var(--c-text-muted)" }}>{project.description}</p>
            )}
            <div className="flex items-center gap-5 mt-3 flex-wrap">
              {project.dueDate ? (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                  style={{
                    background: new Date(project.dueDate) < new Date() && project.status !== "DELIVERED" ? "#fef2f2" : "var(--c-elevated)",
                    color:      new Date(project.dueDate) < new Date() && project.status !== "DELIVERED" ? "#dc2626"  : "var(--c-text-muted)",
                    border:     `1px solid ${new Date(project.dueDate) < new Date() && project.status !== "DELIVERED" ? "#fecaca" : "var(--c-border)"}`,
                  }}
                >
                  <Calendar size={12} />
                  {new Date(project.dueDate) < new Date() && project.status !== "DELIVERED" ? "Overdue · " : "Due "}
                  {formatDate(project.dueDate)}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-text-faint)" }}>
                  <Calendar size={12} /> No due date
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-text-muted)" }}>
                  <DollarSign size={12} /> ${project.budget.toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--c-text-muted)" }}>
                <Clock size={12} /> {formatDuration(totalMinutes)} logged
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <CircularProgress value={approved} max={Math.max(total, 1)} size={60} color={project.client.color} />
            <NewDeliverableButton projectId={project.id} />
            <DeleteProjectButton projectId={project.id} clientId={project.client.id} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-sm">
          <div
            className="flex justify-between text-xs mb-1"
            style={{ color: "var(--c-text-faint)" }}
          >
            <span>{approved}/{total} approved</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-elevated)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: total > 0 ? `${Math.round((approved / total) * 100)}%` : "0%", background: project.client.color }}
            />
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="px-8 py-6">
        {project.deliverables.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--c-elevated)" }}>
              <Plus size={24} style={{ color: "var(--c-text-faint)" }} />
            </div>
            <h3 className="font-semibold mb-2">No deliverables yet</h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-text-muted)" }}>Add your first deliverable to start tracking work</p>
            <NewDeliverableButton projectId={project.id} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {KANBAN_COLS.map(({ status, label }) => {
              const deliverables = project.deliverables.filter((d) => d.status === status);
              const colColor = COL_COLORS[status];

              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: colColor }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>{label}</span>
                    {deliverables.length > 0 && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--c-elevated)", color: "var(--c-text-faint)" }}
                      >
                        {deliverables.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 min-h-[80px]">
                    {deliverables.map((d) => (
                      <DeliverableCard
                        key={d.id}
                        id={d.id}
                        name={d.name}
                        type={d.type}
                        status={d.status}
                        dueDate={d.dueDate}
                        timeEntries={d.timeEntries}
                        versions={d.versions}
                        _count={d._count}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
