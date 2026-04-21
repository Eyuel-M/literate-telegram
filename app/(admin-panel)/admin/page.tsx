export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/admin-client";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role    = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  const workspaces = await prisma.workspace.findMany({
    include: {
      _count: { select: { users: true, clients: true, teamMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminClient workspaces={workspaces} />;
}
