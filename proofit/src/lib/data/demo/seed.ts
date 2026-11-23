import { ACHIEVEMENTS } from "@/lib/config/achievements";
import { addDays, dayKey } from "@/lib/engine/dates";
import { clampXpReward } from "@/lib/engine/xp";
import type {
  Achievement,
  Category,
  Challenge,
  Completion,
  Difficulty,
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

export interface DemoDb {
  profiles: Profile[];
  challenges: Challenge[];
  participations: Participation[];
  completions: Completion[];
  proofs: ProofSubmission[];
  xpEvents: XpEvent[];
  duels: Duel[];
  squads: Squad[];
  squadMembers: SquadMember[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  subscriptions: Subscription[];
  follows: Follow[];
  invites: Invite[];
  files: Record<string, string>;
}

export const DEMO_USER_ID = "demo-alex";

/** Deterministic PRNG so the demo looks the same on every boot. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const USERS: [string, string, string, string][] = [
  [DEMO_USER_ID, "alex", "Alex Nowak", "#8b5cf6"],
  ["demo-maja", "maja.moves", "Maja Kowalska", "#ec4899"],
  ["demo-kuba", "kuba_runs", "Kuba Wiśniewski", "#3b82f6"],
  ["demo-zofia", "zofia.reads", "Zofia Lewandowska", "#06b6d4"],
  ["demo-oliwer", "oliwer.grind", "Oliwer Zieliński", "#f59e0b"],
  ["demo-lena", "lena.saves", "Lena Wójcik", "#22c55e"],
  ["demo-filip", "filip.focus", "Filip Kamiński", "#a855f7"],
  ["demo-nina", "nina.daily", "Nina Szymańska", "#f43f5e"],
  ["demo-tomek", "tomek.lifts", "Tomek Dąbrowski", "#0ea5e9"],
  ["demo-wiktoria", "wiki.learns", "Wiktoria Król", "#14b8a6"],
  ["demo-igor", "igor.stoic", "Igor Mazur", "#6366f1"],
  ["demo-hania", "hania.social", "Hania Jankowska", "#d946ef"],
];

type Seed = [string, string, string, Difficulty, Category, number, string[], boolean?];
const OFFICIAL: Seed[] = [
  ["walk-10", "Walk for 10 minutes", "A short, easy walk to get your body moving. Any pace counts — outdoors is a bonus.", "easy", "fitness", 1, ["Walk for at least 10 minutes"]],
  ["read-30", "Read for 30 minutes", "Pick any book and read for 30 focused minutes. No phone in reach.", "medium", "learning", 7, ["Read 30 minutes", "Write one sentence about what you read"]],
  ["walk-5k", "Complete a 5 km walk", "Walk 5 kilometres in one session. Track it with any app and upload a screenshot as proof.", "hard", "fitness", 1, ["Walk 5 km in one session", "Stretch for 5 minutes afterwards"], true],
  ["detox-7", "7-day digital detox", "No social media for seven days. Messaging friends and work tools are fine. Fill the gap with something offline.", "extreme", "discipline", 7, ["No social media apps today", "Spend 30 minutes on an offline hobby"], true],
  ["water-8", "Hydration habit", "Drink 8 glasses of water spread across the day.", "easy", "lifestyle", 7, ["Drink 8 glasses of water"]],
  ["bed-made", "Make your bed", "Start every morning with one small win.", "easy", "discipline", 7, ["Make your bed within 15 minutes of waking up"]],
  ["deep-work", "Deep work sprint", "One 90-minute block of distraction-free work every day. Phone in another room.", "hard", "productivity", 7, ["90 minutes of deep work", "Write down what you shipped"]],
  ["pomodoro-4", "4 Pomodoros", "Four 25-minute focused sessions with short breaks.", "medium", "productivity", 1, ["Complete 4 × 25-minute focus sessions"]],
  ["no-spend", "No-spend weekend", "Spend nothing on non-essentials for a whole weekend. Groceries and bills are fine.", "medium", "money", 3, ["No non-essential purchases today", "Log every expense"]],
  ["budget-30", "30-day budget tracker", "Track every expense for a month and review your categories each Sunday.", "hard", "money", 30, ["Log all of today's expenses"]],
  ["save-5", "Save 5 PLN a day", "Move 5 PLN into savings every day. Small amounts, big habit.", "easy", "money", 14, ["Transfer 5 PLN to savings"]],
  ["call-friend", "Call a friend", "Reach out to someone you haven't spoken to in a while.", "easy", "social", 1, ["Call or video-chat a friend for 10+ minutes"]],
  ["compliments", "Kindness streak", "Give one genuine compliment every day.", "medium", "social", 7, ["Give a genuine compliment", "Note how they reacted"]],
  ["stretch-15", "Morning mobility", "15 minutes of gentle stretching or yoga every morning.", "medium", "fitness", 14, ["15 minutes of stretching or yoga"]],
  ["steps-10k", "10k steps", "Hit 10,000 steps today. Upload a screenshot of your step counter.", "medium", "fitness", 1, ["Reach 10,000 steps"], true],
  ["language-20", "Language learning", "Practice a new language for 20 minutes daily.", "medium", "learning", 30, ["20 minutes of practice", "Learn 5 new words"]],
  ["course-module", "Finish a course module", "Complete one module of an online course and summarize it.", "hard", "learning", 7, ["Finish one module", "Write a 3-bullet summary"]],
  ["journal", "Evening journal", "Write three things you're grateful for and one lesson from the day.", "easy", "lifestyle", 7, ["Write 3 gratitudes", "Write 1 lesson"]],
  ["cold-shower", "Cool shower finish", "End your shower with 30 seconds of cool (not ice-cold) water. Skip it if you feel unwell.", "medium", "discipline", 7, ["30 seconds of cool water at the end of your shower"]],
  ["screen-cutoff", "Screens off by 22:00", "No screens after 22:00 to protect your sleep.", "hard", "lifestyle", 14, ["All screens off by 22:00", "Get at least 7 hours of sleep"]],
  ["run-30", "Run 30 days", "Go for a comfortable run every day for a month — distance doesn't matter, consistency does. Rest if you feel pain.", "extreme", "fitness", 30, ["Run for at least 15 minutes at a comfortable pace"], true],
  ["side-project", "Ship a side project", "Work on your side project every day for two weeks and ship a first version.", "extreme", "productivity", 14, ["Work 45 minutes on the project", "Commit or document progress"]],
  ["meal-prep", "Meal prep Sunday", "Prepare balanced meals for the next three days.", "medium", "lifestyle", 1, ["Prep 3 days of balanced meals"]],
  ["volunteer", "Volunteer an hour", "Give one hour of your time to a cause you care about.", "hard", "social", 1, ["Volunteer for 1 hour"], true],
];

export function createSeed(): DemoDb {
  const rand = mulberry32(20261123);
  const today = dayKey();
  const nowIso = new Date().toISOString();
  const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  const profiles: Profile[] = USERS.map(([id, username, displayName, avatarColor], i) => ({
    id,
    username,
    displayName,
    bio:
      id === DEMO_USER_ID
        ? "Building discipline one check-in at a time. Kraków 🇵🇱"
        : ["Morning person.", "Chasing streaks.", "Books > scrolling.", "Saving for a trip.", "Small steps daily."][i % 5],
    avatarColor,
    avatarUrl: null,
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    isAdmin: false,
    createdAt: isoDaysAgo(60 - i),
  }));

  const challenges: Challenge[] = OFFICIAL.map(([id, title, description, difficulty, category, durationDays, tasks, requiresProof], i) => ({
    id: `ch-${id}`,
    title,
    description,
    difficulty,
    category,
    durationDays,
    xpReward: clampXpReward(difficulty, null),
    tasks,
    visibility: "public",
    requiresProof: Boolean(requiresProof),
    creatorId: null,
    squadId: null,
    isOfficial: true,
    isTemplate: false,
    createdAt: isoDaysAgo(40 - i),
  }));

  // A user-created challenge owned by the demo user (they review proofs for it).
  challenges.push({
    id: "ch-no-sugar",
    title: "No added sugar weekdays",
    description: "Skip sweets and sugary drinks Monday to Friday. Fruit is fine! Post a photo of one meal as proof.",
    difficulty: "medium",
    category: "lifestyle",
    durationDays: 7,
    xpReward: 5,
    tasks: ["No sweets or sugary drinks", "Photo of one meal"],
    visibility: "public",
    requiresProof: true,
    creatorId: DEMO_USER_ID,
    squadId: null,
    isOfficial: false,
    isTemplate: false,
    createdAt: isoDaysAgo(6),
  });

  const squads: Squad[] = [
    { id: "sq-wolves", name: "Morning Wolves", description: "Early risers who check in before 8:00.", ownerId: DEMO_USER_ID, isPrivate: false, inviteCode: "WOLVES7", createdAt: isoDaysAgo(20) },
    { id: "sq-code", name: "Code & Cardio", description: "Developers who refuse to sit all day.", ownerId: "demo-kuba", isPrivate: false, inviteCode: "CODE42", createdAt: isoDaysAgo(18) },
    { id: "sq-budget", name: "Budget Bosses", description: "Private group for money-habit challenges.", ownerId: "demo-lena", isPrivate: true, inviteCode: "BOSS99", createdAt: isoDaysAgo(15) },
  ];
  const squadMembers: SquadMember[] = [
    ...[DEMO_USER_ID, "demo-maja", "demo-nina", "demo-igor", "demo-hania"].map((userId, i) => ({
      squadId: "sq-wolves",
      userId,
      role: (i === 0 ? "owner" : "member") as SquadMember["role"],
      joinedAt: isoDaysAgo(20 - i),
    })),
    ...["demo-kuba", "demo-filip", "demo-tomek", "demo-wiktoria"].map((userId, i) => ({
      squadId: "sq-code",
      userId,
      role: (i === 0 ? "owner" : "member") as SquadMember["role"],
      joinedAt: isoDaysAgo(18 - i),
    })),
    ...["demo-lena", "demo-zofia", "demo-oliwer"].map((userId, i) => ({
      squadId: "sq-budget",
      userId,
      role: (i === 0 ? "owner" : "member") as SquadMember["role"],
      joinedAt: isoDaysAgo(15 - i),
    })),
  ];
  challenges.push({
    id: "ch-wolves-sunrise",
    title: "Sunrise check-in",
    description: "Squad challenge: be up and moving before 7:30 every day this week.",
    difficulty: "hard",
    category: "discipline",
    durationDays: 7,
    xpReward: 9,
    tasks: ["Out of bed before 7:30", "5 minutes of daylight"],
    visibility: "private",
    requiresProof: false,
    creatorId: DEMO_USER_ID,
    squadId: "sq-wolves",
    isOfficial: false,
    isTemplate: false,
    createdAt: isoDaysAgo(3),
  });

  const participations: Participation[] = [];
  const completions: Completion[] = [];
  const xpEvents: XpEvent[] = [];
  const proofs: ProofSubmission[] = [];
  const byId = new Map(challenges.map((c) => [c.id, c]));

  const join = (userId: string, challengeId: string, daysAgo: number, checkinDaysAgo: number[], status?: Participation["status"]) => {
    const ch = byId.get(challengeId)!;
    const joinedAt = isoDaysAgo(daysAgo);
    const startDay = addDays(today, -daysAgo);
    const p: Participation = {
      id: `pa-${userId}-${challengeId}`,
      challengeId,
      userId,
      status: status ?? "active",
      joinedAt,
      endsAt: new Date(new Date(`${addDays(startDay, ch.durationDays)}T00:00:00Z`).getTime()).toISOString(),
      checkins: 0,
      completedAt: status === "completed" ? isoDaysAgo(Math.min(...checkinDaysAgo)) : null,
    };
    participations.push(p);
    for (const ago of checkinDaysAgo) {
      const day = addDays(today, -ago);
      const c: Completion = {
        id: `co-${p.id}-${day}`,
        participationId: p.id,
        challengeId,
        userId,
        day,
        status: "approved",
        xpAwarded: ch.xpReward,
        note: "",
        tasksDone: ch.tasks,
        createdAt: isoDaysAgo(ago),
      };
      completions.push(c);
      p.checkins++;
      xpEvents.push({ id: `xp-${c.id}`, userId, amount: ch.xpReward, reason: "completion", refId: c.id, day, createdAt: c.createdAt });
    }
    return p;
  };

  // ── Demo user history ───────────────────────────────────────
  join(DEMO_USER_ID, "ch-read-30", 4, [4, 3, 2, 1]);
  join(DEMO_USER_ID, "ch-wolves-sunrise", 2, [2, 1]);
  join(DEMO_USER_ID, "ch-water-8", 20, [20, 19, 18, 17, 16, 15, 14], "completed");
  join(DEMO_USER_ID, "ch-bed-made", 28, [28, 27, 26, 25, 24, 23, 22], "completed");
  join(DEMO_USER_ID, "ch-call-friend", 9, [9], "completed");
  join(DEMO_USER_ID, "ch-pomodoro-4", 11, [11], "completed");
  join(DEMO_USER_ID, "ch-meal-prep", 13, [13], "completed");
  const walk = join(DEMO_USER_ID, "ch-walk-5k", 0, []);
  // A pending proof the demo user submitted today.
  const pendingDay = today;
  completions.push({
    id: "co-alex-walk-pending",
    participationId: walk.id,
    challengeId: "ch-walk-5k",
    userId: DEMO_USER_ID,
    day: pendingDay,
    status: "pending",
    xpAwarded: 0,
    note: "Morning walk along the Vistula 🌅",
    tasksDone: byId.get("ch-walk-5k")!.tasks,
    createdAt: nowIso,
  });
  proofs.push({
    id: "pr-alex-walk",
    completionId: "co-alex-walk-pending",
    challengeId: "ch-walk-5k",
    userId: DEMO_USER_ID,
    kind: "link",
    storagePath: null,
    url: "https://www.strava.com/",
    text: "5.2 km in 54 minutes — screenshot link from my tracker.",
    status: "pending",
    reviewerId: null,
    reviewNote: null,
    reviewedAt: null,
    createdAt: nowIso,
  });
  // Streak bonus history for alex (last 5 days active)
  for (let ago = 5; ago >= 1; ago--) {
    const day = addDays(today, -ago);
    const streak = 6 - ago;
    const bonus = streak >= 3 ? Math.min(5, streak - 2) : 0;
    if (bonus) xpEvents.push({ id: `xp-streak-alex-${day}`, userId: DEMO_USER_ID, amount: bonus, reason: "streak_bonus", refId: `streak:${day}`, day, createdAt: isoDaysAgo(ago) });
  }
  // fill the gap day 5 (streak base) — a 1-day challenge done 5 days ago
  join(DEMO_USER_ID, "ch-walk-10", 5, [5], "completed");

  // ── Other users: activity on the demo user's challenge + duel challenge ──
  const majaRead = join("demo-maja", "ch-read-30", 4, [4, 3, 2, 1, 0]);
  void majaRead;
  join("demo-kuba", "ch-read-30", 10, [10, 9, 8, 7, 6, 5, 4], "completed");
  for (const [uid, ago] of [["demo-maja", 0], ["demo-kuba", 0], ["demo-nina", 1]] as const) {
    const p = join(uid, "ch-no-sugar", 3, []);
    const day = addDays(today, -ago);
    const cid = `co-${uid}-nosugar-${day}`;
    completions.push({ id: cid, participationId: p.id, challengeId: "ch-no-sugar", userId: uid, day, status: "pending", xpAwarded: 0, note: "", tasksDone: ["No sweets or sugary drinks", "Photo of one meal"], createdAt: isoDaysAgo(ago) });
    proofs.push({
      id: `pr-${uid}-nosugar`,
      completionId: cid,
      challengeId: "ch-no-sugar",
      userId: uid,
      kind: "text",
      storagePath: null,
      url: null,
      text: uid === "demo-maja" ? "Lunch: grilled chicken, rice and salad. Swapped my afternoon cola for sparkling water." : uid === "demo-kuba" ? "Oatmeal with berries for breakfast, no snacks at the office today." : "Skipped dessert at a birthday party — had fruit instead.",
      status: "pending",
      reviewerId: null,
      reviewNote: null,
      reviewedAt: null,
      createdAt: isoDaysAgo(ago),
    });
  }
  for (const uid of ["demo-maja", "demo-nina", "demo-igor"]) join(uid, "ch-wolves-sunrise", 2, [2, 1]);

  // Background XP history for everyone else so leaderboards feel alive.
  for (const p of profiles) {
    if (p.id === DEMO_USER_ID) continue;
    const intensity = 0.35 + rand() * 0.6;
    for (let ago = 40; ago >= 0; ago--) {
      if (rand() > intensity) continue;
      const amount = 2 + Math.floor(rand() * 14);
      const day = addDays(today, -ago);
      xpEvents.push({ id: `xp-bg-${p.id}-${day}`, userId: p.id, amount, reason: "completion", refId: null, day, createdAt: isoDaysAgo(ago) });
    }
  }

  // Duels
  const duels: Duel[] = [
    { id: "du-alex-maja", challengerId: DEMO_USER_ID, opponentId: "demo-maja", challengeId: "ch-read-30", durationDays: 7, status: "active", startsAt: isoDaysAgo(4), endsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), winnerId: null, isDraw: false, createdAt: isoDaysAgo(4) },
    { id: "du-kuba-alex", challengerId: "demo-kuba", opponentId: DEMO_USER_ID, challengeId: "ch-water-8", durationDays: 7, status: "completed", startsAt: isoDaysAgo(20), endsAt: isoDaysAgo(13), winnerId: DEMO_USER_ID, isDraw: false, createdAt: isoDaysAgo(21) },
    { id: "du-zofia-alex", challengerId: "demo-zofia", opponentId: DEMO_USER_ID, challengeId: "ch-journal", durationDays: 7, status: "pending", startsAt: null, endsAt: null, winnerId: null, isDraw: false, createdAt: isoDaysAgo(0) },
  ];
  join("demo-kuba", "ch-water-8", 20, [20, 19, 18, 16, 15], "failed");
  xpEvents.push({ id: "xp-duel-alex-kuba", userId: DEMO_USER_ID, amount: 10, reason: "duel_win", refId: "du-kuba-alex", day: addDays(today, -13), createdAt: isoDaysAgo(13) });

  // Achievements
  const achievementBonus: [string, string, number][] = [
    [DEMO_USER_ID, "first_challenge", 28],
    [DEMO_USER_ID, "streak_7", 22],
    [DEMO_USER_ID, "squad_up", 20],
    [DEMO_USER_ID, "duel_winner", 13],
    [DEMO_USER_ID, "creator", 6],
    ["demo-kuba", "first_challenge", 30],
    ["demo-maja", "first_challenge", 30],
    ["demo-maja", "streak_7", 10],
  ];
  const userAchievements: UserAchievement[] = achievementBonus.map(([userId, achievementId, ago]) => ({ userId, achievementId, unlockedAt: isoDaysAgo(ago) }));
  for (const [userId, achievementId, ago] of achievementBonus) {
    const a = ACHIEVEMENTS.find((x) => x.id === achievementId)!;
    xpEvents.push({ id: `xp-ach-${userId}-${achievementId}`, userId, amount: a.xpBonus, reason: "achievement", refId: `ach:${achievementId}`, day: addDays(today, -ago), createdAt: isoDaysAgo(ago) });
  }

  // Derive profile totals + streaks from the ledger / completions.
  for (const p of profiles) {
    p.xp = xpEvents.filter((e) => e.userId === p.id).reduce((s, e) => s + e.amount, 0);
    const days = new Set(completions.filter((c) => c.userId === p.id && c.status !== "rejected").map((c) => c.day));
    const bgDays = new Set(xpEvents.filter((e) => e.userId === p.id).map((e) => e.day));
    const active = p.id === DEMO_USER_ID ? days : bgDays;
    let streak = 0;
    let cursor = active.has(today) ? today : addDays(today, -1);
    while (active.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    p.currentStreak = streak;
    p.longestStreak = Math.max(streak, p.id === DEMO_USER_ID ? 9 : Math.floor(streak + rand() * 8));
    p.lastActiveDay = streak ? (active.has(today) ? today : addDays(today, -1)) : null;
  }

  const subscriptions: Subscription[] = profiles.map((p) => ({
    userId: p.id,
    plan: p.id === "demo-lena" || p.id === "demo-kuba" ? "premium" : "free",
    status: "active",
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }));

  const follows: Follow[] = ["demo-maja", "demo-kuba", "demo-zofia", "demo-lena", "demo-nina"].map((followingId) => ({ followerId: DEMO_USER_ID, followingId }));
  follows.push({ followerId: "demo-maja", followingId: DEMO_USER_ID }, { followerId: "demo-kuba", followingId: DEMO_USER_ID });

  const invites: Invite[] = [
    { id: "in-lena-budget", kind: "squad", targetId: "sq-budget", fromUserId: "demo-lena", toUserId: DEMO_USER_ID, status: "pending", createdAt: isoDaysAgo(1) },
    { id: "in-maja-stretch", kind: "challenge", targetId: "ch-stretch-15", fromUserId: "demo-maja", toUserId: DEMO_USER_ID, status: "pending", createdAt: isoDaysAgo(0) },
  ];

  return {
    profiles,
    challenges,
    participations,
    completions,
    proofs,
    xpEvents,
    duels,
    squads,
    squadMembers,
    achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
    userAchievements,
    subscriptions,
    follows,
    invites,
    files: {},
  };
}
