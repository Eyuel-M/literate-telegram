"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, FolderOpen, GitBranch, Layers, Package, RotateCcw, Trash2, ChevronDown, ChevronRight, Archive } from "lucide-react";

type ArchivedClient      = { id: string; name: string; email: string | null; company: string | null; color: string; deletedAt: string; _count: { projects: number } };
type ArchivedProject     = { id: string; name: string; status: string; color: string; deletedAt: string; client: { name: string; color: string }; _count: { deliverables: number } };
type ArchivedDelegation  = { id: string; title: string; status: string; priority: string; deletedAt: string; teamMember: { name: string; color: string }; project: { name: string } | null };
type ArchivedTemplate    = { id: string; name: string; description: string | null; color: string; icon: string; deletedAt: string; _count: { items: number } };
type ArchivedDeliverable = { id: string; name: string; type: string; status: string; deletedAt: string; project: { name: string; client: { name: string; color: string } } };

interface ArchiveData {
  clients:      ArchivedClient[];
  projects:     ArchivedProject[];
  delegations:  ArchivedDelegation[];
  templates:    ArchivedTemplate[];
  deliverables: ArchivedDeliverable[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function SectionHeader({ icon: Icon, label, count, open, onToggle }: { icon: React.ElementType; label: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-1 text-left"
    >
      <Icon size={15} style={{ color: "var(--c-accent-text)" }} />
      <span className="text-sm font-semibold flex-1" style={{ color: "var(--c-text)" }}>{label}</span>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--c-elevated)", color: "var(--c-text-muted)" }}>{count}</span>
      {open ? <ChevronDown size={14} style={{ color: "var(--c-text-faint)" }} /> : <ChevronRight size={14} style={{ color: "var(--c-text-faint)" }} />}
    </button>
  );
}

function ItemRow({
  label, meta, color, deletedAt, onRestore, onPurge, restoring, purging,
}: {
  label: string; meta: string; color?: string; deletedAt: string;
  onRestore: () => void; onPurge: () => void; restoring: boolean; purging: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
    >
      {color && <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{label}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{meta}</p>
      </div>
      <span className="text-[11px] flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>Archived {timeAgo(deletedAt)}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onRestore}
          disabled={restoring || purging}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <RotateCcw size={11} />
          {restoring ? "Restoring…" : "Restore"}
        </button>
        <button
          onClick={onPurge}
          disabled={restoring || purging}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
          style={{ color: "var(--c-danger)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <Trash2 size={11} />
          {purging ? "Deleting…" : "Delete forever"}
        </button>
      </div>
    </div>
  );
}

export function ArchiveClient({ initialData }: { initialData: ArchiveData }) {
  const router = useRouter();
  const [data, setData] = useState<ArchiveData>(initialData);
  const [open, setOpen] = useState<Record<string, boolean>>({ clients: true, projects: true, delegations: true, templates: true, deliverables: true });
  const [acting, setActing] = useState<Record<string, "restoring" | "purging">>({});

  const total = data.clients.length + data.projects.length + data.delegations.length + data.templates.length + data.deliverables.length;

  function toggle(key: string) {
    setOpen((p) => ({ ...p, [key]: !p[key] }));
  }

  async function restore(type: string, id: string) {
    setActing((p) => ({ ...p, [`${type}:${id}`]: "restoring" }));
    await fetch("/api/archive/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    setData((prev) => ({
      ...prev,
      [type + "s"]: (prev[type + "s" as keyof ArchiveData] as { id: string }[]).filter((x) => x.id !== id),
    }));
    setActing((p) => { const n = { ...p }; delete n[`${type}:${id}`]; return n; });
    router.refresh();
  }

  async function purge(type: string, id: string) {
    setActing((p) => ({ ...p, [`${type}:${id}`]: "purging" }));
    await fetch("/api/archive/purge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    setData((prev) => ({
      ...prev,
      [type + "s"]: (prev[type + "s" as keyof ArchiveData] as { id: string }[]).filter((x) => x.id !== id),
    }));
    setActing((p) => { const n = { ...p }; delete n[`${type}:${id}`]; return n; });
  }

  if (total === 0) {
    return (
      <div className="card p-16 text-center">
        <Archive size={40} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-4" />
        <h3 className="font-semibold mb-2" style={{ color: "var(--c-text)" }}>Archive is empty</h3>
        <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
          Items you delete will appear here so you can restore them if needed
        </p>
      </div>
    );
  }

  const sections = [
    {
      key: "clients", label: "Clients", icon: Users,
      items: data.clients.map((c) => ({
        id: c.id, label: c.name,
        meta: [c.company, `${c._count.projects} project${c._count.projects !== 1 ? "s" : ""}`].filter(Boolean).join(" · "),
        color: c.color, deletedAt: c.deletedAt,
      })),
    },
    {
      key: "projects", label: "Projects", icon: FolderOpen,
      items: data.projects.map((p) => ({
        id: p.id, label: p.name,
        meta: `${p.client.name} · ${p._count.deliverables} deliverable${p._count.deliverables !== 1 ? "s" : ""}`,
        color: p.client.color, deletedAt: p.deletedAt,
      })),
    },
    {
      key: "delegations", label: "Delegations", icon: GitBranch,
      items: data.delegations.map((d) => ({
        id: d.id, label: d.title,
        meta: [d.teamMember.name, d.project?.name].filter(Boolean).join(" · "),
        color: d.teamMember.color, deletedAt: d.deletedAt,
      })),
    },
    {
      key: "templates", label: "Templates", icon: Layers,
      items: data.templates.map((t) => ({
        id: t.id, label: t.name,
        meta: `${t._count.items} item${t._count.items !== 1 ? "s" : ""}${t.description ? " · " + t.description : ""}`,
        color: t.color, deletedAt: t.deletedAt,
      })),
    },
    {
      key: "deliverables", label: "Deliverables", icon: Package,
      items: data.deliverables.map((d) => ({
        id: d.id, label: d.name,
        meta: `${d.project.client.name} · ${d.project.name}`,
        color: d.project.client.color, deletedAt: d.deletedAt,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        if (section.items.length === 0) return null;
        const singularKey = section.key.slice(0, -1);
        return (
          <div key={section.key} className="card p-5">
            <SectionHeader
              icon={section.icon}
              label={section.label}
              count={section.items.length}
              open={open[section.key]}
              onToggle={() => toggle(section.key)}
            />
            {open[section.key] && (
              <div className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const key = `${singularKey}:${item.id}`;
                  return (
                    <ItemRow
                      key={item.id}
                      label={item.label}
                      meta={item.meta}
                      color={item.color}
                      deletedAt={item.deletedAt}
                      onRestore={() => restore(singularKey, item.id)}
                      onPurge={() => purge(singularKey, item.id)}
                      restoring={acting[key] === "restoring"}
                      purging={acting[key] === "purging"}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
