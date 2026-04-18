"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_COLORS } from "@/lib/utils";
import {
  Layers, PenTool, Monitor, Box, Home, Trees, Package,
  Plus, Pencil, Trash2, X, AlertTriangle, Check, ChevronDown,
  FolderOpen, Zap,
} from "lucide-react";

/* ─── types ─────────────────────────────────────────────────── */
interface TemplateItem { id?: string; name: string; type: string; description?: string | null; sortOrder: number; }
interface Template { id: string; name: string; description: string | null; color: string; icon: string; isPreset: boolean; items: TemplateItem[]; }
interface Project  { id: string; name: string; client: { name: string; color: string }; }

/* ─── constants ─────────────────────────────────────────────── */
const ICONS: Record<string, React.ElementType> = {
  Layers, PenTool, Monitor, Box, Home, Trees, Package, Zap, FolderOpen,
};

const ICON_OPTIONS = [
  { value: "Layers",    label: "Layers"    },
  { value: "PenTool",   label: "Pen Tool"  },
  { value: "Monitor",   label: "Monitor"   },
  { value: "Box",       label: "Box"       },
  { value: "Home",      label: "Home"      },
  { value: "Trees",     label: "Trees"     },
  { value: "Package",   label: "Package"   },
  { value: "Zap",       label: "Zap"       },
  { value: "FolderOpen",label: "Folder"    },
];

const ITEM_TYPES = [
  { value: "LOGO",           label: "Logo Design"   },
  { value: "BRAND_IDENTITY", label: "Brand Identity"},
  { value: "BUSINESS_CARD",  label: "Business Card" },
  { value: "SOCIAL_MEDIA",   label: "Social Media"  },
  { value: "PRINT",          label: "Print"         },
  { value: "UI_UX",          label: "UI/UX"         },
  { value: "WIREFRAME",      label: "Wireframe"     },
  { value: "PACKAGING",      label: "Packaging"     },
  { value: "OTHER",          label: "Other"         },
];

const TYPE_COLORS: Record<string, string> = {
  LOGO: "#7c3aed", BRAND_IDENTITY: "#3b82f6", BUSINESS_CARD: "#06b6d4",
  SOCIAL_MEDIA: "#10b981", PRINT: "#f59e0b", UI_UX: "#ec4899",
  WIREFRAME: "#6366f1", PACKAGING: "#ef4444", OTHER: "#6b7280",
};

