"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDuration, getInitials } from "@/lib/utils";
import { Trash2, AlertTriangle, X, Users, Palette } from "lucide-react";
import { NewClientButton } from "@/components/clients/new-client-button";
import { QuickStatus } from "@/components/ui/quick-status";

interface ClientData {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  color: string;
  status: string;
  projects: {
    status: string;
    timeEntries: { duration: number }[];
  }[];
}

/* ─── Confirm modal ─────────────────────────────────────────── */
function DeleteConfirmModal({
  client,
  onClose,
  onDeleted,
}: {
  client: ClientData;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const projectCount = client.projects.length;

  async function confirm() {
    setDeleting(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    onDeleted(client.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            <AlertTriangle size={18} style={{ color: "var(--c-danger)" }} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>Delete Client</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>This action cannot be undone</p>
          </div>
          <button onClick={onClose} className="hover:opacity-70" style={{ color: "var(--c-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-sm mb-3" style={{ color: "var(--c-text)" }}>
          Delete <strong>{client.name}</strong>?
        </p>

        {projectCount > 0 && (
          <div
            className="text-xs rounded-xl px-3 py-2.5 mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--c-danger)" }}
          >
            This will also permanently delete{" "}
            <strong>{projectCount} project{projectCount !== 1 ? "s" : ""}</strong> and all their
            deliverables, versions, assets, feedback, and time entries.
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center py-2 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "var(--c-danger)", color: "#fff" }}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid ──────────────────────────────────────────────────── */
export function ClientsGrid({ initialClients }: { initialClients: ClientData[] }) {
  const [clients, setClients]         = useState<ClientData[]>(initialClients);
  const [deleteTarget, setDeleteTarget] = useState<ClientData | null>(null);
  const router = useRouter();

  function handleDeleted(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="card p-16 text-center">
        <Users size={40} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-4" />
        <h3 className="font-semibold mb-2" style={{ color: "var(--c-text)" }}>No clients yet</h3>
        <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
          Add your first client to start managing projects
        </p>
        <NewClientButton />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client) => {
          const active  = client.projects.filter((p) => ["IN_PROGRESS", "REVIEW", "DISCOVERY"].includes(p.status)).length;
          const total   = client.projects.length;
          const minutes = client.projects.reduce((s, p) => s + p.timeEntries.reduce((t, e) => t + e.duration, 0), 0);

          return (
            <div key={client.id} className="relative group">
              {/* Action buttons — outside the Link, no flicker */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                <Link
                  href={`/clients/${client.id}/moodboard`}
                  onClick={e => e.stopPropagation()}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "var(--c-accent-text)", opacity: 0.45 }}
                  title="Open moodboard"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--c-accent-glow)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.opacity = "0.45"; }}
                >
                  <Palette size={13} />
                </Link>
                <button
                  onClick={() => setDeleteTarget(client)}
                  className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: "var(--c-danger)" }}
                  title="Delete client"
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <Link href={`/clients/${client.id}`} className="block">
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
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-semibold truncate" style={{ color: "var(--c-text)" }}>{client.name}</h3>
                      {client.company && (
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{client.company}</p>
                      )}
                    </div>
                    <QuickStatus entity="client" id={client.id} current={client.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold" style={{ color: "var(--c-text)" }}>{total}</div>
                      <div className="text-xs" style={{ color: "var(--c-text-muted)" }}>Projects</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: "var(--c-text)" }}>{active}</div>
                      <div className="text-xs" style={{ color: "var(--c-text-muted)" }}>Active</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: "var(--c-text)" }}>{formatDuration(minutes)}</div>
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
            </div>
          );
        })}
      </div>

      {/* Confirm modal — rendered at grid level, outside every card */}
      {deleteTarget && (
        <DeleteConfirmModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
