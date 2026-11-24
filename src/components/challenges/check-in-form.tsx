"use client";

import { useT } from "@/lib/i18n/client";

import { Camera, Check, CircleCheck, Flame, Hourglass, ImagePlus, Link2, PartyPopper, FileText, Sparkles, Trophy, X, Zap } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { checkInAction } from "@/lib/actions/challenges";
import { LIMITS } from "@/lib/config/game";
import type { ProofKind } from "@/lib/types";
import { cn } from "@/components/ui/cn";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

export function CheckInForm({
  challengeId,
  tasks,
  requiresProof,
  today,
}: {
  challengeId: string;
  tasks: string[];
  requiresProof: boolean;
  /** Today's existing check-in, if any (from the server). */
  today: { status: "approved" | "pending"; xp: number } | null;
}) {
  const t = useT();
  // Kept mounted across the post-action refresh so the result celebration stays visible.
  const [state, action] = useActionState(checkInAction, null);
  const [done, setDone] = useState<string[]>([]);
  const [kind, setKind] = useState<ProofKind>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state && !state.ok) toast({ tone: "error", title: state.error });
  }, [state, toast]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  if (state?.ok && state.data) return <CheckInResultView r={state.data} />;
  if (today) return <TodayStatus status={today.status} xp={today.xp} />;

  const allDone = tasks.every((task) => done.includes(task));
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="challengeId" value={challengeId} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Today's tasks")}</legend>
        <ul className="space-y-2">
          {tasks.map((task) => {
            const checked = done.includes(task);
            return (
              <li key={task}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 ring-1 transition",
                    checked ? "bg-easy/10 ring-easy/35" : "bg-white/[0.03] ring-line hover:ring-line-strong",
                  )}
                >
                  <input
                    type="checkbox"
                    name="tasksDone"
                    value={task}
                    checked={checked}
                    onChange={(e) => setDone((d) => (e.target.checked ? [...d, task] : d.filter((x) => x !== task)))}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 transition peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2",
                      checked ? "bg-easy text-black ring-easy" : "ring-line-strong",
                    )}
                    aria-hidden
                  >
                    {checked && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className={cn("text-sm", checked && "text-fg/70 line-through decoration-easy/60")}>{t(task)}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {fe?.tasks && <p className="mt-2 text-xs text-red-300">{fe.tasks}</p>}
      </fieldset>

      {requiresProof && (
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">
            {t("Proof")}{" "}<span className="font-normal text-muted">{t("— reviewed before XP is awarded")}</span>
          </legend>
          <input type="hidden" name="proofKind" value={kind} />
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("Proof type")}>
            {([
              ["photo", "Photo", Camera],
              ["link", "Link", Link2],
              ["text", "Describe", FileText],
            ] as const).map(([k, label, I]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ring-1 transition",
                  kind === k ? "bg-violet/15 text-fg ring-violet/50" : "text-muted ring-line hover:text-fg",
                )}
              >
                <I className="h-4 w-4" aria-hidden /> {t(label)}
              </button>
            ))}
          </div>

          {kind === "photo" && (
            <div>
              <label
                htmlFor="proofFile"
                className={cn(
                  "group relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition",
                  preview ? "border-violet/40" : "border-line-strong hover:border-violet/50 hover:bg-violet/5",
                )}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt={t("Selected proof preview")} className="max-h-72 w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus className="mb-2 h-8 w-8 text-violet-2" aria-hidden />
                    <span className="text-sm font-medium">{t("Tap to take or upload a photo")}</span>
                    <span className="mt-1 text-xs text-subtle">{t("JPG, PNG, WEBP or HEIC · max 5 MB")}</span>
                  </>
                )}
              </label>
              <input
                ref={fileRef}
                id="proofFile"
                name="proofFile"
                type="file"
                accept={LIMITS.proofMimeTypes.join(",")}
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFileError(null);
                  if (!f) return setPreview(null);
                  if (f.size > LIMITS.proofMaxBytes) {
                    setFileError(t("That photo is over 5 MB. Choose a smaller one."));
                    e.target.value = "";
                    return setPreview(null);
                  }
                  setPreview(URL.createObjectURL(f));
                }}
              />
              {preview && (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
                  onClick={() => {
                    if (fileRef.current) fileRef.current.value = "";
                    setPreview(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />{" "}{t("Remove photo")}
                </button>
              )}
              {(fileError || fe?.proof) && <p className="mt-2 text-xs text-red-300">{fileError ?? fe?.proof}</p>}
            </div>
          )}
          {kind === "link" && (
            <Field label={t("Link to your proof")} htmlFor="proofUrl" error={fe?.proofUrl ?? fe?.proof} hint={t("e.g. a Strava activity or a shared screenshot (https only)")}>
              <Input id="proofUrl" name="proofUrl" type="url" inputMode="url" placeholder="https://" invalid={Boolean(fe?.proofUrl)} required />
            </Field>
          )}
          <Field label={kind === "text" ? t("What did you do?") : t("Caption (optional)")} htmlFor="proofText" error={kind === "text" ? fe?.proof : undefined}>
            <Textarea id="proofText" name="proofText" maxLength={LIMITS.noteMax} placeholder={kind === "text" ? t("Describe what you did in detail…") : t("Add context for the reviewer")} required={kind === "text"} minLength={kind === "text" ? 10 : undefined} />
          </Field>
          <p className="text-xs text-subtle">{t("Proof is reviewed by the challenge creator or verified finishers. Uploading a photo doesn't automatically count as completion.")}
          </p>
        </fieldset>
      )}

      <Field label={t("Note (optional)")} htmlFor="note">
        <Input id="note" name="note" maxLength={LIMITS.noteMax} placeholder={t("How did it go?")} />
      </Field>

      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton size="lg" className="h-auto min-h-13 w-full whitespace-normal py-3 text-center" disabled={!allDone} pendingText={requiresProof ? t("Uploading proof…") : t("Checking in…")} icon={<CircleCheck className="h-5 w-5" />}>
        {allDone ? (requiresProof ? t("Submit for verification") : t("Complete today’s check-in")) : t.p(tasks.length, "Tick {n} task to continue", "Tick all {n} tasks to continue")}
      </SubmitButton>
    </form>
  );
}

