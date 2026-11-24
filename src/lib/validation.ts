import { z } from "zod";
import { DUEL_DURATIONS, DURATION_OPTIONS, LIMITS } from "@/lib/config/game";
import { CATEGORIES, DIFFICULTIES } from "@/lib/config/taxonomy";

const id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9-_]+$/, "Invalid id");
const durations = DURATION_OPTIONS.map((d) => d.days) as number[];

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(20, "At most 20 characters")
  .regex(/^[a-z0-9._]+$/, "Lowercase letters, numbers, dots and underscores only");

export const signUpSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(8, "At least 8 characters").max(72),
  username: usernameSchema,
  displayName: z.string().trim().min(2, "At least 2 characters").max(40),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(72),
});

export const createChallengeSchema = z.object({
  title: z.string().trim().min(LIMITS.titleMin, `At least ${LIMITS.titleMin} characters`).max(LIMITS.titleMax),
  description: z.string().trim().min(10, "Describe the challenge (10+ characters)").max(LIMITS.descriptionMax),
  difficulty: z.enum(DIFFICULTIES as [string, ...string[]]),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  durationDays: z.coerce.number().int().refine((n) => durations.includes(n), "Pick a duration"),
  tasks: z
    .array(z.string().trim().min(2, "Task too short").max(LIMITS.taskMax))
    .min(1, "Add at least one daily task")
    .max(LIMITS.maxTasks, `Up to ${LIMITS.maxTasks} tasks`),
  visibility: z.enum(["public", "private"]),
  requiresProof: z.boolean(),
  squadId: id.nullable(),
  inviteUserIds: z.array(id).max(20),
  joinNow: z.boolean(),
  isTemplate: z.boolean(),
  xpReward: z.coerce.number().int().min(1).max(20).optional(),
});
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const checkInSchema = z.object({
  challengeId: id,
  note: z.string().trim().max(LIMITS.noteMax).default(""),
  tasksDone: z.array(z.string().max(LIMITS.taskMax)).max(LIMITS.maxTasks),
  proofKind: z.enum(["photo", "link", "text"]).nullable(),
  proofUrl: z
    .url("Enter a valid link")
    .max(500)
    .refine((u) => /^https:\/\//i.test(u), "Links must start with https://")
    .nullable(),
  proofText: z.string().trim().max(LIMITS.noteMax).nullable(),
});

export const reviewSchema = z.object({
  proofId: id,
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(200).default(""),
});

export const createDuelSchema = z.object({
  opponentId: id,
  challengeId: id,
  durationDays: z.coerce.number().int().refine((n) => (DUEL_DURATIONS as readonly number[]).includes(n), "Pick a duration"),
});

export const createSquadSchema = z.object({
  name: z.string().trim().min(3, "At least 3 characters").max(40),
  description: z.string().trim().max(200).default(""),
  isPrivate: z.boolean(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "At least 2 characters").max(40),
  bio: z.string().trim().max(160).default(""),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
});

export const idSchema = id;

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
