"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface Props {
  projectId: string;
  clientId:  string;
}

export function DeleteProjectButton({ projectId, clientId }: Props) {
  const [confirm,  setConfirm]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all"
        style={{ color: "var(--c-danger)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <Trash2 size={13} /> Delete Project
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
      <AlertTriangle size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
      <span className="text-xs font-medium" style={{ color: "#dc2626" }}>Move to archive?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-bold px-2.5 py-1 rounded-lg"
        style={{ background: "#dc2626", color: "#fff" }}
      >
        {deleting ? "…" : "Archive"}
      </button>
      <button onClick={() => setConfirm(false)} style={{ color: "#dc2626" }}>
        <X size={13} />
      </button>
    </div>
  );
}
