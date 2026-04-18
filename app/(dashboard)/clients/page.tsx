export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewClientButton } from "@/components/clients/new-client-button";
import { ClientsGrid } from "@/components/clients/clients-grid";

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, deletedAt: null },
    include: {
      projects: {
        include: {
          timeEntries: { select: { duration: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as { id: string }).id;
  const clients = await getClients(userId);

  return (
    <div className="animate-fade-in" style={{ color: "var(--c-text)" }}>
      <div className="flex items-center justify-between px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewClientButton />
      </div>

      <div className="px-8 py-6">
        <ClientsGrid initialClients={clients} />
      </div>
    </div>
  );
}
