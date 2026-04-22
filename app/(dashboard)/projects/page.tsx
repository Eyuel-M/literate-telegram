export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { ProjectsList } from "@/components/projects/projects-list";

async function getAllProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { deletedAt: null, client: { workspaceId, deletedAt: null } },
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
  const { workspaceId } = session!.user as { id: string; workspaceId: string };
  const projects = await getAllProjects(workspaceId);

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
          <ProjectsList projects={projects} />
        )}
      </div>
    </div>
  );
}
