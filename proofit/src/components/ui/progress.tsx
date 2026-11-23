import { cn } from "./cn";

export function ProgressBar({ value, className, tone = "brand", label }: { value: number; className?: string; tone?: "brand" | "easy" | "medium" | "hard" | "extreme" | "gold"; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fills = {
    brand: "bg-gradient-to-r from-violet via-indigo-500 to-electric",
    easy: "bg-easy",
    medium: "bg-medium",
    hard: "bg-hard",
    extreme: "bg-extreme",
    gold: "bg-gradient-to-r from-amber-300 to-yellow-500",
  };
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fills[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 120, stroke = 10, children, label }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid shrink-0 place-items-center rounded-full shadow-[0_0_40px_-12px_rgb(139_92_246/0.8)]" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(pct * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
