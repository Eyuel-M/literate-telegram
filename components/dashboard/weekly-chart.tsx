"use client";

interface DayEntry {
  day: string;
  minutes: number;
}

interface Props {
  days: DayEntry[];
}

export function WeeklyChart({ days }: Props) {
  const max = Math.max(...days.map((d) => d.minutes), 60);

  return (
    <div className="flex items-end gap-2 h-20">
      {days.map(({ day, minutes }) => {
        const pct = (minutes / max) * 100;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const label = minutes === 0 ? "—" : hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--c-accent-text)" }}
            >
              {label}
            </div>
            <div className="w-full rounded-t-md transition-all duration-500 ease-out"
              style={{
                height: `${Math.max(pct * 0.56, minutes > 0 ? 4 : 1)}px`,
                background: minutes > 0 ? "var(--c-accent)" : "var(--c-border-str)",
                opacity: minutes > 0 ? 0.85 : 0.3,
                minHeight: "2px",
              }}
            />
            <span className="text-[9px]" style={{ color: "var(--c-text-faint)" }}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}
