import { getT } from "@/lib/i18n/server";
import { Crown, Handshake } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/badges";
import { cn } from "@/components/ui/cn";
import { cancelDuelAction, respondDuelAction } from "@/lib/actions/social";
import { daysLeft } from "@/lib/engine/dates";
import type { DuelView } from "@/lib/services/duels";

export async function DuelCard({ v }: { v: DuelView }) {
  const t = await getT();
  const { duel: d } = v;
  const total = Math.max(1, v.myScore + v.theirScore);
  const won = d.status === "completed" && d.winnerId === v.me.id;
  const lost = d.status === "completed" && d.winnerId && d.winnerId !== v.me.id;
  return (
    <div className={cn("glass rounded-2xl p-5", won && "ring-1 ring-gold/40")}>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/duels/${d.id}`} className="min-w-0 hover:underline">
          <p className="truncate text-sm font-semibold">{v.challenge ? t(v.challenge.title) : t("Challenge")}</p>
        </Link>
        {d.status === "active" && <Pill tone="red">{t("Live · {n}d left", { n: daysLeft(d.endsAt!) })}</Pill>}
        {d.status === "pending" && <Pill tone="blue">{v.iAmChallenger ? t("Waiting for reply") : t("Your move")}</Pill>}
        {d.status === "completed" && (won ? <Pill tone="gold">{t("Victory")}</Pill> : lost ? <Pill>{t("Defeat")}</Pill> : <Pill tone="violet">{t("Draw")}</Pill>)}
        {(d.status === "declined" || d.status === "cancelled") && <Pill>{t(d.status === "declined" ? "Declined" : "Cancelled")}</Pill>}
      </div>
      <Link href={`/duels/${d.id}`} className="mt-4 flex items-center gap-3" aria-label={t("Open duel")}>
        <div className="flex flex-1 items-center gap-2">
          <Avatar name={v.me.displayName} color={v.me.avatarColor} size={36} />
          <span className="truncate text-sm">{t("You")}</span>
          {won && <Crown className="h-4 w-4 text-gold" aria-label={t("Winner")} />}
        </div>
        <span className="font-display text-2xl font-bold tabular-nums">
          {v.myScore}
          <span className="mx-1.5 text-subtle">:</span>
          {v.theirScore}
        </span>
        <div className="flex flex-1 items-center justify-end gap-2">
          {lost && <Crown className="h-4 w-4 text-gold" aria-label={t("Winner")} />}
          <span className="truncate text-right text-sm">{v.opponent.displayName}</span>
          <Avatar name={v.opponent.displayName} color={v.opponent.avatarColor} size={36} />
        </div>
      </Link>
      {(d.status === "active" || d.status === "completed") && (
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/5" aria-hidden>
          <div className="bg-gradient-to-r from-violet to-electric transition-all" style={{ width: `${(v.myScore / total) * 100}%` }} />
          <div className="flex-1 bg-extreme/50" />
        </div>
      )}
      {d.status === "pending" && (
        <div className="mt-4 flex gap-2">
          {v.iAmChallenger ? (
            <ActionButton size="sm" variant="ghost" action={cancelDuelAction.bind(null, d.id)} confirm={t("Cancel this duel?")}>
              {t("Cancel")}
            </ActionButton>
          ) : (
            <>
              <ActionButton size="sm" action={respondDuelAction.bind(null, d.id, true)} icon={<Handshake className="h-4 w-4" />}>
                {t("Accept")}
              </ActionButton>
              <ActionButton size="sm" variant="ghost" action={respondDuelAction.bind(null, d.id, false)}>
                {t("Decline")}
              </ActionButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
