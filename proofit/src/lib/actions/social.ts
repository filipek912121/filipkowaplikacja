"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as duels from "@/lib/services/duels";
import * as profile from "@/lib/services/profile";
import * as social from "@/lib/services/social";
import * as squads from "@/lib/services/squads";
import type { ActionResult } from "@/lib/types";
import { createDuelSchema, createSquadSchema, idSchema, profileSchema, zodFieldErrors } from "@/lib/validation";
import { authed, localize } from "./run";

const done = (message: string): ActionResult => {
  revalidatePath("/", "layout");
  return { ok: true, message };
};
const badId = { ok: false as const, error: "Invalid request." };

export async function createDuelAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = createDuelSchema.safeParse({
    opponentId: fd.get("opponentId"),
    challengeId: fd.get("challengeId"),
    durationDays: fd.get("durationDays"),
  });
  if (!parsed.success) return localize({ ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) });
  return authed(async (userId) => {
    await duels.createDuel(userId, parsed.data);
    return done("Duel sent! It starts when they accept.");
  });
}

export async function respondDuelAction(duelId: string, accept: boolean): Promise<ActionResult> {
  const id = idSchema.safeParse(duelId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await duels.respondToDuel(userId, id.data, accept);
    return done(accept ? "Duel accepted — game on!" : "Duel declined.");
  });
}

export async function cancelDuelAction(duelId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(duelId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await duels.cancelDuel(userId, id.data);
    return done("Duel cancelled.");
  });
}

export async function createSquadAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = createSquadSchema.safeParse({
    name: fd.get("name"),
    description: fd.get("description") ?? "",
    isPrivate: fd.get("isPrivate") === "on",
  });
  if (!parsed.success) return localize({ ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) });
  let id: string | null = null;
  const res = await authed<undefined>(async (userId) => {
    id = (await squads.createSquad(userId, parsed.data)).id;
    return { ok: true };
  });
  if (res.ok && id) {
    revalidatePath("/", "layout");
    redirect(`/squads/${id}`);
  }
  return res;
}

export async function joinSquadAction(squadId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(squadId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await squads.joinSquad(userId, { squadId: id.data });
    return done("Welcome to the squad!");
  });
}

export async function joinSquadByCodeAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return localize({ ok: false, error: "Enter a valid invite code.", fieldErrors: { code: "4–12 letters or numbers" } });
  let id: string | null = null;
  const res = await authed<undefined>(async (userId) => {
    id = (await squads.joinSquad(userId, { code })).id;
    return { ok: true };
  });
  if (res.ok && id) {
    revalidatePath("/", "layout");
    redirect(`/squads/${id}`);
  }
  return res;
}

export async function leaveSquadAction(squadId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(squadId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await squads.leaveSquad(userId, id.data);
    return done("You left the squad.");
  });
}

export async function inviteToSquadAction(squadId: string, toUserId: string): Promise<ActionResult> {
  const a = idSchema.safeParse(squadId);
  const b = idSchema.safeParse(toUserId);
  if (!a.success || !b.success) return localize(badId);
  return authed(async (userId) => {
    await squads.inviteToSquad(userId, a.data, b.data);
    return done("Invite sent.");
  });
}

export async function followAction(targetId: string, follow: boolean): Promise<ActionResult> {
  const id = idSchema.safeParse(targetId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await social.setFollow(userId, id.data, follow);
    return done(follow ? "Added to friends." : "Removed from friends.");
  });
}

export async function respondInviteAction(inviteId: string, accept: boolean): Promise<ActionResult> {
  const id = idSchema.safeParse(inviteId);
  if (!id.success) return localize(badId);
  return authed(async (userId) => {
    await social.respondToInvite(userId, id.data, accept);
    return done(accept ? "Invite accepted." : "Invite declined.");
  });
}

export async function updateProfileAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({ displayName: fd.get("displayName"), bio: fd.get("bio") ?? "", avatarColor: fd.get("avatarColor") });
  if (!parsed.success) return localize({ ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) });
  return authed(async (userId) => {
    await profile.updateProfile(userId, parsed.data);
    return done("Profile saved.");
  });
}
