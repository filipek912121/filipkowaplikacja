import { Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { ChallengeFilters } from "@/components/challenges/filters";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { isCategory, isDifficulty } from "@/lib/config/taxonomy";
import { exploreChallenges } from "@/lib/services/challenges";

export const metadata: Metadata = { title: "Explore challenges" };

type SP = Promise<{ q?: string; difficulty?: string; category?: string; sort?: string }>;

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
  const me = await requireUser();
  const sp = await searchParams;
  const list = await exploreChallenges(me.id, {
    q: sp.q?.slice(0, 80),
    difficulty: isDifficulty(sp.difficulty) ? sp.difficulty : undefined,
    category: isCategory(sp.category) ? sp.category : undefined,
    sort: sp.sort === "new" || sp.sort === "xp" ? sp.sort : "popular",
  });
  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Find your next challenge"
        subtitle="Daily sprints, weekly habits and monthly missions. Join one and start today."
        action={
          <LinkButton href="/create" variant="secondary" icon={<Plus className="h-4 w-4" />}>
            Create
          </LinkButton>
        }
      />
      <Suspense fallback={<div className="skeleton h-28 rounded-2xl" />}>
        <ChallengeFilters />
      </Suspense>
      <p className="mb-4 mt-6 text-sm text-muted" aria-live="polite">
        {list.length} challenge{list.length === 1 ? "" : "s"}
      </p>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => (
            <ChallengeCard key={c.id} c={c} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState icon={SearchX} title="No challenges match" text="Try another filter — or create exactly the challenge you're looking for." action={<LinkButton href="/create">Create a challenge</LinkButton>} />
      )}
    </>
  );
}
