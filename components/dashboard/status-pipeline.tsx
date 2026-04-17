"use client";

interface StatusBar {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  bars: StatusBar[];
}

export function StatusPipeline({ bars }: Props) {
  const max = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="space-y-2.5">
      {bars.map((bar) => (
        <div key={bar.status} className="flex items-center gap-3">
          <div className="w-28 flex-shrink-0">
            <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>
              {bar.label}
            </span>
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--c-elevated)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(bar.count / max) * 100}%`,
                background: bar.color,
                minWidth: bar.count > 0 ? "8px" : "0",
              }}
            />
          </div>
          <span
            className="w-5 text-right text-xs font-bold flex-shrink-0"
            style={{ color: bar.count > 0 ? bar.color : "var(--c-text-faint)" }}
          >
            {bar.count}
          </span>
        </div>
      ))}
    </div>
  );
}
