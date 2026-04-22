"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

const OPTIONS = [
  { value: "HIGH",   label: "High",   bg: "#fef2f2", color: "#dc2626" },
  { value: "MEDIUM", label: "Medium", bg: "#fffbeb", color: "#d97706" },
  { value: "LOW",    label: "Low",    bg: "#f0fdf4", color: "#16a34a" },
];

interface Props {
  id: string;
  current: string;
  onChanged?: (p: string) => void;
}

export function QuickPriority({ id, current, onChanged }: Props) {
  const [open,     setOpen]     = useState(false);
  const [priority, setPriority] = useState(current);
  const [saving,   setSaving]   = useState(false);
  const [coords,   setCoords]   = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const active = OPTIONS.find((o) => o.value === priority) ?? OPTIONS[1];

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  async function change(val: string) {
    if (val === priority) { setOpen(false); return; }
    setSaving(true);
    setPriority(val);
    setOpen(false);
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: val }),
    });
    setSaving(false);
    onChanged?.(val);
    router.refresh();
  }

  const dropdown = open ? (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
      <div
        className="fixed z-[9999] rounded-xl py-1 min-w-[130px] shadow-xl animate-scale-in"
        style={{ top: coords.top, left: coords.left, background: "var(--c-elevated)", border: "1px solid var(--c-border-str)" }}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); change(opt.value); }}
            className="w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors"
            style={{ color: priority === opt.value ? "var(--c-text)" : "var(--c-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--c-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: opt.bg, color: opt.color }}
            >
              {opt.label}
            </span>
            {opt.value === priority && <Check size={11} style={{ color: "var(--c-accent-text)" }} />}
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
        className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full cursor-pointer select-none"
        style={{ background: active.bg, color: active.color }}
      >
        {saving && <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />}
        {active.label}
        <ChevronDown size={9} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
