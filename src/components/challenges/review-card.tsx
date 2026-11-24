"use client";

import { useT } from "@/lib/i18n/client";

import { Check, ExternalLink, X } from "lucide-react";
import { useActionState } from "react";
import { reviewProofAction } from "@/lib/actions/challenges";
import { Avatar } from "@/components/ui/avatar";
import { DifficultyBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/i18n/core";
import type { ActionResult, Difficulty, ProofKind } from "@/lib/types";

export interface ReviewCardData {
  proofId: string;
  kind: ProofKind;
  text: string | null;
  url: string | null;
  fileUrl: string | null;
  createdAt: string;
  day: string | null;
  challenge: { id: string; title: string; difficulty: Difficulty; tasks: string[] };
  submitter: { displayName: string; username: string; avatarColor: string };
}

export function ReviewCard({ d }: { d: ReviewCardData }) {
  const t = useT();
  const toast = useToast();
  // Toast from inside the action: the card unmounts when the refreshed queue no longer contains it.
  const [state, action, pending] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const r = await reviewProofAction(prev, fd);
    toast(r.ok ? { tone: "success", title: r.message ?? "Reviewed" } : { tone: "error", title: r.error });
    return r;
  }, null);
  if (state?.ok) return null;
  return (
    <article className="glass flex flex-col overflow-hidden rounded-2xl">
      {d.fileUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.fileUrl} alt={t("Proof photo from {name}", { name: d.submitter.displayName })} className="max-h-80 w-full bg-black/40 object-contain" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <Avatar name={d.submitter.displayName} color={d.submitter.avatarColor} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{d.submitter.displayName}</p>
            <p className="text-xs text-subtle">
              @{d.submitter.username} · {d.day ?? formatDate(d.createdAt, t.locale)}
            </p>
          </div>
          <DifficultyBadge difficulty={d.challenge.difficulty} />
        </div>
        <p className="mt-3 text-sm font-semibold">{t(d.challenge.title)}</p>
        <ul className="mt-1 text-xs text-muted">
          {d.challenge.tasks.map((task) => (
            <li key={task}>• {t(task)}</li>
          ))}
        </ul>
        {d.text && <blockquote className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm ring-1 ring-line">{d.text}</blockquote>}
        {d.url && (
          <a href={d.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 break-all text-sm text-violet-2 hover:underline">
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden /> {d.url}
          </a>
        )}
        <p className="mt-3 text-xs text-subtle">{t("Judge whether the evidence reasonably shows the daily tasks were done. When unsure, reject with a note.")}</p>
        <form action={action} className="mt-auto space-y-2 pt-4">
          <input type="hidden" name="proofId" value={d.proofId} />
          <label htmlFor={`note-${d.proofId}`} className="sr-only">
            {t("Note for {name}", { name: d.submitter.displayName })}
          </label>
          <Input id={`note-${d.proofId}`} name="note" maxLength={200} placeholder={t("Optional note to the submitter")} />
          <div className="grid grid-cols-2 gap-2">
            <Button name="decision" value="reject" variant="danger" loading={pending} icon={<X className="h-4 w-4" />}>
              {t("Reject")}
            </Button>
            <Button name="decision" value="approve" variant="success" loading={pending} icon={<Check className="h-4 w-4" />}>
              {t("Approve")}
            </Button>
          </div>
        </form>
      </div>
    </article>
  );
}
