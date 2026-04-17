"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

type Entity = "project" | "deliverable" | "version" | "delegation" | "client";

const OPTIONS: Record<Entity, Array<{ value: string; label: string; cls: string }>> = {
  client: [
    { value: "ACTIVE",   label: "Active",   cls: "status-active"   },
    { value: "INACTIVE", label: "Inactive", cls: "status-archived" },
  ],
  project: [
    { value: "DISCOVERY",   label: "Discovery",   cls: "status-discovery"  },
    { value: "IN_PROGRESS", label: "In Progress", cls: "status-progress"   },
    { value: "REVIEW",      label: "In Review",   cls: "status-review"     },
    { value: "DELIVERED",   label: "Delivered",   cls: "status-delivered"  },
    { value: "ARCHIVED",    label: "Archived",    cls: "status-archived"   },
  ],
  deliverable: [
    { value: "PENDING",     label: "Pending",     cls: "status-pending"    },
    { value: "IN_PROGRESS", label: "In Progress", cls: "status-progress"   },
    { value: "IN_REVIEW",   label: "In Review",   cls: "status-review"     },
    { value: "APPROVED",    label: "Approved",    cls: "status-approved"   },
    { value: "REJECTED",    label: "Rejected",    cls: "status-rejected"   },
  ],
  version: [
    { value: "DRAFT",       label: "Draft",       cls: "status-draft"      },
    { value: "SENT",        label: "Sent",        cls: "status-sent"       },
    { value: "APPROVED",    label: "Approved",    cls: "status-approved"   },
    { value: "REJECTED",    label: "Rejected",    cls: "status-rejected"   },
  ],
  delegation: [
    { value: "PENDING",     label: "Pending",     cls: "status-pending"    },
    { value: "IN_PROGRESS", label: "In Progress", cls: "status-progress"   },
    { value: "DONE",        label: "Done",        cls: "status-approved"   },
  ],
};

const API_MAP: Record<Entity, string> = {
  client:      "/api/clients",
  project:     "/api/projects",
  deliverable: "/api/deliverables",
  version:     "/api/versions",
  delegation:  "/api/delegations",
};

interface Props {
  entity: Entity;
  id: string;
  current: string;
  onChanged?: (s: string) => void;
}

export function QuickStatus({ entity, id, current, onChanged }: Props) {
  const [open, setOpen]     = useState(false);
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const opts   = OPTIONS[entity];
  const active = opts.find((o) => o.value === status) ?? opts[0];

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(true);
  }

  // Close on scroll so the dropdown doesn't float away from its trigger
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  async function change(val: string) {
    if (val === status) { setOpen(false); return; }
    setSaving(true);
    setStatus(val);
    setOpen(false);
    await fetch(`${API_MAP[entity]}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: val }),
    });
    setSaving(false);
    onChanged?.(val);
    router.refresh();
  }

  const dropdown = open ? (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] rounded-xl py-1 min-w-[150px] shadow-xl animate-scale-in"
        style={{
          top: coords.top,
          left: coords.left,
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border-str)",
        }}
      >
        {opts.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); change(opt.value); }}
            className="w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors"
            style={{ color: opt.value === status ? "var(--c-text)" : "var(--c-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--c-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span className={`badge ${opt.cls}`}>{opt.label}</span>
            {opt.value === status && <Check size={11} style={{ color: "var(--c-accent-text)" }} />}
          </button>
        ))}
      </div>
    </>
  ) : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={saving}
        className={`badge cursor-pointer select-none ${active.cls} flex items-center gap-1`}
      >
        {saving && (
          <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
        )}
        {active.label}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
