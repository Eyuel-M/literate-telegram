"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProject {
  id:       string;
  name:     string;
  status:   string;
  priority: string;
  dueDate:  string | null;
  color:    string;
  client:   { id: string; name: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH:   "#ef4444",
  MEDIUM: "#f59e0b",
  LOW:    "#22c55e",
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function CalendarClient() {
  const router = useRouter();
  const today  = new Date();

  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [projects, setProjects] = useState<CalendarProject[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => { setProjects(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  // Build calendar grid
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Map projects by day string "YYYY-MM-DD"
  const byDay = new Map<string, CalendarProject[]>();
  for (const p of projects) {
    if (!p.dueDate) continue;
    const d   = new Date(p.dueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(p);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--c-text)" }}>Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold w-36 text-center" style={{ color: "var(--c-text)" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--c-text-faint)" }}>
          Loading…
        </div>
      ) : (
        <div
          className="flex-1 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--c-border)" }}
        >
          {/* Day labels */}
          <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold"
                style={{ color: "var(--c-text-faint)", background: "var(--c-elevated)" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "minmax(110px, 1fr)" }}>
            {cells.map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${i}`}
                    style={{
                      background: "var(--c-bg)",
                      borderRight:  (i + 1) % 7 !== 0 ? "1px solid var(--c-border)" : "none",
                      borderBottom: i < cells.length - 7 ? "1px solid var(--c-border)" : "none",
                    }}
                  />
                );
              }

              const key       = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayProjs  = byDay.get(key) ?? [];
              const isToday   = key === todayStr;

              return (
                <div
                  key={key}
                  className="p-2 flex flex-col gap-1 overflow-hidden"
                  style={{
                    background:   "var(--c-bg)",
                    borderRight:  (i + 1) % 7 !== 0 ? "1px solid var(--c-border)" : "none",
                    borderBottom: i < cells.length - 7 ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  <span
                    className="text-xs font-semibold self-start w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      background: isToday ? "var(--c-accent)" : "transparent",
                      color:      isToday ? "#fff" : "var(--c-text-muted)",
                    }}
                  >
                    {day}
                  </span>

                  {dayProjs.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/clients/${p.client.id}`)}
                      className="w-full text-left px-2 py-0.5 rounded-lg text-[10px] font-medium truncate transition-opacity hover:opacity-75"
                      style={{
                        background:  `${p.color}22`,
                        borderLeft:  `3px solid ${PRIORITY_COLORS[p.priority] ?? p.color}`,
                        color:       "var(--c-text)",
                      }}
                      title={`${p.name} · ${p.client.name} · ${p.priority} priority`}
                    >
                      {p.name}
                    </button>
                  ))}

                  {dayProjs.length > 3 && (
                    <span className="text-[9px] px-1" style={{ color: "var(--c-text-faint)" }}>
                      +{dayProjs.length - 3} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
