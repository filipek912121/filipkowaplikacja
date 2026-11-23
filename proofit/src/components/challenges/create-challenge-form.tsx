"use client";

import { Camera, Crown, Globe, Lock, Minus, Plus, Rocket, Users } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createChallengeAction } from "@/lib/actions/challenges";
import { DURATION_OPTIONS, LIMITS, XP_RULES } from "@/lib/config/game";
import { CATEGORIES, CATEGORY_META, DIFFICULTIES, DIFFICULTY_META } from "@/lib/config/taxonomy";
import type { Category, Difficulty } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { SubmitButton } from "@/components/ui/submit-button";

export interface CreateDefaults {
  title?: string;
  description?: string;
  difficulty?: Difficulty;
  category?: Category;
  durationDays?: number;
  tasks?: string[];
  requiresProof?: boolean;
  squadId?: string;
}

function Toggle({ name, label, hint, defaultChecked, disabled, icon }: { name: string; label: string; hint?: string; defaultChecked?: boolean; disabled?: boolean; icon?: React.ReactNode }) {
  return (
    <label className={cn("flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-line", disabled ? "opacity-60" : "cursor-pointer hover:ring-line-strong")}>
      {icon}
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-subtle">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-white/10 transition peer-checked:bg-violet peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden />
    </label>
  );
}

