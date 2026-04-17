export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDuration, getInitials } from "@/lib/utils";
import { Users } from "lucide-react";
import { NewClientButton } from "@/components/clients/new-client-button";
import { ClientDeleteButton } from "@/components/clients/client-delete-button";
import { QuickStatus } from "@/components/ui/quick-status";

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId },
    include: {
      projects: {
        include: {
          timeEntries: { select: { duration: true } },
          _count: { select: { deliverables: true } },
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
        {clients.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={40} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No clients yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>Add your first client to start managing projects</p>
            <NewClientButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => {
              const active   = client.projects.filter((p) => ["IN_PROGRESS", "REVIEW", "DISCOVERY"].includes(p.status)).length;
              const total    = client.projects.length;
              const minutes  = client.projects.reduce((s, p) => s + p.timeEntries.reduce((t, e) => t + e.duration, 0), 0);

              return (
                <Link key={client.id} href={`/clients/${client.id}`} className="group">
                  <div
                    className="card p-6 cursor-pointer hover:scale-[1.01] transition-transform"
                    style={{ borderTop: `3px solid ${client.color}` }}
                  >
                    <div className="flex items-start gap-4 mb-5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${client.color}, ${client.color}99)` }}
                      >
                        {getInitials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{client.name}</h3>
                        {client.company && (
                          <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{client.company}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <QuickStatus entity="client" id={client.id} current={client.status} />
                        <ClientDeleteButton
                          clientId={client.id}
                          clientName={client.name}
                          projectCount={total}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold">{total}</div>
                        <div className="text-xs" style={{ color: "var(--c-text-muted)" }}>Projects</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{active}</div>
                        <div className="text-xs" style={{ color: "var(--c-text-muted)" }}>Active</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{formatDuration(minutes)}</div>
                        <div className="text-xs" style={{ color: "var(--c-text-muted)" }}>Logged</div>
                      </div>
                    </div>

                    {client.email && (
                      <div className="mt-4 pt-4 text-xs truncate" style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-faint)" }}>
                        {client.email}
                      </div>
                    )}
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
