export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TemplatesClient } from "@/components/templates/templates-client";

async function getData(workspaceId: string) {
  const [templates, projects] = await Promise.all([
    prisma.template.findMany({
      where: { OR: [{ workspaceId }, { isPreset: true, workspaceId: null }], deletedAt: null },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
    }),
    prisma.project.findMany({
      where: { deletedAt: null, client: { workspaceId, deletedAt: null } },
      select: { id: true, name: true, client: { select: { name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { templates, projects };
}

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);
  const { workspaceId } = session!.user as { id: string; workspaceId: string };
  const { templates, projects } = await getData(workspaceId);

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Templates
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          Preset deliverable packs — apply to any project in one click
        </p>
      </div>

      <TemplatesClient initialTemplates={templates} projects={projects} />
    </div>
  );
}
