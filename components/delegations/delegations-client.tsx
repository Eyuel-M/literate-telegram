"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { Plus, X, Calendar, Trash2, GitBranch } from "lucide-react";
import { QuickStatus } from "@/components/ui/quick-status";

interface TeamMember { id: string; name: string; color: string; role: string; }
interface Project    { id: string; name: string; client: { name: string; color: string }; }
interface Delegation {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: string | null;
  createdAt: string; updatedAt: string;
  teamMember: TeamMember;
  project: { id: string; name: string; client: { name: string; color: string } } | null;
}

interface Props {
  initialDelegations: Delegation[];
  teamMembers: TeamMember[];
  projects: Project[];
}

const PRIORITY_OPTS = [
  { value: "URGENT", label: "Urgent", cls: "priority-urgent" },
  { value: "HIGH",   label: "High",   cls: "priority-high"   },
  { value: "MEDIUM", label: "Medium", cls: "priority-medium" },
  { value: "LOW",    label: "Low",    cls: "priority-low"    },
];

const ROLE_LABELS: Record<string, string> = {
  SENIOR_DESIGNER: "Senior Designer",
  JUNIOR_DESIGNER: "Junior Designer",
  ART_DIRECTOR: "Art Director",
  DESIGNER: "Designer",
};

const FILTER_TABS = [
  { value: "ALL",         label: "All"         },
  { value: "PENDING",     label: "Pending"     },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE",        label: "Done"        },
];

export function DelegationsClient({ initialDelegations, teamMembers, projects }: Props) {
  const [items, setItems]     = useState<Delegation[]>(initialDelegations);
  const [filter, setFilter]   = useState("ALL");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving]   = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", description: "", teamMemberId: teamMembers[0]?.id ?? "",
    priority: "MEDIUM", dueDate: "", projectId: "",
  });

  const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);

  async function createDelegation(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.teamMemberId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/delegations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setItems([created, ...items]);
        setShowNew(false);
        setForm({ title: "", description: "", teamMemberId: teamMembers[0]?.id ?? "", priority: "MEDIUM", dueDate: "", projectId: "" });
        router.refresh();
      }
    } finally { setSaving(false); }
  }

  async function deleteDelegation(id: string) {
    await fetch(`/api/delegations/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  }

  const priorityCls: Record<string, string> = {
    URGENT: "priority-urgent", HIGH: "priority-high", MEDIUM: "priority-medium", LOW: "priority-low",
  };

  return (
    <div className="px-8 py-6">
      {/* Filter tabs + New button */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--c-elevated)" }}>
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === t.value ? "var(--c-accent)" : "transparent",
                color: filter === t.value ? "#fff" : "var(--c-text-muted)",
              }}
            >
              {t.label}
              {t.value !== "ALL" && (
                <span className="ml-1.5 opacity-60">
                  {items.filter((i) => i.status === t.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Assign Task
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <GitBranch size={32} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
            {filter === "ALL" ? "No delegations yet" : `No ${filter.toLowerCase()} tasks`}
          </p>
        </div>
      ) : (
        <div
          className="card overflow-hidden"
          style={{ border: "1px solid var(--c-border)" }}
        >
          {/* Table header */}
          <div
            className="grid gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{
              gridTemplateColumns: "1fr 180px 120px 100px 100px 32px",
              color: "var(--c-text-faint)",
              borderBottom: "1px solid var(--c-border)",
              background: "var(--c-elevated)",
            }}
          >
            <span>Task</span>
            <span>Assigned To</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
            <span />
          </div>

          {/* Rows */}
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="grid gap-4 px-5 py-4 items-center transition-colors"
              style={{
                gridTemplateColumns: "1fr 180px 120px 100px 100px 32px",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--c-border)" : "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--c-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Title */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                    {item.description}
                  </p>
                )}
                {item.dueDate && (
                  <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: "var(--c-text-faint)" }}>
                    <Calendar size={10} />
                    {formatDate(item.dueDate)}
                  </div>
                )}
              </div>

              {/* Assigned to */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: item.teamMember.color }}
                >
                  {getInitials(item.teamMember.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--c-text)" }}>
                    {item.teamMember.name}
                  </p>
                  <p className="text-[9px] truncate" style={{ color: "var(--c-text-faint)" }}>
                    {ROLE_LABELS[item.teamMember.role] ?? item.teamMember.role}
                  </p>
                </div>
              </div>

              {/* Project */}
              <div className="min-w-0">
                {item.project ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: item.project.client.color }}
                    />
                    <span className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>
                      {item.project.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: "var(--c-text-faint)" }}>—</span>
                )}
              </div>

              {/* Priority */}
              <span className={`badge ${priorityCls[item.priority] ?? "priority-medium"}`}>
                {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
              </span>

              {/* Status */}
              <QuickStatus entity="delegation" id={item.id} current={item.status}
                onChanged={(s) => setItems(items.map((i) => i.id === item.id ? { ...i, status: s } : i))}
              />

              {/* Delete */}
              <button
                onClick={() => deleteDelegation(item.id)}
                className="opacity-30 hover:opacity-80 transition-opacity"
                style={{ color: "var(--c-danger)" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New delegation modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div
            className="relative rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>Assign New Task</h2>
              <button onClick={() => setShowNew(false)} style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                  Task title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input" placeholder="e.g. Refine logo spacing" required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none h-20"
                  placeholder="Task details, context, acceptance criteria…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                    Assign to *
                  </label>
                  <select value={form.teamMemberId} onChange={(e) => setForm({ ...form, teamMemberId: e.target.value })} className="input">
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                    Priority
                  </label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
                    {PRIORITY_OPTS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                    Linked project
                  </label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="input">
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.client.name} · {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                    Due date
                  </label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving || !form.title || !form.teamMemberId} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? "Assigning…" : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
