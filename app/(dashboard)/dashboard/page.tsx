import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDuration, formatRelative, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Clock, Users, FolderOpen, MessageSquare, ArrowRight, TrendingUp } from "lucide-react";

async function getDashboardData(userId: string) {
  const [totalClients, activeProjects, pendingReviews, recentProjects, weekEntries] = await Promise.all([
    prisma.client.count({ where: { userId, status: "ACTIVE" } }),
    prisma.project.count({ where: { client: { userId }, status: { in: ["IN_PROGRESS", "REVIEW"] } } }),
    prisma.deliverable.count({ where: { project: { client: { userId } }, status: "IN_REVIEW" } }),
    prisma.project.findMany({
      where: { client: { userId } },
      include: {
        client: { select: { name: true, color: true } },
        deliverables: { select: { status: true } },
        _count: { select: { deliverables: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.timeEntry.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { duration: true },
    }),
  ]);

  const weekMinutes = weekEntries.reduce((s, e) => s + e.duration, 0);
  return { totalClients, activeProjects, pendingReviews, recentProjects, weekMinutes };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const data = await getDashboardData(userId);

  const stats = [
    { label: "Active Clients", value: data.totalClients, icon: Users, color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Active Projects", value: data.activeProjects, icon: FolderOpen, color: "#7c3aed", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Pending Reviews", value: data.pendingReviews, icon: MessageSquare, color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "This Week", value: formatDuration(data.weekMinutes), icon: Clock, color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <p className="text-sm text-[#6b6b85] mb-1">{greeting}, {session!.user!.name?.split(" ")[0]}</p>
        <h1 className="text-2xl font-semibold text-[#f0f0f8] tracking-tight">Your workspace</h1>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`card p-5 border ${stat.border}`}>
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={17} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold text-[#f0f0f8] tracking-tight mb-0.5">{stat.value}</div>
              <div className="text-xs text-[#6b6b85]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#f0f0f8]">Recent Projects</h2>
            <Link href="/projects" className="text-xs text-[#6b6b85] hover:text-violet-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {data.recentProjects.length === 0 ? (
            <div className="card p-10 text-center">
              <FolderOpen size={32} className="text-[#3a3a50] mx-auto mb-3" />
              <p className="text-sm text-[#6b6b85]">No projects yet</p>
              <Link href="/clients" className="text-xs text-violet-400 mt-2 inline-block hover:underline">
                Create your first client →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.recentProjects.map((project) => {
                const total = project.deliverables.length;
                const done = project.deliverables.filter((d) => d.status === "APPROVED").length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="card p-5 hover:border-[#2a2a40] hover:bg-[#15151f] transition-all group cursor-pointer">
                      {/* Client tag */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: project.client.color }}
                          />
                          <span className="text-xs text-[#6b6b85]">{project.client.name}</span>
                        </div>
                        <span className={`badge text-[10px] ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>

                      <h3 className="font-semibold text-[#f0f0f8] text-sm mb-3 group-hover:text-violet-300 transition-colors">
                        {project.name}
                      </h3>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#6b6b85] mb-1.5">
                          <span>{done}/{total} deliverables</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: project.client.color }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#3a3a50]">
                        <TrendingUp size={11} />
                        <span>Updated {formatRelative(project.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
