import { CircleCheck, Hourglass, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard } from "@/components/challenges/review-card";
import { Pill } from "@/components/ui/badges";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { myProofs, reviewQueue } from "@/lib/services/challenges";

export const metadata: Metadata = { title: "Verify proofs" };

export default async function ReviewPage() {
  const me = await requireUser();
  const [queue, mine] = await Promise.all([reviewQueue(me.id), myProofs(me.id)]);
  return (
    <>
      <PageHeader
        eyebrow="Verification"
        title="Verify proofs"
        subtitle="Creators review proofs for their challenges. Official challenges are reviewed by people who have completed them. Nobody can approve their own."
      />
      <section className="mb-10">
        <SectionTitle title={`Waiting for you (${queue.length})`} />
        {queue.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {queue.map((q) => (
              <ReviewCard
                key={q.proof.id}
                d={{
                  proofId: q.proof.id,
                  kind: q.proof.kind,
                  text: q.proof.text,
                  url: q.proof.url,
                  fileUrl: q.fileUrl,
                  createdAt: q.proof.createdAt,
                  day: q.completion?.day ?? null,
                  challenge: { id: q.challenge.id, title: q.challenge.title, difficulty: q.challenge.difficulty, tasks: q.challenge.tasks },
                  submitter: { displayName: q.submitter.displayName, username: q.submitter.username, avatarColor: q.submitter.avatarColor },
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={ShieldCheck} title="All caught up" text="No proofs need your review right now." />
        )}
      </section>
      <section>
        <SectionTitle title="Your submissions" />
        {mine.length ? (
          <Card className="divide-y divide-line">
            {mine.map(({ proof, challenge }) => (
              <div key={proof.id} className="flex items-center gap-3 px-4 py-3">
                {proof.status === "approved" ? (
                  <CircleCheck className="h-5 w-5 shrink-0 text-easy" aria-hidden />
                ) : proof.status === "rejected" ? (
                  <X className="h-5 w-5 shrink-0 text-extreme" aria-hidden />
                ) : (
                  <Hourglass className="h-5 w-5 shrink-0 text-blue-300" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  {challenge ? (
                    <Link href={`/challenges/${challenge.id}`} className="block truncate text-sm font-semibold hover:underline">
                      {challenge.title}
                    </Link>
                  ) : (
                    <span className="text-sm">Challenge</span>
                  )}
                  <p className="truncate text-xs text-subtle">
                    {new Date(proof.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {proof.kind}
                    {proof.reviewNote ? ` · “${proof.reviewNote}”` : ""}
                  </p>
                </div>
                <Pill tone={proof.status === "approved" ? "green" : proof.status === "rejected" ? "red" : "blue"}>
                  {proof.status === "pending" ? "Pending verification" : proof.status === "approved" ? "Approved" : "Rejected"}
                </Pill>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-muted">You haven&apos;t submitted any proof yet.</p>
        )}
      </section>
    </>
  );
}
