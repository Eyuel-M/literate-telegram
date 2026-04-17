import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDuration, getInitials, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Plus, Users, FolderOpen, Clock } from "lucide-react";
import { NewClientButton } from "@/components/clients/new-client-button";

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
  const userId = (session!.user as { id: string }).id;
  const clients = await getClients(userId);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between px-8 py-7 border-b border-[#1e1e2e]">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">Clients</h1>
          <p className="text-sm text-[#6b6b85] mt-0.5">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <NewClientButton />
      </div>

      <div className="px-8 py-6">
        {clients.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={40} className="text-[#3a3a50] mx-auto mb-4" />
            <h3 className="font-semibold text-[#f0f0f8] mb-2">No clients yet</h3>
            <p className="text-sm text-[#6b6b85] mb-6">Add your first client to start managing projects</p>
            <NewClientButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => {
              const totalProjects = client.projects.length;
              const activeProjects = client.projects.filter((p) =>
                ["IN_PROGRESS", "REVIEW", "DISCOVERY"].includes(p.status)
              ).length;
              const totalMinutes = client.projects.reduce(
                (sum, p) => sum + p.timeEntries.reduce((s, e) => s + e.duration, 0),
                0
              );

              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="card p-6 hover:border-[#2a2a40] hover:bg-[#15151f] transition-all cursor-pointer group">
                    <div className="flex items-start gap-4 mb-5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${client.color}, ${client.color}aa)` }}
                      >
                        {getInitials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#f0f0f8] group-hover:text-violet-300 transition-colors truncate">
                          {client.name}
                        </h3>
                        {client.company && (
                          <p className="text-xs text-[#6b6b85] truncate mt-0.5">{client.company}</p>
                        )}
                      </div>
                      <span className={`badge text-[10px] ${STATUS_COLORS[client.status]}`}>
                        {STATUS_LABELS[client.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#f0f0f8]">{totalProjects}</div>
                        <div className="text-xs text-[#6b6b85]">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#f0f0f8]">{activeProjects}</div>
                        <div className="text-xs text-[#6b6b85]">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#f0f0f8]">{formatDuration(totalMinutes)}</div>
                        <div className="text-xs text-[#6b6b85]">Logged</div>
                      </div>
                    </div>

                    {client.email && (
                      <div className="mt-4 pt-4 border-t border-[#1e1e2e]">
                        <p className="text-xs text-[#3a3a50] truncate">{client.email}</p>
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