function TodayStatus({ status, xp }: { status: "approved" | "pending"; xp: number }) {
  const t = useT();
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-4 ring-1", status === "pending" ? "bg-electric/10 ring-electric/30" : "bg-easy/10 ring-easy/30")} role="status">
      {status === "pending" ? <Hourglass className="h-6 w-6 shrink-0 text-blue-300" aria-hidden /> : <CircleCheck className="h-6 w-6 shrink-0 text-easy" aria-hidden />}
      <div>
        <p className="font-semibold">{status === "pending" ? t("Proof pending verification") : t("Checked in today · +{n} XP", { n: xp })}</p>
        <p className="text-sm text-muted">{status === "pending" ? t("XP is added once a reviewer approves it.") : t("Come back tomorrow to keep your streak.")}</p>
      </div>
    </div>
  );
}

function CheckInResultView({ r }: { r: import("@/lib/services/challenges").CheckInResult }) {
  const t = useT();
  if (r.status === "pending")
    return (
      <div className="rounded-2xl bg-electric/10 p-6 text-center ring-1 ring-electric/30 animate-pop" role="status">
        <Hourglass className="mx-auto mb-3 h-10 w-10 text-blue-300" aria-hidden />
        <p className="font-display text-xl font-bold">{t("Proof submitted")}</p>
        <p className="mt-1 text-sm text-muted">{t("Pending verification. XP is awarded once a reviewer approves it.")}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-300">
          <Flame className="h-4 w-4" aria-hidden /> {t("Streak")}: {t.p(r.streak, "{n} day", "{n} days")}
        </p>
      </div>
    );
  const total = r.xp + r.streakBonus + r.completionBonus;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet/25 via-indigo-500/10 to-electric/15 p-6 text-center ring-1 ring-violet/40 animate-pop" role="status">
      <PartyPopper className="mx-auto mb-2 h-10 w-10 text-violet-2" aria-hidden />
      <p className="font-display text-4xl font-bold text-gradient">+{total} XP</p>
      <p className="mt-1 text-sm text-muted">{t("Check-in complete. See you tomorrow.")}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5" aria-hidden /> {t("{n} base", { n: r.xp })}
        </span>
        {r.streakBonus > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-hard/15 px-3 py-1.5 text-orange-300">
            <Flame className="h-3.5 w-3.5" aria-hidden /> {t("+{n} streak ({d}d)", { n: r.streakBonus, d: r.streak })}
          </span>
        )}
        {r.completionBonus > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-easy/15 px-3 py-1.5 text-green-300">
            <Trophy className="h-3.5 w-3.5" aria-hidden /> {t("+{n} finish bonus", { n: r.completionBonus })}
          </span>
        )}
      </div>
      {r.challengeCompleted && <p className="mt-4 font-semibold text-green-300">{t("Challenge completed! 🎉")}</p>}
      {r.levelUp && <p className="mt-2 font-display text-lg font-bold text-gold">{t("Level up → Level {n}", { n: r.levelUp })}</p>}
      {r.achievements.length > 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-violet-2">
          <Sparkles className="h-4 w-4" aria-hidden /> Unlocked: {r.achievements.join(", ")}
        </p>
      )}
      {r.capped && <p className="mt-3 text-xs text-subtle">{t("Daily XP cap reached — keep it up tomorrow.")}</p>}
    </div>
  );
}
