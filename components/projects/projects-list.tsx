"use client";

import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { formatDuration, formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { QuickStatus } from "@/components/ui/quick-status";
import { QuickPriority } from "@/components/ui/quick-priority";

interface Project {
  id:          string;
  name:        string;
  status:      string;
  priority:    string;
  color:       string;
  dueDate:     Date | string | null;
  client:      { id: string; name: string; color: string };
  deliverables: { status: string }[];
  timeEntries:  { duration: number }[];
}

interface Props {
  projects: Project[];
}

export function ProjectsList({ projects }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      {projects.map((project) => {
        const total   = project.deliverables.length;
        const done    = project.deliverables.filter((d) => d.status === "APPROVED").length;
        const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
        const minutes = project.timeEntries.reduce((s, e) => s + e.duration, 0);

        return (
          <div
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="card p-5 hover:border-[#2a2a40] hover:bg-[#15151f] transition-all cursor-pointer group flex items-center gap-5"
          >
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: project.client.color }} />
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-[#6b6b85]">{project.client.name}</span>
                <span className="text-[#3a3a50]">·</span>
                <h3 className="font-semibold text-[#f0f0f8] group-hover:text-violet-300 transition-colors">
                  {project.name}
                </h3>
                <QuickStatus entity="project" id={project.id} current={project.status} />
                <QuickPriority id={project.id} current={project.priority} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: project.color }} />
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
        );
      })}
    </div>
  );
}
