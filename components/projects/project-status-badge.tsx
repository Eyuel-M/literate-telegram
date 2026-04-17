"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const STATUSES = ["DISCOVERY", "IN_PROGRESS", "REVIEW", "DELIVERED", "ARCHIVED"];

interface Props {
  status: string;
  projectId: string;
}

export function ProjectStatusBadge({ status, projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const router = useRouter();

  async function changeStatus(newStatus: string) {
    setCurrent(newStatus);
    setOpen(false);
    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn("badge text-[10px] cursor-pointer flex items-center gap-1", STATUS_COLORS[current])}
      >
        {STATUS_LABELS[current]}
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-[#1a1a2e] border border-[#2a2a40] rounded-xl py-1 min-w-[140px] shadow-xl z-20 animate-slide-up">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs hover:bg-[#222238] transition-colors flex items-center gap-2",
                  s === current ? "text-[#f0f0f8]" : "text-[#6b6b85]"
                )}
              >
                <span className={cn("badge text-[9px]", STATUS_COLORS[s])}>{STATUS_LABELS[s]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
