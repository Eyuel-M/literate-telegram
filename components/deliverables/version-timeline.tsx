"use client";

import { STATUS_LABELS, STATUS_COLORS, formatRelative } from "@/lib/utils";

interface Version {
  id: string;
  number: number;
  status: string;
  createdAt: Date;
}

interface Props {
  versions: Version[];
  activeVersionId?: string;
}

export function VersionTimeline({ versions, activeVersionId }: Props) {
  return (
    <div className="relative">
      {versions.map((v, idx) => (
        <a key={v.id} href={`#version-${v.id}`} className="flex items-start gap-3 group p-2 rounded-xl hover:bg-[#1a1a2e] transition-all">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              v.id === activeVersionId
                ? "bg-violet-700 text-white"
                : "bg-[#1a1a2e] border border-[#2a2a40] text-[#6b6b85] group-hover:border-violet-700/50"
            }`}>
              {v.number}
            </div>
            {idx < versions.length - 1 && (
              <div className="w-px h-6 bg-[#1e1e2e] mt-1" />
            )}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium text-[#f0f0f8]">v{v.number}</span>
              <span className={`badge text-[9px] ${STATUS_COLORS[v.status]}`}>
                {STATUS_LABELS[v.status]}
              </span>
            </div>
            <p className="text-[10px] text-[#3a3a50]">{formatRelative(v.createdAt)}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
