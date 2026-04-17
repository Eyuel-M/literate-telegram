"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { QuickStatus } from "@/components/ui/quick-status";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  project: { id: string; name: string; client: { name: string; color: string } } | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "var(--c-danger)",
  HIGH:   "#f97316",
  MEDIUM: "var(--c-accent-text)",
  LOW:    "var(--c-text-muted)",
};

const FILTER_TABS = [
  { value: "ALL",         label: "All"         },
  { value: "PENDING",     label: "Pending"     },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE",        label: "Done"        },
];

export function MyTasksClient({ tasks: initial, memberId: _memberId }: { tasks: Task[]; memberId: string }) {
  const [tasks]     = useState<Task[]>(initial);
  const [filter, setFilter] = useState("ALL");

  const visible = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="px-8 py-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? "var(--c-accent-glow)" : "transparent",
                color:      active ? "var(--c-accent-text)" : "var(--c-text-muted)",
                border:     active ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        >
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--c-success)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>All clear!</p>
          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>No tasks in this category.</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((task) => {
          const isDone = task.status === "DONE";
          const overdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date();

          return (
            <div
              key={task.id}
              className="rounded-2xl p-4 flex items-start gap-4 transition-all"
              style={{
                background: "var(--c-surface)",
                border: `1px solid ${isDone ? "var(--c-border)" : "var(--c-border-str)"}`,
                opacity: isDone ? 0.65 : 1,
              }}
            >
              {/* Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {isDone
                  ? <CheckCircle2 size={18} style={{ color: "var(--c-success)" }} />
                  : <Circle size={18} style={{ color: "var(--c-text-faint)" }} />
                }
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "var(--c-text)",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </p>
                  <QuickStatus entity="delegation" id={task.id} current={task.status} />
                </div>

                {task.description && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                  {/* Priority dot */}
                  <span
                    className="text-[10px] font-semibold flex items-center gap-1"
                    style={{ color: PRIORITY_COLOR[task.priority] ?? "var(--c-text-muted)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: PRIORITY_COLOR[task.priority] }}
                    />
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                  </span>

                  {/* Project badge */}
                  {task.project && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: task.project.client.color + "22",
                        color: task.project.client.color,
                        border: `1px solid ${task.project.client.color}44`,
                      }}
                    >
                      {task.project.client.name} · {task.project.name}
                    </span>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: overdue ? "var(--c-danger)" : "var(--c-text-faint)" }}
                    >
                      <Calendar size={10} />
                      {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
