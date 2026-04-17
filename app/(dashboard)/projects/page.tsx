export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDuration, formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { FolderOpen, Calendar, Clock } from "lucide-react";

async function getAllProjects(userId: string) {
  return prisma.project.findMany({
    where: { client: { userId } },
    include: {
      client: { select: { id: true, name: true, color: true } },
      deliverables: { select: { status: true } },
      timeEntries: { select: { duration: true } },
      _count: { select: { deliverables: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const projects = await getAllProjects(userId);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between px-8 py-7 border-b border-[#1e1e2e]">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">All Projects</h1>
          <p className="text-sm text-[#6b6b85] mt-0.5">{projects.length} project{projects.length !== 1 ? "s" : ""} across all clients</p>
        </div>
      </div>

      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <div className="card p-16 text-center">
            <FolderOpen size={40} className="text-[#3a3a50] mx-auto mb-4" />
            <h3 className="font-semibold text-[#f0f0f8] mb-2">No projects yet</h3>
            <p className="text-sm text-[#6b6b85] mb-4">Create a client first, then add projects</p>
            <Link href="/clients" className="btn-primary inline-flex items-center gap-2">
              Go to Clients
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const total = project.deliverables.length;
              const done = project.deliverables.filter((d) => d.status === "APPROVED").length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const minutes = project.timeEntries.reduce((s, e) => s + e.duration, 0);

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="block">
                  <div className="card p-5 hover:border-[#2a2a40] hover:bg-[#15151f] transition-all cursor-pointer group flex items-center gap-5">
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0"
                      style={{ background: project.client.color }}
                    />

                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-[#6b6b85]">{project.client.name}</span>
                        <span className="text-[#3a3a50]">·</span>
                        <h3 className="font-semibold text-[#f0f0f8] group-hover:text-violet-300 transition-colors">
                          {project.name}
                        </h3>
                        <span className={`badge text-[10px] ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                          <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: project.color }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-[#3a3a50]">{done}/{total}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-xs text-[#3a3a50] flex-shrink-0">
                      {project.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} />
                          {formatDate(project.dueDate)}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatDuration(minutes)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
