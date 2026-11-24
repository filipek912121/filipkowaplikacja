import "server-only";
import { randomUUID } from "node:crypto";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DuplicateError, type Store } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const snake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
function toRow(obj: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[snake(k)] = v;
  return out;
}
function fromRow<T>(row: Row | null): T | null {
  if (!row) return null;
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[camel(k)] = v;
  return out as T;
}
const fromRows = <T>(rows: Row[] | null): T[] => (rows ?? []).map((r) => fromRow<T>(r)!);

function check(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "23505") throw new DuplicateError(error.message);
  throw new Error(`Database error: ${error.message}`);
}

const db = () => supabaseAdmin();
const PROOF_BUCKET = "proofs";

async function one<T>(q: PromiseLike<{ data: Row | null; error: PostgrestError | null }>): Promise<T | null> {
  const { data, error } = await q;
  check(error);
  return fromRow<T>(data);
}
async function many<T>(q: PromiseLike<{ data: Row[] | null; error: PostgrestError | null }>): Promise<T[]> {
  const { data, error } = await q;
  check(error);
  return fromRows<T>(data);
}
async function insert<T>(table: string, value: Row): Promise<T> {
  return (await one<T>(db().from(table).insert(toRow(value)).select().single()))!;
}
async function update<T>(table: string, id: string, patch: Row): Promise<T> {
  const { id: _ignored, ...rest } = patch;
  void _ignored;
  return (await one<T>(db().from(table).update(toRow(rest)).eq("id", id).select().single()))!;
}

/**
 * Postgres implementation. Runs server-side with the service-role key; every
 * call site in `lib/services` authorises the current user first. Browser
 * clients never receive this key — direct table access from the browser is
 * governed by the RLS policies in supabase/migrations.
 */
