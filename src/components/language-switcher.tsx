"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/lib/actions/locale";
import { useT } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n/core";
import { cn } from "@/components/ui/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-line", pending && "opacity-60", className)} role="group" aria-label={t("Language")}>
      <Languages className="ml-1.5 h-4 w-4 text-subtle" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={t.locale === l}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setLocaleAction(l);
              router.refresh();
            })
          }
          className={cn("rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition", t.locale === l ? "bg-white/10 text-fg" : "text-subtle hover:text-fg")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
