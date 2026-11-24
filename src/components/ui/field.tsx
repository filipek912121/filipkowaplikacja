import type { ComponentProps } from "react";
import { cn } from "./cn";

export const inputClass =
  "w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-fg ring-1 ring-line placeholder:text-subtle transition focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet/60 aria-[invalid=true]:ring-extreme/60";

export function Field({ label, error, hint, htmlFor, children, className }: { label: string; error?: string; hint?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg/90">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-300" role="alert" id={htmlFor ? `${htmlFor}-error` : undefined}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={cn(inputClass, className)} aria-invalid={invalid || undefined} aria-describedby={invalid && rest.id ? `${rest.id}-error` : undefined} {...rest} />;
}

export function Textarea({ className, invalid, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cn(inputClass, "min-h-24 resize-y", className)} aria-invalid={invalid || undefined} aria-describedby={invalid && rest.id ? `${rest.id}-error` : undefined} {...rest} />;
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: React.ReactNode }) {
  const tones = {
    error: "bg-extreme/10 text-red-200 ring-extreme/30",
    success: "bg-easy/10 text-green-200 ring-easy/30",
    info: "bg-electric/10 text-blue-200 ring-electric/30",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl px-4 py-3 text-sm ring-1", tones[tone])}>
      {children}
    </div>
  );
}
