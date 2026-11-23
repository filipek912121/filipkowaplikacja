import { Swords } from "lucide-react";
import type { Metadata } from "next";
import { DuelCard } from "@/components/social/duel-card";
import { NewDuelForm } from "@/components/social/new-duel-form";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { exploreChallenges } from "@/lib/services/challenges";
import { listDuels } from "@/lib/services/duels";
import { friends, leaderboard } from "@/lib/services/social";

export const metadata: Metadata = { title: "Duels" };

export default async function DuelsPage({ searchParams }: { searchParams: Promise<{ challenge?: string }> }) {
  const me = await requireUser();
  const { challenge } = await searchParams;
  const [duels, myFriends, top, challenges] = await Promise.all([listDuels(me.id), friends(me.id), leaderboard(me.id, "global", "week"), exploreChallenges(me.id, {})]);
  const friendIds = new Set(myFriends.map((f) => f.id));
  const opponents = [
    ...myFriends.map((f) => ({ id: f.id, label: `${f.displayName} (@${f.username})`, group: "Friends" as const })),
    ...top.filter((r) => !r.isMe && !friendIds.has(r.profile.id)).slice(0, 10).map((r) => ({ id: r.profile.id, label: `${r.profile.displayName} (@${r.profile.username})`, group: "Suggested" as const })),
  ];
  // Duels are visible to both players, so only public, non-squad challenges qualify.
  const duelable = challenges.filter((c) => c.visibility === "public" && !c.squadId && !c.isTemplate);
  const validDefault = challenge && (await getStore().getChallenge(challenge.slice(0, 64)))?.visibility === "public" ? challenge : undefined;

  const pending = duels.filter((v) => v.duel.status === "pending");
  const active = duels.filter((v) => v.duel.status === "active");
  const done = duels.filter((v) => !["pending", "active"].includes(v.duel.status));
  const wins = duels.filter((v) => v.duel.winnerId === me.id).length;

  return (
    <>
      <PageHeader eyebrow="Duels" title="Head-to-head" subtitle={`Challenge someone directly. Winner takes bonus XP. Your record: ${wins} win${wins === 1 ? "" : "s"}.`} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <SectionTitle title="Live" />
            {active.length ? <div className="grid gap-3 sm:grid-cols-2">{active.map((v) => <DuelCard key={v.duel.id} v={v} />)}</div> : <EmptyState icon={Swords} title="No live duels" text="Send a challenge — it goes live when they accept." />}
          </section>
          {pending.length > 0 && (
            <section>
              <SectionTitle title="Pending" />
              <div className="grid gap-3 sm:grid-cols-2">{pending.map((v) => <DuelCard key={v.duel.id} v={v} />)}</div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <SectionTitle title="History" />
              <div className="grid gap-3 sm:grid-cols-2">{done.map((v) => <DuelCard key={v.duel.id} v={v} />)}</div>
            </section>
          )}
        </div>
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Card glow className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Swords className="h-5 w-5 text-extreme" aria-hidden /> New duel
            </h2>
            <NewDuelForm opponents={opponents} challenges={duelable.map((c) => ({ id: c.id, title: c.title, durationDays: c.durationDays }))} defaultChallengeId={validDefault} />
          </Card>
        </aside>
      </div>
    </>
  );
}
