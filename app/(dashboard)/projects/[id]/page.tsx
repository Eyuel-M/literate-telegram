import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDuration, formatDate, getInitials, STATUS_LABELS, STATUS_COLORS, DELIVERABLE_TYPES } from "@/lib/utils";
import { ArrowLeft, Calendar, DollarSign, Clock, Plus, CheckCircle2, Circle } from "lucide-react";
import { NewDeliverableButton } from "@/components/deliverables/new-deliverable-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, client: { userId } },
    include: {
      client: { select: { id: true, name: true, color: true } },
      deliverables: {
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
  { status: "PENDING", label: "Pending" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "APPROVED", label: "Approved" },
];

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const project = await getProject(params.id, userId);
  if (!project) notFound();

  const totalMinutes = project.timeEntries.reduce((s, e) => s + e.duration, 0);
  const totalDeliverables = project.deliverables.length;
  const approvedCount = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const progress = totalDeliverables > 0 ? Math.round((approvedCount / totalDeliverables) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <Link
          href={`/clients/${project.client.id}`}
          className="flex items-center gap-1.5 text-xs text-[#6b6b85] hover:text-[#f0f0f8] mb-4 transition-colors w-fit"
        >
          <ArrowLeft size={12} /> {project.client.name}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
              <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">{project.name}</h1>
              <ProjectStatusBadge status={project.status} projectId={project.id} />
            </div>
            {project.description && (
              <p className="text-sm text-[#6b6b85] max-w-xl">{project.description}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-5 mt-3">
              {project.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                  <Calendar size={12} /> Due {formatDate(project.dueDate)}
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                  <DollarSign size={12} /> ${project.budget.toLocaleString()}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[#6b6b85]">
                <Clock size={12} /> {formatDuration(totalMinutes)} logged
              </div>
            </div>
          </div>

          <NewDeliverableButton projectId={project.id} />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-[#6b6b85] mb-2">
            <span>{approvedCount} of {totalDeliverables} deliverables approved</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden max-w-sm">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: project.color }}
            />
          </div>
        </div>
      </div>

      {/* Kanban + Gallery */}
      <div className="px-8 py-6">
        {project.deliverables.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 bg-[#1a1a2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-[#3a3a50]" />
            </div>
            <h3 className="font-semibold text-[#f0f0f8] mb-2">No deliverables yet</h3>
            <p className="text-sm text-[#6b6b85] mb-6">Add your first deliverable to start tracking work</p>
            <NewDeliverableButton projectId={project.id} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {KANBAN_COLS.map(({ status, label }) => {
              const deliverables = project.deliverables.filter((d) => d.status === status);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[10px] ${STATUS_COLORS[status]}`}>{label}</span>
                      {deliverables.length > 0 && (
                        <span className="text-xs text-[#3a3a50]">{deliverables.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[100px]">
                    {deliverables.map((d) => {
                      const latestVersion = d.versions[0];
                      const thumbnail = latestVersion?.assets[0]?.url;
                      const timeLogged = d.timeEntries.reduce((s, e) => s + e.duration, 0);
                      const typeLabel = DELIVERABLE_TYPES.find((t) => t.value === d.type)?.label ?? d.type;
                      const pendingFeedback = latestVersion?._count.feedback ?? 0;

                      return (
                        <Link key={d.id} href={`/deliverables/${d.id}`}>
                          <div className="card hover:border-[#2a2a40] hover:bg-[#15151f] transition-all cursor-pointer group overflow-hidden">
                            {thumbnail && (
                              <div className="h-36 overflow-hidden relative bg-[#1a1a2e]">
                                <Image
                                  src={thumbnail}
                                  alt={d.name}
                                  fill
                                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  sizes="280px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#13131f] to-transparent opacity-60" />
                                {latestVersion && (
                                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                                    v{latestVersion.number}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="p-3.5">
                              <p className="text-xs text-[#6b6b85] mb-1">{typeLabel}</p>
                              <h3 className="text-sm font-semibold text-[#f0f0f8] group-hover:text-violet-300 transition-colors mb-2">
                                {d.name}
                              </h3>
                              <div className="flex items-center justify-between text-[10px] text-[#3a3a50]">
                                <span>{d._count.versions} version{d._count.versions !== 1 ? "s" : ""}</span>
                                <div className="flex items-center gap-2">
                                  {pendingFeedback > 0 && (
                                    <span className="text-amber-400">{pendingFeedback} comment{pendingFeedback !== 1 ? "s" : ""}</span>
                                  )}
                                  {timeLogged > 0 && <span>{formatDuration(timeLogged)}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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