export function CreateChallengeForm({
  squads,
  friends,
  isPremium,
  defaults = {},
}: {
  squads: { id: string; name: string }[];
  friends: { id: string; displayName: string; username: string; avatarColor: string }[];
  isPremium: boolean;
  defaults?: CreateDefaults;
}) {
  const [state, action] = useActionState(createChallengeAction, null);
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty ?? "medium");
  const [xp, setXp] = useState<number>(() => {
    const r = XP_RULES.difficultyRange[defaults.difficulty ?? "medium"];
    return Math.round((r.min + r.max) / 2);
  });
  const [tasks, setTasks] = useState<string[]>(defaults.tasks?.length ? defaults.tasks : [""]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [squadId, setSquadId] = useState(defaults.squadId ?? "");
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const range = XP_RULES.difficultyRange[difficulty];

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-6">
        <section className="glass space-y-4 rounded-2xl p-5 sm:p-6">
          <Field label="Challenge title" htmlFor="title" error={fe?.title}>
            <Input id="title" name="title" required minLength={LIMITS.titleMin} maxLength={LIMITS.titleMax} defaultValue={defaults.title} placeholder="e.g. Read 20 pages every day" invalid={Boolean(fe?.title)} />
          </Field>
          <Field label="Description" htmlFor="description" error={fe?.description} hint="Explain the rules. Keep it challenging — but safe.">
            <Textarea id="description" name="description" required maxLength={LIMITS.descriptionMax} defaultValue={defaults.description} placeholder="What counts, what doesn't, and why it matters." invalid={Boolean(fe?.description)} />
          </Field>
        </section>

        <section className="glass rounded-2xl p-5 sm:p-6">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Difficulty</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIFFICULTIES.map((d) => {
                const m = DIFFICULTY_META[d];
                const r = XP_RULES.difficultyRange[d];
                return (
                  <label key={d} className={cn("cursor-pointer rounded-xl p-3 ring-1 transition", difficulty === d ? cn(m.bg, m.ring, "ring-2") : "bg-white/[0.03] ring-line hover:ring-line-strong")}>
                    <input
                      type="radio"
                      name="difficulty"
                      value={d}
                      checked={difficulty === d}
                      onChange={() => {
                        setDifficulty(d);
                        setXp(Math.round((r.min + r.max) / 2));
                      }}
                      className="sr-only"
                    />
                    <span className={cn("flex items-center gap-1.5 text-sm font-bold", m.text)}>
                      <span className={cn("h-2 w-2 rounded-full", m.dot)} aria-hidden />
                      {m.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {r.min}–{r.max} XP
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-4">
            <label htmlFor="xpReward" className="flex items-center justify-between text-sm">
              <span className="font-medium">XP per check-in</span>
              <span className={cn("font-display text-lg font-bold", DIFFICULTY_META[difficulty].text)}>{xp} XP</span>
            </label>
            <input id="xpReward" name="xpReward" type="range" min={range.min} max={range.max} value={xp} onChange={(e) => setXp(Number(e.target.value))} className="mt-2 w-full accent-violet" />
            <p className="text-xs text-subtle">Capped by difficulty so every challenge stays fair.</p>
          </div>
        </section>

        <section className="glass space-y-5 rounded-2xl p-5 sm:p-6">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Category</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c, i) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="category" value={c} defaultChecked={defaults.category ? defaults.category === c : i === 0} className="peer sr-only" />
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-muted ring-1 ring-line transition peer-checked:bg-violet/15 peer-checked:text-fg peer-checked:ring-violet/50 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2 hover:text-fg">
                    <Icon name={CATEGORY_META[c].icon} className="h-4 w-4" />
                    {CATEGORY_META[c].label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Duration</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DURATION_OPTIONS.map((d) => (
                <label key={d.days} className="cursor-pointer">
                  <input type="radio" name="durationDays" value={d.days} defaultChecked={(defaults.durationDays ?? 7) === d.days} className="peer sr-only" />
                  <span className="block rounded-xl bg-white/[0.03] p-3 text-center ring-1 ring-line transition peer-checked:bg-electric/15 peer-checked:ring-electric/50 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2">
                    <span className="block text-sm font-semibold">{d.label}</span>
                    <span className="block text-xs text-muted">{d.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {fe?.durationDays && <p className="mt-2 text-xs text-red-300">{fe.durationDays}</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Daily tasks</legend>
            <p className="mb-3 text-xs text-subtle">Participants tick every task to check in each day.</p>
            <ul className="space-y-2">
              {tasks.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <label htmlFor={`task-${i}`} className="sr-only">
                    Task {i + 1}
                  </label>
                  <Input id={`task-${i}`} name="tasks" value={t} maxLength={LIMITS.taskMax} onChange={(e) => setTasks((ts) => ts.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "e.g. Read 20 pages" : "Another task"} invalid={Boolean(fe?.[`tasks.${i}`])} />
                  {tasks.length > 1 && (
                    <button type="button" onClick={() => setTasks((ts) => ts.filter((_, j) => j !== i))} className="grid w-11 shrink-0 place-items-center rounded-xl text-muted ring-1 ring-line hover:text-fg" aria-label={`Remove task ${i + 1}`}>
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {(fe?.tasks || Object.keys(fe ?? {}).some((k) => k.startsWith("tasks."))) && (
              <p className="mt-2 text-xs text-red-300">{fe?.tasks ?? Object.entries(fe ?? {}).find(([k]) => k.startsWith("tasks."))?.[1]}</p>
            )}
            {tasks.length < LIMITS.maxTasks && (
              <button type="button" onClick={() => setTasks((ts) => [...ts, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-2 hover:text-fg">
                <Plus className="h-4 w-4" aria-hidden /> Add task
              </button>
            )}
          </fieldset>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <section className="glass space-y-3 rounded-2xl p-5">
          <p className="text-sm font-medium">Visibility</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["public", "Public", Globe],
              ["private", "Private", Lock],
            ] as const).map(([v, label, I]) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} disabled={Boolean(squadId)} className="peer sr-only" />
                <span className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm ring-1 ring-line transition peer-checked:bg-violet/15 peer-checked:ring-violet/50 peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2">
                  <I className="h-4 w-4" aria-hidden /> {label}
                </span>
              </label>
            ))}
          </div>
          {squads.length > 0 && (
            <Field label="Squad challenge (optional)" htmlFor="squadId" hint="Only squad members can see and join it.">
              <select id="squadId" name="squadId" value={squadId} onChange={(e) => setSquadId(e.target.value)} className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-violet/60">
                <option value="">No squad</option>
                {squads.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Toggle name="requiresProof" label="Require proof" hint="Check-ins need a photo, link or description and are verified by you" defaultChecked={defaults.requiresProof} icon={<Camera className="h-4 w-4 text-muted" aria-hidden />} />
          <Toggle name="joinNow" label="Join it myself" hint="Start today" defaultChecked icon={<Rocket className="h-4 w-4 text-muted" aria-hidden />} />
          <Toggle
            name="isTemplate"
            label="Save as template"
            hint={isPremium ? "Reuse it later — templates aren't joinable" : "Premium feature"}
            disabled={!isPremium}
            icon={<Crown className={cn("h-4 w-4", isPremium ? "text-gold" : "text-subtle")} aria-hidden />}
          />
        </section>

        <section className="glass rounded-2xl p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted" aria-hidden /> Invite friends
          </p>
          {friends.length ? (
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {friends.map((f) => (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/5">
                    <input type="checkbox" name="invite" value={f.id} className="h-4 w-4 accent-violet" />
                    <Avatar name={f.displayName} color={f.avatarColor} size={28} />
                    <span className="min-w-0 text-sm">
                      <span className="block truncate">{f.displayName}</span>
                      <span className="block truncate text-xs text-subtle">@{f.username}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Follow people from the{" "}
              <Link href="/leaderboard" className="text-violet-2 underline-offset-2 hover:underline">
                rankings
              </Link>{" "}
              to invite them.
            </p>
          )}
        </section>

        {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
        <SubmitButton size="lg" className="w-full" pendingText="Creating…" icon={<Rocket className="h-5 w-5" />}>
          Launch challenge
        </SubmitButton>
      </aside>
    </form>
  );
}
