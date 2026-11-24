"use client";

import { useT } from "@/lib/i18n/client";

import { Swords } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createDuelAction } from "@/lib/actions/social";
import { DUEL_DURATIONS } from "@/lib/config/game";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const selectClass = "w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-violet/60";

export function NewDuelForm({
  opponents,
  challenges,
  defaultChallengeId,
}: {
  opponents: { id: string; label: string; group: "Friends" | "Suggested" }[];
  challenges: { id: string; title: string; durationDays: number }[];
  defaultChallengeId?: string;
}) {
  const t = useT();
  const [state, action] = useActionState(createDuelAction, null);
  const [duration, setDuration] = useState<number>(7);
  const [challengeId, setChallengeId] = useState(defaultChallengeId ?? "");
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const eligible = useMemo(() => challenges.filter((c) => c.durationDays >= duration), [challenges, duration]);

  useEffect(() => {
    if (state?.ok) {
      toast({ tone: "success", title: state.message ?? t("Duel sent") });
      formRef.current?.reset();
    }
  }, [state, toast]);
  useEffect(() => {
    if (challengeId && !eligible.some((c) => c.id === challengeId)) setChallengeId("");
  }, [eligible, challengeId]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Field label={t("Opponent")} htmlFor="opponentId" error={fe?.opponentId}>
        <select id="opponentId" name="opponentId" required className={selectClass} defaultValue="">
          <option value="" disabled>
            {t("Choose who to challenge")}
          </option>
          {(["Friends", "Suggested"] as const).map((g) => {
            const list = opponents.filter((o) => o.group === g);
            return list.length ? (
              <optgroup key={g} label={t(g)}>
                {list.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </select>
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Duration")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {DUEL_DURATIONS.map((d) => (
            <label key={d} className="cursor-pointer">
              <input type="radio" name="durationDays" value={d} checked={duration === d} onChange={() => setDuration(d)} className="peer sr-only" />
              <span className="block rounded-xl py-2.5 text-center text-sm font-semibold ring-1 ring-line transition peer-checked:bg-extreme/15 peer-checked:text-red-200 peer-checked:ring-extreme/40 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-2">
                {t.p(d, "{n} day", "{n} days")}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t("Challenge")} htmlFor="challengeId" error={fe?.challengeId} hint={t("Most approved check-ins during the duel wins.")}>
        <select id="challengeId" name="challengeId" required className={selectClass} value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
          <option value="" disabled>
            {eligible.length ? t("Pick a challenge") : t("No challenge is long enough")}
          </option>
          {eligible.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.title)} ({c.durationDays}d)
            </option>
          ))}
        </select>
      </Field>
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton className="w-full" variant="danger" pendingText={t("Sending…")} icon={<Swords className="h-4 w-4" />}>
        {t("Send duel challenge")}
      </SubmitButton>
    </form>
  );
}
