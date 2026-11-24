"use client";

import { useId } from "react";
import { cn } from "@/components/ui/cn";

/** PROOFIT mark: a shield-hexagon (commitment) holding a rising check (proof). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  // Unique gradient ids: several logos can be on a page (one may sit in a hidden sidebar).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g1 = `pf-g1-${uid}`;
  const g2 = `pf-g2-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={g1} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" />
          <stop offset="0.45" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={g2} x1="11" y1="27" x2="31" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.8 35.2 11.6v16.8L20 37.2 4.8 28.4V11.6L20 2.8Z"
        fill={`url(#${g1})`}
        fillOpacity="0.16"
        stroke={`url(#${g1})`}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M12.5 20.5 18 26l11-12.5" stroke={`url(#${g2})`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 13.5h4.5V18" stroke={`url(#${g2})`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, size = 30, showWordmark = true }: { className?: string; size?: number; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} className="drop-shadow-[0_0_12px_rgb(139_92_246/0.55)]" />
      {showWordmark && (
        <span className="font-display text-[1.15rem] font-bold tracking-[0.14em]">
          PROOF<span className="text-gradient">IT</span>
        </span>
      )}
    </span>
  );
}
