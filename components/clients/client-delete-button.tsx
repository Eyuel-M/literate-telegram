"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface Props {
  clientId: string;
  clientName: string;
  projectCount: number;
}

export function ClientDeleteButton({ clientId, clientName, projectCount }: Props) {
  const [open, setOpen]       = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    setDeleting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
        style={{ color: "var(--c-danger)" }}
        title="Delete client"
      >
        <Trash2 size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
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
              <button onClick={() => setOpen(false)} style={{ color: "var(--c-text-muted)" }} className="hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm mb-3" style={{ color: "var(--c-text)" }}>
              Delete <strong>{clientName}</strong>?
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
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "var(--c-danger)", color: "#fff" }}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
