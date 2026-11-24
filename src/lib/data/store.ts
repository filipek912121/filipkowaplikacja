import type {
  Achievement,
  Challenge,
  Completion,
  Duel,
  Follow,
  Invite,
  Participation,
  Profile,
  ProofSubmission,
  Squad,
  SquadMember,
  Subscription,
  UserAchievement,
  XpEvent,
} from "@/lib/types";

export class DuplicateError extends Error {
  constructor(message = "Duplicate record") {
    super(message);
    this.name = "DuplicateError";
  }
}

export interface ChallengeQuery {
  ids?: string[];
  creatorId?: string;
  squadIds?: string[];
  publicOnly?: boolean;
  templatesOnly?: boolean;
}

export interface CompletionQuery {
  userId?: string;
  challengeId?: string;
  challengeIds?: string[];
  participationId?: string;
  day?: string;
  sinceDay?: string;
  status?: Completion["status"];
}

/**
 * Persistence boundary. Business rules live in `lib/services`, which only
 * talk to this interface. Two implementations exist:
 *  - MemoryStore (demo mode, in-process sample data)
 *  - SupabaseStore (Postgres via the service-role client, server-only)
 */
export interface Store {
  // profiles
  getProfile(id: string): Promise<Profile | null>;
  getProfileByUsername(username: string): Promise<Profile | null>;
  listProfiles(ids?: string[]): Promise<Profile[]>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;

  // challenges
  getChallenge(id: string): Promise<Challenge | null>;
  listChallenges(q: ChallengeQuery): Promise<Challenge[]>;
  insertChallenge(c: Omit<Challenge, "id" | "createdAt">): Promise<Challenge>;
  countParticipants(challengeIds: string[]): Promise<Record<string, number>>;

  // participations
  getParticipation(userId: string, challengeId: string): Promise<Participation | null>;
  getParticipationById(id: string): Promise<Participation | null>;
  listParticipations(q: { userId?: string; challengeId?: string; userIds?: string[] }): Promise<Participation[]>;
  insertParticipation(p: Omit<Participation, "id">): Promise<Participation>;
  updateParticipation(id: string, patch: Partial<Participation>): Promise<Participation>;

  // completions + proofs
  listCompletions(q: CompletionQuery): Promise<Completion[]>;
  getCompletion(id: string): Promise<Completion | null>;
  insertCompletion(c: Omit<Completion, "id" | "createdAt">): Promise<Completion>;
  updateCompletion(id: string, patch: Partial<Completion>): Promise<Completion>;
  insertProof(p: Omit<ProofSubmission, "id" | "createdAt">): Promise<ProofSubmission>;
  getProof(id: string): Promise<ProofSubmission | null>;
  listProofs(q: { userId?: string; challengeIds?: string[]; status?: ProofSubmission["status"]; completionIds?: string[] }): Promise<ProofSubmission[]>;
  updateProof(id: string, patch: Partial<ProofSubmission>): Promise<ProofSubmission>;
  uploadProofFile(userId: string, file: File): Promise<string>;
  proofFileUrl(path: string): Promise<string | null>;

  // xp ledger
  insertXpEvent(e: Omit<XpEvent, "id" | "createdAt">): Promise<XpEvent>;
  listXpEvents(q: { userId?: string; sinceDay?: string; day?: string }): Promise<XpEvent[]>;
  /** Sum of XP per user since a day (inclusive); all-time when omitted. */
  xpTotals(q: { sinceDay?: string; userIds?: string[]; limit?: number }): Promise<{ userId: string; xp: number }[]>;

  // duels
  getDuel(id: string): Promise<Duel | null>;
  listDuels(userId: string): Promise<Duel[]>;
  insertDuel(d: Omit<Duel, "id" | "createdAt">): Promise<Duel>;
  updateDuel(id: string, patch: Partial<Duel>): Promise<Duel>;

  // squads
  getSquad(id: string): Promise<Squad | null>;
  getSquadByInviteCode(code: string): Promise<Squad | null>;
  listSquads(q: { ids?: string[]; publicOnly?: boolean }): Promise<Squad[]>;
  insertSquad(s: Omit<Squad, "id" | "createdAt">): Promise<Squad>;
  listSquadMembers(q: { squadId?: string; userId?: string }): Promise<SquadMember[]>;
  insertSquadMember(m: SquadMember): Promise<SquadMember>;
  deleteSquadMember(squadId: string, userId: string): Promise<void>;

  // achievements
  listAchievements(): Promise<Achievement[]>;
  listUserAchievements(userId: string): Promise<UserAchievement[]>;
  insertUserAchievement(ua: UserAchievement): Promise<void>;

  // subscriptions
  getSubscription(userId: string): Promise<Subscription | null>;
  upsertSubscription(s: Subscription): Promise<Subscription>;

  // social graph + invites
  listFollows(q: { followerId?: string; followingId?: string }): Promise<Follow[]>;
  insertFollow(f: Follow): Promise<void>;
  deleteFollow(f: Follow): Promise<void>;
  listInvites(q: { toUserId?: string; fromUserId?: string; targetId?: string; status?: Invite["status"] }): Promise<Invite[]>;
  getInvite(id: string): Promise<Invite | null>;
  insertInvite(i: Omit<Invite, "id" | "createdAt">): Promise<Invite>;
  updateInvite(id: string, patch: Partial<Invite>): Promise<Invite>;
}
