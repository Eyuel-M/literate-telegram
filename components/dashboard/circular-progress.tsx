"use client";

interface Props {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

function autoColor(pct: number) {
  if (pct >= 80) return "#10b981";
  if (pct >= 50) return "#7c3aed";
  if (pct >= 25) return "#f59e0b";
  return "#ef4444";
}

export function CircularProgress({ value, max, size = 80, strokeWidth, color, label, sublabel }: Props) {
  const sw = strokeWidth ?? (size >= 100 ? 8 : size >= 70 ? 7 : 6);
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const radius = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);
  const cx = size / 2;
  const col = color ?? autoColor(pct);
  const trackOpacity = 0.12;

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none"
          stroke={col}
          strokeOpacity={trackOpacity}
          strokeWidth={sw}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none"
          stroke={col}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span style={{ fontSize: size * 0.21, fontWeight: 700, color: col, lineHeight: 1 }}>
          {pct}%
        </span>
        {label && (
          <span style={{ fontSize: size * 0.13, color: "var(--c-text-muted)", marginTop: 2, lineHeight: 1 }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{ fontSize: size * 0.11, color: "var(--c-text-faint)", marginTop: 1, lineHeight: 1 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
