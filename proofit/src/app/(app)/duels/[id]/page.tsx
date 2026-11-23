import { ArrowLeft, Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DuelCard } from "@/components/social/duel-card";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { requireUser } from "@/lib/auth";
import { XP_RULES } from "@/lib/config/game";
import { getDuelView } from "@/lib/services/duels";

export const metadata: Metadata = { title: "Duel" };

export default async function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const v = await getDuelView(me.id, id.slice(0, 64));
  if (!v) notFound();
  const d = v.duel;
  const ended = d.status === "completed";
  const winner = d.winnerId === me.id ? v.me : d.winnerId ? v.opponent : null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/duels" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All duels
      </Link>
      <Card glow className="relative overflow-hidden p-6 text-center sm:p-8">
        <span className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-extreme/20 blur-3xl" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-red-300">{d.durationDays}-day duel</p>
        <h1 className="relative mt-2 font-display text-2xl font-bold">{v.challenge?.title}</h1>
        <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {[v.me, v.opponent].map((p, i) => (
            <div key={p.id} className={cn("flex flex-col items-center gap-2", i === 1 && "order-3")}>
              <div className="relative">
                <Avatar name={p.displayName} color={p.avatarColor} size={72} ring={winner?.id === p.id} />
                {winner?.id === p.id && <Crown className="absolute -top-5 left-1/2 h-7 w-7 -translate-x-1/2 text-gold drop-shadow-[0_0_10px_#fbbf24]" aria-label="Winner" />}
              </div>
              <p className="text-sm font-semibold">{i === 0 ? "You" : p.displayName}</p>
              <p className="font-display text-5xl font-bold tabular-nums">{i === 0 ? v.myScore : v.theirScore}</p>
              <p className="text-xs text-subtle">check-ins</p>
            </div>
          ))}
          <span className="order-2 font-display text-xl font-bold text-subtle">VS</span>
        </div>
        {ended && (
          <p className="relative mt-8 font-display text-xl font-bold">
            {d.isDraw ? "It's a draw 🤝" : winner?.id === me.id ? <span className="text-gold">You won! +{XP_RULES.duelWinBonus} XP</span> : `${v.opponent.displayName} won this one`}
          </p>
        )}
        {d.status === "active" && v.challenge && (
          <LinkButton href={`/challenges/${v.challenge.id}#checkin`} className="relative mt-8">
            Check in to score
          </LinkButton>
        )}
      </Card>
      <DuelCard v={v} />
    </div>
  );
}
