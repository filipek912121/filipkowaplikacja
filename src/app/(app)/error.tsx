"use client";

import { useT } from "@/lib/i18n/client";

import { TriangleExclamationPoint } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-extreme/10 text-extreme ring-1 ring-extreme/30">
        <TriangleExclamationPoint className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="font-display text-2xl font-bold">{t("Something broke")}</h1>
      <p className="mt-2 text-muted">{t("We couldn't load this page. Your progress is safe.")}</p>
      {error.digest && <p className="mt-2 text-xs text-subtle">Error ref: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        {t("Try again")}
      </Button>
    </div>
  );
}
