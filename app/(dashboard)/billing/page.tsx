export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingClient } from "@/components/billing/billing-client";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
  if (!workspaceId) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { users: true, clients: true, teamMembers: true } } },
  });

  if (!workspace) redirect("/login");

  return <BillingClient workspace={workspace} />;
}
