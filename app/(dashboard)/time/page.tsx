import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatDate } from "@/lib/utils";
import { Clock, TrendingUp } from "lucide-react";

async function getTimeEntries(userId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    include: {
      project: { include: { client: { select: { name: true, color: true } } } },
      deliverable: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0);
  const thisWeek = entries
    .filter((e) => new Date(e.date) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, e) => s + e.duration, 0);

  return { entries, totalMinutes, thisWeek };
}

export default async function TimePage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const { entries, totalMinutes, thisWeek } = await getTimeEntries(userId);

  // Group by date
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const key = formatDate(entry.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">Time Tracking</h1>
        <p className="text-sm text-[#6b6b85] mt-0.5">Track hours across all projects</p>
      </div>

      <div className="px-8 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-violet-400" />
              <span className="text-xs text-[#6b6b85]">This week</span>
            </div>
            <div className="text-2xl font-bold text-[#f0f0f8] tracking-tight">{formatDuration(thisWeek)}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-blue-400" />
              <span className="text-xs text-[#6b6b85]">Total logged</span>
            </div>
            <div className="text-2xl font-bold text-[#f0f0f8] tracking-tight">{formatDuration(totalMinutes)}</div>
          </div>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock size={32} className="text-[#3a3a50] mx-auto mb-3" />
            <p className="text-sm text-[#6b6b85]">No time entries yet. Log time from any project or deliverable.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayEntries]) => {
              const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#6b6b85]">{date}</span>
                    <span className="text-xs text-[#3a3a50]">{formatDuration(dayTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="card px-4 py-3 flex items-center gap-4">
                        {entry.project && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: entry.project.client.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#f0f0f8] truncate">
                            {entry.description ?? (entry.deliverable?.name ?? entry.project?.name ?? "Untitled")}
                          </p>
                          {entry.project && (
                            <p className="text-xs text-[#3a3a50]">
                              {entry.project.client.name} · {entry.project.name}
                              {entry.deliverable && ` · ${entry.deliverable.name}`}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-mono text-[#6b6b85] flex-shrink-0">{formatDuration(entry.duration)}</span>
                      </div>
                    ))}
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
