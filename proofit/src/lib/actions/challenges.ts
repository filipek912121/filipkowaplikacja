"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as svc from "@/lib/services/challenges";
import type { ActionResult } from "@/lib/types";
import { checkInSchema, createChallengeSchema, idSchema, reviewSchema, zodFieldErrors } from "@/lib/validation";
import { authed } from "./run";

const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

export async function createChallengeAction(_prev: ActionResult<{ id: string }> | null, fd: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = createChallengeSchema.safeParse({
    title: fd.get("title"),
    description: fd.get("description"),
    difficulty: fd.get("difficulty"),
    category: fd.get("category"),
    durationDays: fd.get("durationDays"),
    tasks: fd.getAll("tasks").map(String).filter((t) => t.trim()),
    visibility: fd.get("visibility") ?? "public",
    requiresProof: bool(fd.get("requiresProof")),
    squadId: (fd.get("squadId") as string) || null,
    inviteUserIds: fd.getAll("invite").map(String),
    joinNow: bool(fd.get("joinNow")),
    isTemplate: bool(fd.get("isTemplate")),
    xpReward: fd.get("xpReward") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const res = await authed(async (userId) => {
    const ch = await svc.createChallenge(userId, parsed.data);
    return { ok: true, data: { id: ch.id } };
  });
  if (res.ok && res.data) {
    revalidatePath("/", "layout");
    redirect(`/challenges/${res.data.id}?created=1`);
  }
  return res;
}

export async function joinChallengeAction(challengeId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(challengeId);
  if (!id.success) return { ok: false, error: "Invalid challenge." };
  return authed(async (userId) => {
    await svc.joinChallenge(userId, id.data);
    revalidatePath("/", "layout");
    return { ok: true, message: "You're in! Your first check-in is today." };
  });
}

export async function leaveChallengeAction(challengeId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(challengeId);
  if (!id.success) return { ok: false, error: "Invalid challenge." };
  return authed(async (userId) => {
    await svc.leaveChallenge(userId, id.data);
    revalidatePath("/", "layout");
    return { ok: true, message: "You left the challenge." };
  });
}

export async function checkInAction(_prev: ActionResult<svc.CheckInResult> | null, fd: FormData): Promise<ActionResult<svc.CheckInResult>> {
  const proofKind = (fd.get("proofKind") as string) || null;
  const parsed = checkInSchema.safeParse({
    challengeId: fd.get("challengeId"),
    note: fd.get("note") ?? "",
    tasksDone: fd.getAll("tasksDone").map(String),
    proofKind,
    proofUrl: proofKind === "link" ? (fd.get("proofUrl") as string) || null : null,
    proofText: (fd.get("proofText") as string) || null,
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const file = fd.get("proofFile");
  return authed(async (userId) => {
    const d = parsed.data;
    const result = await svc.checkIn(userId, {
      challengeId: d.challengeId,
      note: d.note,
      tasksDone: d.tasksDone,
      proof: d.proofKind
        ? { kind: d.proofKind, file: d.proofKind === "photo" && file instanceof File ? file : null, url: d.proofUrl, text: d.proofText }
        : null,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: result };
  });
}

export async function reviewProofAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse({ proofId: fd.get("proofId"), decision: fd.get("decision"), note: fd.get("note") ?? "" });
  if (!parsed.success) return { ok: false, error: "Invalid review." };
  return authed(async (userId) => {
    await svc.reviewProof(userId, parsed.data.proofId, parsed.data.decision, parsed.data.note);
    revalidatePath("/", "layout");
    return { ok: true, message: parsed.data.decision === "approve" ? "Proof approved — XP awarded." : "Proof rejected." };
  });
}