/* ─── Edit / Create modal ───────────────────────────────────── */
function TemplateModal({
  initial, onClose, onSaved,
}: {
  initial?: Template;
  onClose: () => void;
  onSaved: (t: Template) => void;
}) {
  const isNew = !initial;
  const [name, setName]           = useState(initial?.name        ?? "");
  const [description, setDesc]    = useState(initial?.description ?? "");
  const [color, setColor]         = useState(initial?.color       ?? CLIENT_COLORS[0]);
  const [icon, setIcon]           = useState(initial?.icon        ?? "Layers");
  const [items, setItems]         = useState<TemplateItem[]>(
    initial?.items ?? [{ name: "", type: "OTHER", sortOrder: 0 }]
  );
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  function addItem() {
    setItems([...items, { name: "", type: "OTHER", sortOrder: items.length }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, patch: Partial<TemplateItem>) {
    setItems(items.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    const validItems = items.filter((it) => it.name.trim());
    setSaving(true); setError("");
    try {
      const url    = isNew ? "/api/templates" : `/api/templates/${initial!.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, color, icon, items: validItems }),
      });
      if (res.ok) { onSaved(await res.json()); onClose(); }
      else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed to save."); }
    } catch { setError("Network error."); }
    finally  { setSaving(false); }
  }

  const IconComp = ICONS[icon] ?? Layers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up flex flex-col"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "22" }}>
            <IconComp size={16} style={{ color }} />
          </div>
          <h2 className="font-semibold flex-1" style={{ color: "var(--c-text)" }}>
            {isNew ? "New Template" : "Edit Template"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--c-text-muted)" }} className="hover:opacity-70"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-5">

            {/* Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Template name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Full Branding" autoFocus />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Description</label>
              <input value={description} onChange={(e) => setDesc(e.target.value)} className="input" placeholder="Brief summary of what this template covers" />
            </div>

            {/* Color + Icon row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--c-text-muted)" }}>Color</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CLIENT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-lg transition-transform hover:scale-110"
                      style={{ background: c, outline: color === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Icon</label>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="input text-xs">
                  {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--c-text-muted)" }}>
                Deliverables ({items.filter(i => i.name.trim()).length})
              </label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      className="input flex-1 text-xs"
                      placeholder={`Deliverable ${i + 1}`}
                    />
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(i, { type: e.target.value })}
                      className="input text-xs w-36"
                    >
                      {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeItem(i)} className="hover:opacity-70 flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button" onClick={addItem}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--c-accent-text)" }}
              >
                <Plus size={13} /> Add deliverable
              </button>
            </div>

            {error && (
              <div className="text-xs rounded-xl px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--c-danger)" }}>
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Saving…" : isNew ? "Create Template" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete confirm modal ──────────────────────────────────── */
function DeleteModal({ template, onClose, onDeleted }: { template: Template; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  async function confirm() {
    setDeleting(true);
    await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    setDeleting(false);
    onDeleted();
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
            <AlertTriangle size={18} style={{ color: "var(--c-danger)" }} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>Delete Template</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>This cannot be undone</p>
          </div>
          <button onClick={onClose} className="hover:opacity-70" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--c-text)" }}>
          Delete <strong>{template.name}</strong> and its {template.items.length} deliverable{template.items.length !== 1 ? "s" : ""}?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={confirm} disabled={deleting}
            className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--c-danger)", color: "#fff" }}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Apply to project modal ─────────────────────────────────── */
function ApplyModal({ template, projects, onClose }: { template: Template; projects: Project[]; onClose: () => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [applying, setApplying]   = useState(false);
  const [done, setDone]           = useState(false);
  const [count, setCount]         = useState(0);
  const router = useRouter();

  async function apply() {
    if (!projectId) return;
    setApplying(true);
    const res = await fetch(`/api/templates/${template.id}/apply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();
    setCount(data.created ?? 0);
    setApplying(false);
    setDone(true);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>
            {done ? "Template Applied!" : `Apply "${template.name}"`}
          </h2>
          <button onClick={onClose} className="hover:opacity-70" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,185,129,0.12)" }}>
              <Check size={22} style={{ color: "var(--c-success)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text)" }}>
              {count} deliverable{count !== 1 ? "s" : ""} added
            </p>
            <p className="text-xs mb-5" style={{ color: "var(--c-text-muted)" }}>
              Go to the project to see them.
            </p>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        ) : (
          <>
            <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>
              This will add {template.items.length} deliverable{template.items.length !== 1 ? "s" : ""} to the selected project.
            </p>
            {projects.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--c-text-muted)" }}>No projects found. Create one first.</p>
            ) : (
              <>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Select project</label>
                <div className="relative mb-5">
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input appearance-none pr-8 w-full">
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.client.name} · {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-muted)" }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={apply} disabled={applying || !projectId} className="btn-primary flex-1 disabled:opacity-60">
                    {applying ? "Applying…" : "Apply Template"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Template card ─────────────────────────────────────────── */
function TemplateCard({
  template, projects,
  onEdit, onDelete,
}: { template: Template; projects: Project[]; onEdit: () => void; onDelete: () => void }) {
  const [showApply, setShowApply] = useState(false);
  const IconComp = ICONS[template.icon] ?? Layers;

  return (
    <>
      <div
        className="card p-5 flex flex-col gap-4 group relative hover:scale-[1.01] transition-transform"
        style={{ borderTop: `3px solid ${template.color}` }}
      >
        {/* Actions (hover) */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--c-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--c-elevated)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Edit template"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--c-danger)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title="Delete template"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Icon + name */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: template.color + "22" }}>
            <IconComp size={18} style={{ color: template.color }} />
          </div>
          <div className="min-w-0 pr-12">
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--c-text)" }}>{template.name}</p>
            {template.isPreset && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: template.color + "22", color: template.color }}>
                Preset
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--c-text-muted)" }}>
            {template.description}
          </p>
        )}

        {/* Deliverable type tags */}
        <div className="flex flex-wrap gap-1.5">
          {template.items.slice(0, 5).map((item, i) => (
            <span
              key={i}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: (TYPE_COLORS[item.type] ?? "#6b7280") + "18", color: TYPE_COLORS[item.type] ?? "#6b7280" }}
            >
              {item.name}
            </span>
          ))}
          {template.items.length > 5 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ color: "var(--c-text-faint)", background: "var(--c-elevated)" }}>
              +{template.items.length - 5} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--c-border)" }}>
          <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>
            {template.items.length} deliverable{template.items.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setShowApply(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{ background: template.color + "18", color: template.color }}
            onMouseEnter={e => (e.currentTarget.style.background = template.color + "30")}
            onMouseLeave={e => (e.currentTarget.style.background = template.color + "18")}
          >
            <Zap size={11} /> Apply
          </button>
        </div>
      </div>

      {showApply && (
        <ApplyModal template={template} projects={projects} onClose={() => setShowApply(false)} />
      )}
    </>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export function TemplatesClient({
  initialTemplates, projects,
}: { initialTemplates: Template[]; projects: Project[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [editTarget, setEditTarget] = useState<Template | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  function handleSaved(t: Template) {
    setTemplates((prev) => {
      const exists = prev.find((x) => x.id === t.id);
      return exists ? prev.map((x) => x.id === t.id ? t : x) : [...prev, t];
    });
  }

  function handleDeleted(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            projects={projects}
            onEdit={() => setEditTarget(t)}
            onDelete={() => setDeleteTarget(t)}
          />
        ))}

        {/* + New Template card */}
        <button
          onClick={() => setEditTarget("new")}
          className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] min-h-[180px]"
          style={{
            background: "transparent",
            border: "2px dashed var(--c-border-str)",
            color: "var(--c-text-faint)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--c-accent)"; (e.currentTarget as HTMLElement).style.color = "var(--c-accent-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--c-border-str)"; (e.currentTarget as HTMLElement).style.color = "var(--c-text-faint)"; }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--c-elevated)" }}>
            <Plus size={20} />
          </div>
          <p className="text-sm font-medium">New Template</p>
        </button>
      </div>

      {/* Edit / Create modal */}
      {editTarget !== null && (
        <TemplateModal
          initial={editTarget === "new" ? undefined : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteModal
          template={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => handleDeleted(deleteTarget.id)}
        />
      )}
    </div>
  );
}
