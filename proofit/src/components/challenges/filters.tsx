"use client";

import { useT } from "@/lib/i18n/client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/components/ui/cn";
import { inputClass } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { CATEGORIES, CATEGORY_META, DIFFICULTIES, DIFFICULTY_META } from "@/lib/config/taxonomy";

export function ChallengeFilters() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) set("q", q.trim() || null);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const difficulty = params.get("difficulty");
  const category = params.get("category");
  const sort = params.get("sort") ?? "popular";
  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition",
      active ? "bg-white/10 text-fg ring-line-strong" : "text-muted ring-line hover:text-fg hover:ring-line-strong",
    );

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-70")}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
          <label htmlFor="challenge-search" className="sr-only">
            {t("Search challenges")}
          </label>
          <input
            id="challenge-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search challenges…")}
            className={cn(inputClass, "pl-10")}
            maxLength={80}
          />
        </div>
        <label htmlFor="sort" className="sr-only">
          {t("Sort")}
        </label>
        <select id="sort" value={sort} onChange={(e) => set("sort", e.target.value === "popular" ? null : e.target.value)} className="w-32 shrink-0 rounded-xl bg-white/[0.04] px-3 py-3 text-sm text-fg ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-violet/60 sm:w-40">
          <option value="popular">{t("Popular")}</option>
          <option value="new">{t("Newest")}</option>
          <option value="xp">{t("Most XP")}</option>
        </select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("Filter by difficulty")}>
        <button className={chip(!difficulty)} onClick={() => set("difficulty", null)} aria-pressed={!difficulty}>
          {t("All levels")}
        </button>
        {DIFFICULTIES.map((d) => (
          <button key={d} className={cn(chip(difficulty === d), difficulty === d && DIFFICULTY_META[d].text)} onClick={() => set("difficulty", difficulty === d ? null : d)} aria-pressed={difficulty === d}>
            <span className={cn("h-2 w-2 rounded-full", DIFFICULTY_META[d].dot)} aria-hidden />
            {t(DIFFICULTY_META[d].label)}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("Filter by category")}>
        {CATEGORIES.map((c) => (
          <button key={c} className={chip(category === c)} onClick={() => set("category", category === c ? null : c)} aria-pressed={category === c}>
            <Icon name={CATEGORY_META[c].icon} className="h-3.5 w-3.5" />
            {t(CATEGORY_META[c].label)}
          </button>
        ))}
        {(difficulty || category || params.get("q")) && (
          <button
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs text-subtle hover:text-fg"
            onClick={() => {
              setQ("");
              start(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden />{" "}{t("Clear")}
          </button>
        )}
      </div>
    </div>
  );
}
