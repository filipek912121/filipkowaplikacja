export type Difficulty = "easy" | "medium" | "hard" | "extreme";
export type Category =
  | "fitness"
  | "productivity"
  | "discipline"
  | "lifestyle"
  | "learning"
  | "money"
  | "social";
export type Visibility = "public" | "private";
export type Plan = "free" | "premium";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarUrl: string | null;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  isAdmin: boolean;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: Category;
  durationDays: number;
  xpReward: number;
  tasks: string[];
  visibility: Visibility;
  requiresProof: boolean;
  creatorId: string | null;
  squadId: string | null;
  isOfficial: boolean;
  isTemplate: boolean;
  createdAt: string;
}

export type ParticipationStatus = "active" | "completed" | "failed" | "left";

export interface Participation {
  id: string;
  challengeId: string;
  userId: string;
  status: ParticipationStatus;
  joinedAt: string;
  endsAt: string;
  checkins: number;
  completedAt: string | null;
}

export type CompletionStatus = "approved" | "pending" | "rejected";

export interface Completion {
  id: string;
  participationId: string;
  challengeId: string;
  userId: string;
  day: string; // YYYY-MM-DD in APP_TIMEZONE
  status: CompletionStatus;
  xpAwarded: number;
  note: string;
  tasksDone: string[];
  createdAt: string;
}

export type ProofKind = "photo" | "link" | "text";

export interface ProofSubmission {
  id: string;
  completionId: string;
  challengeId: string;
  userId: string;
  kind: ProofKind;
  storagePath: string | null;
  url: string | null;
  text: string | null;
  status: CompletionStatus;
  reviewerId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type DuelStatus = "pending" | "active" | "completed" | "declined" | "cancelled";

export interface Duel {
  id: string;
  challengerId: string;
  opponentId: string;
  challengeId: string;
  durationDays: number;
  status: DuelStatus;
  startsAt: string | null;
  endsAt: string | null;
  winnerId: string | null;
  isDraw: boolean;
  createdAt: string;
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  inviteCode: string;
  createdAt: string;
}

export interface SquadMember {
  squadId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface Achievement {
  id: string; // stable code, e.g. "first_challenge"
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "legend";
  xpBonus: number;
  premiumOnly: boolean;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface Subscription {
  userId: string;
  plan: Plan;
  status: "active" | "trialing" | "past_due" | "canceled" | "inactive";
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface XpEvent {
  id: string;
  userId: string;
  amount: number;
  reason: "completion" | "streak_bonus" | "achievement" | "duel_win" | "challenge_complete";
  refId: string | null;
  day: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  kind: "challenge" | "squad";
  targetId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
}

/** Standard result returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
