"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle, Calendar } from "lucide-react";
import { formatDuration, formatDate, DELIVERABLE_TYPES } from "@/lib/utils";
import { QuickStatus } from "@/components/ui/quick-status";

interface Props {
  id:           string;
  name:         string;
  type:         string;
  status:       string;
  dueDate:      string | Date | null;
  timeEntries:  { duration: number }[];
  versions: {
    number:  number;
    assets:  { url: string }[];
    _count:  { feedback: number };
  }[];
  _count: { versions: number };
}

export function DeliverableCard(d: Props) {
  const router = useRouter();
  const [confirm,  setConfirm]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const latestV    = d.versions[0];
  const thumb      = latestV?.assets[0]?.url;
  const timeLogged = d.timeEntries.reduce((s, e) => s + e.duration, 0);
  const typeLabel  = DELIVERABLE_TYPES.find((t) => t.value === d.type)?.label ?? d.type;
  const comments   = latestV?._count.feedback ?? 0;
  const now        = new Date();
  const isOverdue  = d.dueDate && d.status !== "APPROVED" && new Date(d.dueDate) < now;

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/deliverables/${d.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card overflow-hidden group relative">
      {thumb && (
        <div className="h-32 overflow-hidden relative" style={{ background: "var(--c-elevated)" }}>
          <Image
            src={thumb} alt={d.name} fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            sizes="280px"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--c-surface) 0%, transparent 60%)", opacity: 0.7 }} />
          {latestV && (
            <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono backdrop-blur-sm">
              v{latestV.number}
            </div>
          )}
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <p className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>{typeLabel}</p>
          {/* Delete button — visible on hover */}
          {!confirm && (
            <button
              onClick={() => setConfirm(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
              style={{ color: "var(--c-text-faint)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-faint)"; e.currentTarget.style.background = "transparent"; }}
              title="Archive deliverable"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Inline confirm */}
        {confirm && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <AlertTriangle size={11} style={{ color: "#dc2626", flexShrink: 0 }} />
            <span className="text-[10px] font-medium flex-1" style={{ color: "#dc2626" }}>Archive?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: "#dc2626", color: "#fff" }}
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button onClick={() => setConfirm(false)} style={{ color: "#dc2626" }}>
              <X size={11} />
            </button>
          </div>
        )}

        <Link href={`/deliverables/${d.id}`}>
          <h3 className="text-sm font-semibold mb-2.5 hover:underline" style={{ color: "var(--c-text)" }}>
            {d.name}
          </h3>
        </Link>

        {/* Due date */}
        {d.dueDate && (
          <div
            className="flex items-center gap-1 text-[10px] mb-2"
            style={{ color: isOverdue ? "#dc2626" : "var(--c-text-faint)" }}
          >
            <Calendar size={10} />
            {isOverdue ? "Overdue · " : "Due "}{formatDate(d.dueDate)}
          </div>
        )}

        <div className="flex items-center justify-between">
          <QuickStatus entity="deliverable" id={d.id} current={d.status} />
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--c-text-faint)" }}>
            {comments > 0 && <span style={{ color: "#fbbf24" }}>{comments} ✦</span>}
            {timeLogged > 0 && <span>{formatDuration(timeLogged)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