export const supabaseStore: Store = {
  getProfile: (id) => one(db().from("profiles").select("*").eq("id", id).maybeSingle()),
  getProfileByUsername: (u) => one(db().from("profiles").select("*").eq("username", u.toLowerCase()).maybeSingle()),
  listProfiles: (ids) => {
    let q = db().from("profiles").select("*");
    if (ids) q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    return many(q.limit(1000));
  },
  updateProfile: (id, patch) => update("profiles", id, patch),

  getChallenge: (id) => one(db().from("challenges").select("*").eq("id", id).maybeSingle()),
  listChallenges: (q) => {
    let query = db().from("challenges").select("*").order("created_at", { ascending: false }).limit(500);
    if (q.ids) query = query.in("id", q.ids.length ? q.ids : [randomUUID()]);
    if (q.templatesOnly) query = query.eq("is_template", true);
    const ors: string[] = [];
    if (q.publicOnly) ors.push("and(visibility.eq.public,squad_id.is.null)");
    if (q.creatorId) ors.push(`creator_id.eq.${q.creatorId}`);
    if (q.squadIds?.length) ors.push(`squad_id.in.(${q.squadIds.join(",")})`);
    if (q.publicOnly || q.creatorId || q.squadIds) {
      if (!ors.length) return Promise.resolve([]);
      query = query.or(ors.join(","));
    }
    return many(query);
  },
  insertChallenge: (c) => insert("challenges", c),
  async countParticipants(ids) {
    const out: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    if (!ids.length) return out;
    const { data, error } = await db().rpc("participant_counts", { challenge_ids: ids });
    check(error);
    for (const r of (data ?? []) as { challenge_id: string; total: number }[]) out[r.challenge_id] = Number(r.total);
    return out;
  },

  getParticipation: (userId, challengeId) =>
    one(db().from("challenge_participants").select("*").eq("user_id", userId).eq("challenge_id", challengeId).maybeSingle()),
  getParticipationById: (id) => one(db().from("challenge_participants").select("*").eq("id", id).maybeSingle()),
  listParticipations: (q) => {
    let query = db().from("challenge_participants").select("*").limit(2000);
    if (q.userId) query = query.eq("user_id", q.userId);
    if (q.challengeId) query = query.eq("challenge_id", q.challengeId);
    if (q.userIds) query = query.in("user_id", q.userIds.length ? q.userIds : [randomUUID()]);
    return many(query);
  },
  insertParticipation: (p) => insert("challenge_participants", p),
  updateParticipation: (id, patch) => update("challenge_participants", id, patch),

  listCompletions: (q) => {
    let query = db().from("completions").select("*").order("created_at", { ascending: false }).limit(2000);
    if (q.userId) query = query.eq("user_id", q.userId);
    if (q.challengeId) query = query.eq("challenge_id", q.challengeId);
    if (q.challengeIds) query = query.in("challenge_id", q.challengeIds.length ? q.challengeIds : [randomUUID()]);
    if (q.participationId) query = query.eq("participation_id", q.participationId);
    if (q.day) query = query.eq("day", q.day);
    if (q.sinceDay) query = query.gte("day", q.sinceDay);
    if (q.status) query = query.eq("status", q.status);
    return many(query);
  },
  getCompletion: (id) => one(db().from("completions").select("*").eq("id", id).maybeSingle()),
  insertCompletion: (c) => insert("completions", c),
  updateCompletion: (id, patch) => update("completions", id, patch),
  insertProof: (p) => insert("proof_submissions", p),
  getProof: (id) => one(db().from("proof_submissions").select("*").eq("id", id).maybeSingle()),
  listProofs: (q) => {
    let query = db().from("proof_submissions").select("*").order("created_at", { ascending: false }).limit(500);
    if (q.userId) query = query.eq("user_id", q.userId);
    if (q.challengeIds) query = query.in("challenge_id", q.challengeIds.length ? q.challengeIds : [randomUUID()]);
    if (q.completionIds) query = query.in("completion_id", q.completionIds.length ? q.completionIds : [randomUUID()]);
    if (q.status) query = query.eq("status", q.status);
    return many(query);
  },
  updateProof: (id, patch) => update("proof_submissions", id, patch),
  async uploadProofFile(userId, file) {
    const ext = (file.type.split("/")[1] || "bin").replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${randomUUID()}.${ext}`;
    const { error } = await db().storage.from(PROOF_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return path;
  },
  async proofFileUrl(path) {
    const { data, error } = await db().storage.from(PROOF_BUCKET).createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  },

  insertXpEvent: (e) => insert("xp_events", e),
  listXpEvents: (q) => {
    let query = db().from("xp_events").select("*").limit(5000);
    if (q.userId) query = query.eq("user_id", q.userId);
    if (q.sinceDay) query = query.gte("day", q.sinceDay);
    if (q.day) query = query.eq("day", q.day);
    return many(query);
  },
  async xpTotals(q) {
    const { data, error } = await db().rpc("xp_totals", {
      since_day: q.sinceDay ?? null,
      user_ids: q.userIds ?? null,
      lim: q.limit ?? 100,
    });
    check(error);
    return ((data ?? []) as { user_id: string; xp: number }[]).map((r) => ({ userId: r.user_id, xp: Number(r.xp) }));
  },

  getDuel: (id) => one(db().from("duels").select("*").eq("id", id).maybeSingle()),
  listDuels: (userId) =>
    many(db().from("duels").select("*").or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`).order("created_at", { ascending: false })),
  insertDuel: (d) => insert("duels", d),
  updateDuel: (id, patch) => update("duels", id, patch),

  getSquad: (id) => one(db().from("squads").select("*").eq("id", id).maybeSingle()),
  getSquadByInviteCode: (code) => one(db().from("squads").select("*").eq("invite_code", code.toUpperCase()).maybeSingle()),
  listSquads: (q) => {
    let query = db().from("squads").select("*").order("created_at", { ascending: false }).limit(200);
    if (q.ids) query = query.in("id", q.ids.length ? q.ids : [randomUUID()]);
    if (q.publicOnly) query = query.eq("is_private", false);
    return many(query);
  },
  insertSquad: (s) => insert("squads", s),
  listSquadMembers: (q) => {
    let query = db().from("squad_members").select("*");
    if (q.squadId) query = query.eq("squad_id", q.squadId);
    if (q.userId) query = query.eq("user_id", q.userId);
    return many(query);
  },
  insertSquadMember: async (m) => {
    const { error } = await db().from("squad_members").insert(toRow(m));
    check(error);
    return m;
  },
  async deleteSquadMember(squadId, userId) {
    const { error } = await db().from("squad_members").delete().eq("squad_id", squadId).eq("user_id", userId);
    check(error);
  },

  listAchievements: () => many(db().from("achievements").select("*")),
  listUserAchievements: (userId) => many(db().from("user_achievements").select("*").eq("user_id", userId)),
  async insertUserAchievement(ua) {
    const { error } = await db().from("user_achievements").insert(toRow(ua));
    check(error);
  },

  getSubscription: (userId) => one(db().from("subscriptions").select("*").eq("user_id", userId).maybeSingle()),
  async upsertSubscription(s) {
    return (await one(db().from("subscriptions").upsert(toRow(s), { onConflict: "user_id" }).select().single()))!;
  },

  listFollows: (q) => {
    let query = db().from("follows").select("*");
    if (q.followerId) query = query.eq("follower_id", q.followerId);
    if (q.followingId) query = query.eq("following_id", q.followingId);
    return many(query);
  },
  async insertFollow(f) {
    const { error } = await db().from("follows").upsert(toRow(f), { onConflict: "follower_id,following_id", ignoreDuplicates: true });
    check(error);
  },
  async deleteFollow(f) {
    const { error } = await db().from("follows").delete().eq("follower_id", f.followerId).eq("following_id", f.followingId);
    check(error);
  },
  listInvites: (q) => {
    let query = db().from("invites").select("*").order("created_at", { ascending: false });
    if (q.toUserId) query = query.eq("to_user_id", q.toUserId);
    if (q.fromUserId) query = query.eq("from_user_id", q.fromUserId);
    if (q.targetId) query = query.eq("target_id", q.targetId);
    if (q.status) query = query.eq("status", q.status);
    return many(query);
  },
  getInvite: (id) => one(db().from("invites").select("*").eq("id", id).maybeSingle()),
  insertInvite: (i) => insert("invites", i),
  updateInvite: (id, patch) => update("invites", id, patch),
};
