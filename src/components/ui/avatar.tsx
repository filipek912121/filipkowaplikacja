import { cn } from "./cn";

export function Avatar({
  name,
  color,
  size = 40,
  className,
  ring,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full font-display font-bold text-white", ring && "ring-2 ring-violet-2/60 ring-offset-2 ring-offset-ink", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `radial-gradient(circle at 30% 25%, ${color}ee, ${color}88 60%, ${color}55)`,
        boxShadow: `0 0 0 1px rgb(255 255 255 / .12) inset, 0 6px 20px -6px ${color}aa`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
