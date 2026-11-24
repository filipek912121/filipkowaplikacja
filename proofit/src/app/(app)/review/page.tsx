import { formatDate, formatNumber } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";
import { CircleCheck, Hourglass, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard } from "@/components/challenges/review-card";
import { Pill } from "@/components/ui/badges";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { myProofs, reviewQueue } from "@/lib/services/challenges";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Verify proofs") };
}

export default async function ReviewPage() {
  const t = await getT();
  const me = await requireUser();
  const [queue, mine] = await Promise.all([reviewQueue(me.id), myProofs(me.id)]);
  return (
    <>
      <PageHeader
        eyebrow={t("Verification")}
        title={t("Verify proofs")}
        subtitle={t("Creators review proofs for their challenges. Official challenges are reviewed by people who have completed them. Nobody can approve their own.")}
      />
      <section className="mb-10">
        <SectionTitle title={`${t("Waiting for you")} (${queue.length})`} />
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
          <EmptyState icon={ShieldCheck} title={t("All caught up")} text={t("No proofs need your review right now.")} />
        )}
      </section>
      <section>
        <SectionTitle title={t("Your submissions")} />
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
                      {t(challenge.title)}
                    </Link>
                  ) : (
                    <span className="text-sm">{t("Challenge")}</span>
                  )}
                  <p className="truncate text-xs text-subtle">
                    {formatDate(proof.createdAt, t.locale)} · {t(proof.kind === "photo" ? "Photo" : proof.kind === "link" ? "Link" : "Description")}
                    {proof.reviewNote ? ` · “${proof.reviewNote}”` : ""}
                  </p>
                </div>
                <Pill tone={proof.status === "approved" ? "green" : proof.status === "rejected" ? "red" : "blue"}>
                  {t(proof.status === "pending" ? "Pending verification" : proof.status === "approved" ? "Approved" : "Rejected")}
                </Pill>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-muted">{t("You haven't submitted any proof yet.")}</p>
        )}
      </section>
    </>
  );
}
