"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getInitials, CLIENT_COLORS } from "@/lib/utils";
import { Plus, X, Calendar, Trash2, GitBranch, UserPlus, AlertCircle } from "lucide-react";
import { QuickStatus } from "@/components/ui/quick-status";

interface TeamMember { id: string; name: string; color: string; role: string; openCount?: number; }
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

const ROLE_OPTS = [
  { value: "ART_DIRECTOR",    label: "Art Director"    },
  { value: "SENIOR_DESIGNER", label: "Senior Designer" },
  { value: "JUNIOR_DESIGNER", label: "Junior Designer" },
  { value: "DESIGNER",        label: "Designer"        },
  { value: "MEMBER",          label: "Team Member"     },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLE_OPTS.map((r) => [r.value, r.label]));

const FILTER_TABS = [
  { value: "ALL",         label: "All"         },
  { value: "PENDING",     label: "Pending"     },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE",        label: "Done"        },
];

const priorityCls: Record<string, string> = {
  URGENT: "priority-urgent", HIGH: "priority-high",
  MEDIUM: "priority-medium", LOW:  "priority-low",
};

/* ─────────────────── Add Team Member modal ─────────────────── */
function AddMemberModal({
  onClose, onAdded,
}: { onClose: () => void; onAdded: (m: TeamMember) => void }) {
  const [form, setForm]   = useState({ name: "", email: "", role: "DESIGNER", color: CLIENT_COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const member = await res.json();
        onAdded(member);
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `Error ${res.status}`);
      }
    } catch { setError("Network error. Try again."); }
    finally   { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>Add Team Member</h2>
          <button onClick={onClose} style={{ color: "var(--c-text-muted)" }} className="hover:opacity-70">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input" placeholder="Sarah Kim" autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Email</label>
            <input
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input" placeholder="sarah@studio.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              {ROLE_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {CLIENT_COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: form.color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--c-danger)" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── Main component ─────────────────── */
function dedup(list: TeamMember[]) {
  const seen = new Set<string>();
  return list.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}

export function DelegationsClient({ initialDelegations, teamMembers: initialMembers, projects }: Props) {
  const [items, setItems]             = useState<Delegation[]>(initialDelegations);
  const [members, setMembers]         = useState<TeamMember[]>(() => dedup(initialMembers));
  const [filter, setFilter]           = useState("ALL");

  // Sync member list from server after router.refresh()
  useEffect(() => { setMembers(dedup(initialMembers)); }, [initialMembers]);
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [showNew, setShowNew]         = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [saving, setSaving]           = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", description: "", teamMemberId: initialMembers[0]?.id ?? "",
    priority: "MEDIUM", dueDate: "", projectId: "",
  });

  const filtered = items
    .filter((i) => activeMember === null || i.teamMember.id === activeMember)
    .filter((i) => filter === "ALL" || i.status === filter);

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
        setForm({ title: "", description: "", teamMemberId: members[0]?.id ?? "", priority: "MEDIUM", dueDate: "", projectId: "" });
        router.refresh();
      }
    } finally { setSaving(false); }
  }

  async function deleteDelegation(id: string) {
    await fetch(`/api/delegations/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="px-8 py-6">

      {/* Empty team state */}
      {members.length === 0 && (
        <div
          className="flex items-start gap-3 rounded-xl px-5 py-4 mb-6"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border-str)" }}
        >
          <UserPlus size={18} style={{ color: "var(--c-accent-text)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>No team members yet</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--c-text-muted)" }}>
              Add your team before assigning tasks.
            </p>
            <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2 text-xs py-1.5 px-3">
              <UserPlus size={13} /> Add First Member
            </button>
          </div>
        </div>
      )}

      {/* Member filter pills */}
      {members.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setActiveMember(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeMember === null ? "var(--c-accent)" : "var(--c-elevated)",
              color:      activeMember === null ? "#fff" : "var(--c-text-muted)",
              border:     activeMember === null ? "1px solid var(--c-accent)" : "1px solid var(--c-border)",
            }}
          >
            All Members
          </button>
          {members.map((m) => {
            const isActive = activeMember === m.id;
            const open = items.filter((i) => i.teamMember.id === m.id && i.status !== "DONE").length;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMember(isActive ? null : m.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: isActive ? m.color + "22" : "var(--c-elevated)",
                  color:      isActive ? m.color : "var(--c-text-muted)",
                  border:     isActive ? `1px solid ${m.color}66` : "1px solid var(--c-border)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: m.color }}
                >
                  {getInitials(m.name)}
                </div>
                {m.name}
                {open > 0 && (
                  <span
                    className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: isActive ? m.color : "var(--c-border)",
                      color: isActive ? "#fff" : "var(--c-text-faint)",
                    }}
                  >
                    {open}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter tabs + action buttons */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--c-elevated)" }}>
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === t.value ? "var(--c-accent)" : "transparent",
                color:      filter === t.value ? "#fff" : "var(--c-text-muted)",
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus size={14} /> Add Member
          </button>
          <button
            onClick={() => setShowNew(true)}
            disabled={members.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={members.length === 0 ? "Add a team member first" : undefined}
          >
            <Plus size={15} /> Assign Task
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <GitBranch size={32} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
            {activeMember !== null
              ? `No ${filter === "ALL" ? "" : filter.toLowerCase().replace("_", " ") + " "}tasks for ${members.find(m => m.id === activeMember)?.name ?? "this member"}`
              : filter === "ALL" ? "No delegations yet" : `No ${filter.toLowerCase().replace("_", " ")} tasks`
            }
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div
            className="hidden md:grid gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{
              gridTemplateColumns: "1fr 180px 140px 100px 110px 32px",
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

          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="grid gap-4 px-5 py-4 items-center transition-colors"
              style={{
                gridTemplateColumns: "1fr 180px 140px 100px 110px 32px",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--c-border)" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Title */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{item.title}</p>
                {item.description && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{item.description}</p>
                )}
                {item.dueDate && (
                  <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: "var(--c-text-faint)" }}>
                    <Calendar size={10} /> {formatDate(item.dueDate)}
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: item.teamMember.color }}
                >
                  {getInitials(item.teamMember.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--c-text)" }}>{item.teamMember.name}</p>
                  <p className="text-[9px] truncate" style={{ color: "var(--c-text-faint)" }}>
                    {ROLE_LABELS[item.teamMember.role] ?? item.teamMember.role}
                  </p>
                </div>
              </div>

              {/* Project */}
              <div className="min-w-0">
                {item.project ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.project.client.color }} />
                    <span className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{item.project.name}</span>
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
              <QuickStatus
                entity="delegation" id={item.id} current={item.status}
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

      {/* ── Add Team Member modal ── */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onAdded={(m) => {
            setMembers([...members, m]);
            if (!form.teamMemberId) setForm((f) => ({ ...f, teamMemberId: m.id }));
            router.refresh();
          }}
        />
      )}

      {/* ── Assign Task modal ── */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div
            className="relative rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>Assign Task</h2>
              <button onClick={() => setShowNew(false)} style={{ color: "var(--c-text-muted)" }} className="hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Task title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input" placeholder="e.g. Refine logo spacing" required autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none h-20"
                  placeholder="Details, context, acceptance criteria…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Assign to *</label>
                  <select
                    value={form.teamMemberId}
                    onChange={(e) => setForm({ ...form, teamMemberId: e.target.value })}
                    className="input"
                  >
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
                    {PRIORITY_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Linked project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="input">
                    <option value="">None</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.client.name} · {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Due date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  type="submit" disabled={saving || !form.title || !form.teamMemberId}
                  className="btn-primary flex-1 disabled:opacity-60"
                >
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
