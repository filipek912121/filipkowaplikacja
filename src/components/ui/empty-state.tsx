import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function EmptyState({ icon: I, title, text, action, className }: { icon: LucideIcon; title: string; text?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center", className)}>
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet-2 ring-1 ring-violet/25">
        <I className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-display font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
