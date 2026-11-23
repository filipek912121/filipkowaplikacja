import { Bell, Swords, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/ui/action-button";
import { Card, SectionTitle } from "@/components/ui/card";
import { respondDuelAction, respondInviteAction } from "@/lib/actions/social";
import type { DuelView } from "@/lib/services/duels";
import type { InviteView } from "@/lib/services/social";

export function InvitesPanel({ invites, duels }: { invites: InviteView[]; duels: DuelView[] }) {
  if (!invites.length && !duels.length) return null;
  return (
    <section id="invites" className="scroll-mt-20" aria-labelledby="invites-title">
      <SectionTitle title={`Invites (${invites.length + duels.length})`} />
      <div className="space-y-3">
        {duels.map((v) => (
          <Card key={v.duel.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-extreme/12 text-red-300 ring-1 ring-extreme/30">
                <Swords className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm">
                <span className="font-semibold">{v.opponent.displayName}</span> challenged you to a {v.duel.durationDays}-day duel on{" "}
                <Link href={`/challenges/${v.duel.challengeId}`} className="font-semibold text-violet-2 hover:underline">
                  {v.challenge?.title ?? "a challenge"}
                </Link>
              </p>
            </div>
            <div className="flex gap-2">
              <ActionButton size="sm" action={respondDuelAction.bind(null, v.duel.id, true)}>
                Accept
              </ActionButton>
              <ActionButton size="sm" variant="ghost" action={respondDuelAction.bind(null, v.duel.id, false)}>
                Decline
              </ActionButton>
            </div>
          </Card>
        ))}
        {invites.map((v) => (
          <Card key={v.invite.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              {v.from ? <Avatar name={v.from.displayName} color={v.from.avatarColor} size={40} /> : <Bell className="h-5 w-5" aria-hidden />}
              <p className="text-sm">
                <span className="font-semibold">{v.from?.displayName ?? "Someone"}</span> invited you to{" "}
                {v.invite.kind === "challenge" ? (
                  <Link href={`/challenges/${v.invite.targetId}`} className="font-semibold text-violet-2 hover:underline">
                    <Zap className="mr-0.5 inline h-3.5 w-3.5" aria-hidden />
                    {v.challenge?.title ?? "a challenge"}
                  </Link>
                ) : (
                  <span className="font-semibold text-violet-2">
                    <Users className="mr-0.5 inline h-3.5 w-3.5" aria-hidden />
                    {v.squad?.name ?? "a squad"}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <ActionButton size="sm" action={respondInviteAction.bind(null, v.invite.id, true)}>
                Accept
              </ActionButton>
              <ActionButton size="sm" variant="ghost" action={respondInviteAction.bind(null, v.invite.id, false)}>
                Decline
              </ActionButton>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
