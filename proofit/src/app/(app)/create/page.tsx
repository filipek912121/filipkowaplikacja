import { Crown, LayoutTemplate } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateChallengeForm, type CreateDefaults } from "@/components/challenges/create-challenge-form";
import { DifficultyBadge } from "@/components/ui/badges";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getEntitlements } from "@/lib/services/entitlements";
import { friends as getFriends } from "@/lib/services/social";

export const metadata: Metadata = { title: "Create challenge" };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ template?: string; squad?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const store = getStore();
  const [ent, memberships, friends, mine] = await Promise.all([
    getEntitlements(me.id),
    store.listSquadMembers({ userId: me.id }),
    getFriends(me.id),
    store.listChallenges({ creatorId: me.id }),
  ]);
  const squads = await store.listSquads({ ids: memberships.map((m) => m.squadId) });
  const templates = mine.filter((c) => c.isTemplate && c.creatorId === me.id);

  let defaults: CreateDefaults = {};
  if (sp.template) {
    const t = await store.getChallenge(sp.template.slice(0, 64));
    // Only your own templates or public challenges can be used as a starting point.
    if (t && (t.creatorId === me.id || (t.visibility === "public" && !t.squadId)))
      defaults = { title: t.title, description: t.description, difficulty: t.difficulty, category: t.category, durationDays: t.durationDays, tasks: t.tasks, requiresProof: t.requiresProof };
  }
  if (sp.squad && squads.some((s) => s.id === sp.squad)) defaults.squadId = sp.squad;

  return (
    <>
      <PageHeader eyebrow="Create" title="Design a challenge" subtitle="Set the rules, choose the difficulty and invite your crew." />
      {ent.isPremium ? (
        templates.length > 0 && (
          <section className="mb-6" aria-label="Your templates">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
              <LayoutTemplate className="h-4 w-4" aria-hidden /> Your templates
            </p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {templates.map((t) => (
                <Link key={t.id} href={`/create?template=${t.id}`} className="glass flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm hover:border-line-strong">
                  <DifficultyBadge difficulty={t.difficulty} /> {t.title}
                </Link>
              ))}
            </div>
          </section>
        )
      ) : (
        <Link href="/premium" className="mb-6 flex items-center gap-3 rounded-2xl bg-gold/[0.07] px-4 py-3 text-sm ring-1 ring-gold/20 hover:ring-gold/40">
          <Crown className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          <span className="text-muted">
            <span className="font-semibold text-fg">Premium</span> unlocks reusable templates and more private challenges.
          </span>
        </Link>
      )}
      <CreateChallengeForm
        key={sp.template ?? "new"}
        squads={squads.map((s) => ({ id: s.id, name: s.name }))}
        friends={friends.map((f) => ({ id: f.id, displayName: f.displayName, username: f.username, avatarColor: f.avatarColor }))}
        isPremium={ent.isPremium}
        defaults={defaults}
      />
    </>
  );
}
