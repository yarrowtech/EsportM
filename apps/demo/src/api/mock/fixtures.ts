// Static seed data for the standalone sales demo. Everything here is fictional.
const DAY = 24 * 60 * 60 * 1000;
const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const isoDaysFromNow = (days: number) => iso(now() + days * DAY);
const isoYearsAgo = (years: number, dayOffset = 0) => iso(now() - years * 365 * DAY + dayOffset * DAY);

export const CLUB_ID = "demo-club-1";
export const USER_ID = "demo-user-1";
export const MEMBERSHIP_ID = "demo-membership-1";

export const club = {
  id: CLUB_ID,
  name: "Phoenix FC Academy",
  slug: "phoenix-fc",
  logoUrl: "",
};

export const demoUser = {
  id: USER_ID,
  email: "demo@esportm.com",
  fullName: "Alex Morgan",
};

export const membership = {
  id: MEMBERSHIP_ID,
  clubId: CLUB_ID,
  primary: "ADMIN" as const,
  subRoles: ["COACH", "PHYSIO"] as const,
  club,
};

type PlayerSeed = {
  id: string;
  name: string;
  position: string;
  nationality: string;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  foot: "RIGHT" | "LEFT" | "BOTH";
  jerseyNo: number;
  wellness: "FIT" | "LIMITED" | "UNAVAILABLE";
  readiness: number;
  goals: number;
  assists: number;
  minutes: number;
  yellow: number;
  red: number;
  squad: "first" | "dev";
};

const PLAYER_SEEDS: PlayerSeed[] = [
  { id: "demo-player-1", name: "Marcus Webb", position: "Striker", nationality: "England", ageYears: 24, heightCm: 182, weightKg: 78, foot: "RIGHT", jerseyNo: 9, wellness: "FIT", readiness: 92, goals: 14, assists: 4, minutes: 1620, yellow: 2, red: 0, squad: "first" },
  { id: "demo-player-2", name: "Diego Alvarez", position: "Striker", nationality: "Argentina", ageYears: 22, heightCm: 179, weightKg: 74, foot: "LEFT", jerseyNo: 11, wellness: "FIT", readiness: 88, goals: 10, assists: 6, minutes: 1440, yellow: 1, red: 0, squad: "first" },
  { id: "demo-player-3", name: "Kian Okafor", position: "Winger", nationality: "Nigeria", ageYears: 21, heightCm: 175, weightKg: 70, foot: "RIGHT", jerseyNo: 7, wellness: "FIT", readiness: 90, goals: 8, assists: 11, minutes: 1560, yellow: 3, red: 0, squad: "first" },
  { id: "demo-player-4", name: "Theo Laurent", position: "Winger", nationality: "France", ageYears: 23, heightCm: 177, weightKg: 72, foot: "LEFT", jerseyNo: 17, wellness: "LIMITED", readiness: 61, goals: 6, assists: 9, minutes: 1180, yellow: 2, red: 0, squad: "first" },
  { id: "demo-player-5", name: "Ryo Nakashima", position: "Attacking Mid", nationality: "Japan", ageYears: 25, heightCm: 173, weightKg: 68, foot: "RIGHT", jerseyNo: 10, wellness: "FIT", readiness: 95, goals: 9, assists: 13, minutes: 1710, yellow: 1, red: 0, squad: "first" },
  { id: "demo-player-6", name: "Samuel Okoye", position: "Central Mid", nationality: "Nigeria", ageYears: 26, heightCm: 180, weightKg: 76, foot: "RIGHT", jerseyNo: 8, wellness: "FIT", readiness: 87, goals: 3, assists: 8, minutes: 1830, yellow: 5, red: 0, squad: "first" },
  { id: "demo-player-7", name: "Lucas Ferreira", position: "Central Mid", nationality: "Portugal", ageYears: 24, heightCm: 178, weightKg: 75, foot: "BOTH", jerseyNo: 6, wellness: "FIT", readiness: 84, goals: 2, assists: 5, minutes: 1650, yellow: 4, red: 0, squad: "first" },
  { id: "demo-player-8", name: "Noah Bergstrom", position: "Defensive Mid", nationality: "Sweden", ageYears: 27, heightCm: 185, weightKg: 80, foot: "RIGHT", jerseyNo: 4, wellness: "FIT", readiness: 89, goals: 1, assists: 3, minutes: 1890, yellow: 6, red: 1, squad: "first" },
  { id: "demo-player-9", name: "Ethan Walsh", position: "Center Back", nationality: "Ireland", ageYears: 28, heightCm: 190, weightKg: 84, foot: "RIGHT", jerseyNo: 5, wellness: "UNAVAILABLE", readiness: 34, goals: 1, assists: 1, minutes: 1420, yellow: 3, red: 0, squad: "first" },
  { id: "demo-player-10", name: "Aiden Murphy", position: "Center Back", nationality: "Ireland", ageYears: 25, heightCm: 188, weightKg: 82, foot: "LEFT", jerseyNo: 15, wellness: "FIT", readiness: 91, goals: 2, assists: 0, minutes: 1740, yellow: 2, red: 0, squad: "first" },
  { id: "demo-player-11", name: "Yusuf Demir", position: "Right Back", nationality: "Turkey", ageYears: 23, heightCm: 176, weightKg: 71, foot: "RIGHT", jerseyNo: 2, wellness: "FIT", readiness: 86, goals: 0, assists: 4, minutes: 1680, yellow: 3, red: 0, squad: "first" },
  { id: "demo-player-12", name: "Callum Reid", position: "Left Back", nationality: "Scotland", ageYears: 22, heightCm: 174, weightKg: 69, foot: "LEFT", jerseyNo: 3, wellness: "FIT", readiness: 90, goals: 1, assists: 5, minutes: 1590, yellow: 2, red: 0, squad: "first" },
  { id: "demo-player-13", name: "Mateo Rossi", position: "Goalkeeper", nationality: "Italy", ageYears: 26, heightCm: 191, weightKg: 85, foot: "RIGHT", jerseyNo: 1, wellness: "FIT", readiness: 93, goals: 0, assists: 0, minutes: 1980, yellow: 1, red: 0, squad: "first" },
  { id: "demo-player-14", name: "Finn O'Brien", position: "Goalkeeper", nationality: "Ireland", ageYears: 20, heightCm: 188, weightKg: 80, foot: "RIGHT", jerseyNo: 22, wellness: "FIT", readiness: 80, goals: 0, assists: 0, minutes: 270, yellow: 0, red: 0, squad: "dev" },
  { id: "demo-player-15", name: "Owen Bailey", position: "Center Back", nationality: "Wales", ageYears: 19, heightCm: 183, weightKg: 76, foot: "RIGHT", jerseyNo: 24, wellness: "FIT", readiness: 85, goals: 0, assists: 1, minutes: 540, yellow: 1, red: 0, squad: "dev" },
  { id: "demo-player-16", name: "Jayden Clarke", position: "Winger", nationality: "England", ageYears: 18, heightCm: 172, weightKg: 66, foot: "LEFT", jerseyNo: 27, wellness: "FIT", readiness: 88, goals: 5, assists: 3, minutes: 610, yellow: 0, red: 0, squad: "dev" },
];

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "")}@phoenixfc.demo`;
}

export const players = PLAYER_SEEDS.map((seed) => ({
  user: { id: seed.id, email: emailFor(seed.name), fullName: seed.name },
  membershipId: `${seed.id}-membership`,
  isCaptain: seed.id === "demo-player-1",
  profile: {
    dob: isoYearsAgo(seed.ageYears),
    nationality: seed.nationality,
    heightCm: seed.heightCm,
    weightKg: seed.weightKg,
    dominantFoot: seed.foot,
    positions: [seed.position],
    wellnessStatus: seed.wellness,
    hasInjury: seed.wellness === "UNAVAILABLE",
    readinessScore: seed.readiness,
    energyLevel: Math.max(20, Math.min(100, seed.readiness + 3)),
    sorenessLevel: Math.max(5, 100 - seed.readiness),
    sleepHours: 6 + (seed.readiness % 3),
    healthNotes: seed.wellness === "UNAVAILABLE" ? "Recovering from hamstring strain." : null,
    healthUpdatedAt: isoDaysFromNow(-1),
  },
  activeInjury:
    seed.wellness === "UNAVAILABLE"
      ? {
          id: `${seed.id}-injury-1`,
          type: "Hamstring strain",
          severity: "MEDIUM",
          startDate: isoDaysFromNow(-9),
          endDate: null,
          isActive: true,
        }
      : null,
  health: {
    status: seed.wellness === "FIT" ? "FIT" : seed.wellness === "LIMITED" ? "CAUTION" : "UNAVAILABLE",
    selectionStatus: seed.wellness === "UNAVAILABLE" ? "NOT_FIT" : "FIT",
    label: seed.wellness === "FIT" ? "Available" : seed.wellness === "LIMITED" ? "Managed load" : "Out injured",
    note: seed.wellness === "UNAVAILABLE" ? "Hamstring strain, day-to-day." : "",
    isFitToPlay: seed.wellness !== "UNAVAILABLE",
    selfReportedInjury: false,
    readinessScore: seed.readiness,
    wellnessStatus: seed.wellness,
    energyLevel: Math.max(20, Math.min(100, seed.readiness + 3)),
    sorenessLevel: Math.max(5, 100 - seed.readiness),
    sleepHours: 6 + (seed.readiness % 3),
    lastUpdatedAt: isoDaysFromNow(-1),
    activeInjury: null,
  },
}));

export const clubInjuries = players
  .filter((p) => p.activeInjury)
  .map((p) => ({
    id: p.activeInjury!.id,
    clubId: CLUB_ID,
    userId: p.user.id,
    type: p.activeInjury!.type,
    severity: p.activeInjury!.severity,
    description: "Picked up during full-intensity training.",
    startDate: p.activeInjury!.startDate,
    endDate: null,
    isActive: true,
    createdAt: p.activeInjury!.startDate,
    updatedAt: isoDaysFromNow(-1),
  }));

export const members = [
  {
    membershipId: MEMBERSHIP_ID,
    clubId: CLUB_ID,
    userId: USER_ID,
    primary: "ADMIN" as const,
    subRoles: ["COACH", "PHYSIO"] as const,
    createdAt: isoYearsAgo(1),
    user: demoUser,
  },
  {
    membershipId: "demo-membership-manager-1",
    clubId: CLUB_ID,
    userId: "demo-manager-1",
    primary: "MANAGER" as const,
    subRoles: [] as const,
    createdAt: isoYearsAgo(1),
    user: { id: "demo-manager-1", email: "priya.nandakumar@phoenixfc.demo", fullName: "Priya Nandakumar" },
  },
  ...players.map((p) => ({
    membershipId: p.membershipId,
    clubId: CLUB_ID,
    userId: p.user.id,
    primary: "PLAYER" as const,
    subRoles: [] as const,
    createdAt: isoYearsAgo(1),
    user: p.user,
  })),
];

export const squads = [
  {
    id: "demo-squad-1",
    clubId: CLUB_ID,
    name: "First Team",
    code: "FT",
    createdAt: isoYearsAgo(1),
    updatedAt: isoDaysFromNow(-2),
    _count: { members: PLAYER_SEEDS.filter((p) => p.squad === "first").length },
  },
  {
    id: "demo-squad-2",
    clubId: CLUB_ID,
    name: "Development Squad",
    code: "DEV",
    createdAt: isoYearsAgo(1),
    updatedAt: isoDaysFromNow(-5),
    _count: { members: PLAYER_SEEDS.filter((p) => p.squad === "dev").length },
  },
];

function squadMembersFor(squadId: string, key: "first" | "dev") {
  return PLAYER_SEEDS.filter((p) => p.squad === key).map((seed) => ({
    id: `${squadId}-${seed.id}`,
    squadId,
    userId: seed.id,
    jerseyNo: seed.jerseyNo,
    position: seed.position,
    createdAt: isoYearsAgo(1),
    user: { id: seed.id, email: emailFor(seed.name), fullName: seed.name },
  }));
}

export const squadDetails: Record<string, any> = {
  "demo-squad-1": { ...squads[0], members: squadMembersFor("demo-squad-1", "first") },
  "demo-squad-2": { ...squads[1], members: squadMembersFor("demo-squad-2", "dev") },
};

const OPPONENTS = [
  "Ironclad United",
  "Riverside Athletic",
  "Crestwood FC",
  "Harbor City SC",
  "Northfield Rangers",
  "Vale Wanderers",
  "Summit Town",
];

export const matches = [
  { id: "demo-match-1", offsetDays: -21, opponent: OPPONENTS[0], venue: "Home", status: "FINISHED", homeScore: 3, awayScore: 1 },
  { id: "demo-match-2", offsetDays: -14, opponent: OPPONENTS[1], venue: "Away", status: "FINISHED", homeScore: 1, awayScore: 1 },
  { id: "demo-match-3", offsetDays: -7, opponent: OPPONENTS[2], venue: "Home", status: "FINISHED", homeScore: 2, awayScore: 0 },
  { id: "demo-match-4", offsetDays: -2, opponent: OPPONENTS[3], venue: "Away", status: "FINISHED", homeScore: 0, awayScore: 2 },
  { id: "demo-match-5", offsetDays: 3, opponent: OPPONENTS[4], venue: "Home", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "demo-match-6", offsetDays: 10, opponent: OPPONENTS[5], venue: "Away", status: "SCHEDULED", homeScore: null, awayScore: null },
  { id: "demo-match-7", offsetDays: 17, opponent: OPPONENTS[6], venue: "Home", status: "SCHEDULED", homeScore: null, awayScore: null },
].map((m) => ({
  id: m.id,
  clubId: CLUB_ID,
  squadId: "demo-squad-1",
  squad: squads[0],
  title: `Phoenix FC vs ${m.opponent}`,
  opponent: m.opponent,
  venue: m.venue === "Home" ? "Phoenix Ground" : `${m.opponent} Stadium`,
  kickoffAt: isoDaysFromNow(m.offsetDays),
  status: m.status,
  homeScore: m.homeScore,
  awayScore: m.awayScore,
  createdAt: isoYearsAgo(1),
  updatedAt: isoDaysFromNow(Math.min(m.offsetDays, -1)),
}));

export const scheduleEvents = [
  { id: "demo-event-1", type: "TRAINING", title: "Full-squad training", offsetDays: 1, location: "Training Ground A" },
  { id: "demo-event-2", type: "MATCH", title: `vs ${OPPONENTS[4]}`, offsetDays: 3, location: "Phoenix Ground" },
  { id: "demo-event-3", type: "TRAINING", title: "Recovery + video review", offsetDays: 4, location: "Training Ground A" },
  { id: "demo-event-4", type: "TRAINING", title: "Set-piece drills", offsetDays: 6, location: "Training Ground B" },
  { id: "demo-event-5", type: "MATCH", title: `vs ${OPPONENTS[5]}`, offsetDays: 10, location: `${OPPONENTS[5]} Stadium` },
  { id: "demo-event-6", type: "TRAINING", title: "Pre-season fitness testing", offsetDays: -3, location: "Performance Lab" },
].map((e) => ({
  id: e.id,
  clubId: CLUB_ID,
  createdByUserId: USER_ID,
  type: e.type,
  title: e.title,
  description: null,
  eventAt: isoDaysFromNow(e.offsetDays),
  location: e.location,
  targetGroups: ["Players", "Coaches"],
  privateToUserId: null,
  createdAt: isoYearsAgo(1),
  updatedAt: isoYearsAgo(1),
}));

export const notifications = [
  { id: "demo-notif-1", title: "Match confirmed", body: `Kickoff vs ${OPPONENTS[4]} is set for ${new Date(isoDaysFromNow(3)).toLocaleDateString()}.`, isRead: false, offsetHours: -2 },
  { id: "demo-notif-2", title: "New marketplace offer", body: "A recruiter sent an offer to one of your listed players.", isRead: false, offsetHours: -20 },
  { id: "demo-notif-3", title: "Injury update", body: "Ethan Walsh's recovery timeline was updated by the physio.", isRead: true, offsetHours: -48 },
  { id: "demo-notif-4", title: "Squad announcement", body: "Development Squad training moved to Ground B this week.", isRead: true, offsetHours: -72 },
].map((n) => ({
  id: n.id,
  clubId: CLUB_ID,
  userId: USER_ID,
  scheduleEventId: null,
  title: n.title,
  body: n.body,
  link: null,
  isRead: n.isRead,
  createdAt: iso(now() + n.offsetHours * 60 * 60 * 1000),
}));

function buildLeaderboard(metric: "goals" | "assists" | "minutes") {
  const seedByUser = new Map(PLAYER_SEEDS.map((s) => [s.id, s]));
  return [...players]
    .map((p) => {
      const seed = seedByUser.get(p.user.id)!;
      return { user: { id: p.user.id, fullName: p.user.fullName, email: p.user.email }, totals: { goals: seed.goals, assists: seed.assists, minutes: seed.minutes, yellow: seed.yellow, red: seed.red } };
    })
    .sort((a, b) => (b.totals[metric] || 0) - (a.totals[metric] || 0))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export const leaderboards = {
  goals: buildLeaderboard("goals"),
  assists: buildLeaderboard("assists"),
  minutes: buildLeaderboard("minutes"),
};

export const marketplaceListings = [
  { id: "demo-listing-1", fullName: "Jordan Pace", headline: "Versatile winger seeking first-team minutes", positions: ["Winger"], nationality: "England", expectedSalary: 3200, offsetDays: -5 },
  { id: "demo-listing-2", fullName: "Bruno Silveira", headline: "Composed center back, strong in the air", positions: ["Center Back"], nationality: "Brazil", expectedSalary: 4100, offsetDays: -12 },
  { id: "demo-listing-3", fullName: "Marcin Kowalski", headline: "Box-to-box midfielder, high work rate", positions: ["Central Mid"], nationality: "Poland", expectedSalary: 3800, offsetDays: -3 },
  { id: "demo-listing-4", fullName: "Haruto Sato", headline: "Creative attacking midfielder, set-piece specialist", positions: ["Attacking Mid"], nationality: "Japan", expectedSalary: 4500, offsetDays: -18 },
  { id: "demo-listing-5", fullName: "Liam Fitzgerald", headline: "Young goalkeeper, excellent shot-stopper", positions: ["Goalkeeper"], nationality: "Ireland", expectedSalary: 2600, offsetDays: -1 },
  { id: "demo-listing-6", fullName: "Adama Traore", headline: "Explosive striker, proven finisher", positions: ["Striker"], nationality: "Mali", expectedSalary: 5200, offsetDays: -9 },
].map((l) => ({
  id: l.id,
  userId: `${l.id}-user`,
  fullName: l.fullName,
  email: emailFor(l.fullName),
  headline: l.headline,
  bio: "Available for trials and permanent transfers this window.",
  positions: l.positions,
  nationality: l.nationality,
  expectedSalary: l.expectedSalary,
  openToOffers: true,
  createdAt: isoDaysFromNow(l.offsetDays),
  offerCount: Math.max(0, 3 - Math.abs(l.offsetDays % 3)),
}));

export const myMarketplaceListing = {
  hasClubMembership: true,
  listing: null,
};

export const myMarketplaceOffers = {
  listing: null,
  offers: [],
};

export const recruiterOffers = [
  {
    id: "demo-offer-1",
    status: "PENDING" as const,
    message: "We'd love to bring you in for a trial week with our first team.",
    offeredSalary: 3600,
    createdAt: isoDaysFromNow(-2),
    respondedAt: null,
    listing: { id: "demo-listing-1", headline: marketplaceListings[0].headline, player: { id: "demo-listing-1-user", email: marketplaceListings[0].email, fullName: marketplaceListings[0].fullName } },
    recruiterClub: club,
  },
];

export const operationsTasks = [
  { id: "demo-task-1", title: "Confirm travel for away fixture", description: "Coach bus + hotel for the Riverside trip.", priority: "HIGH", status: "OPEN", assignedTo: "Priya Nandakumar", dueOffsetDays: 2 },
  { id: "demo-task-2", title: "Renew medical kit supplies", description: "Physio room running low on strapping tape.", priority: "MEDIUM", status: "PENDING", assignedTo: "Alex Morgan", dueOffsetDays: 5 },
  { id: "demo-task-3", title: "Finalize matchday programme", description: "Design + print for Saturday's home game.", priority: "LOW", status: "OPEN", assignedTo: "Priya Nandakumar", dueOffsetDays: 3 },
].map((t) => ({
  id: t.id,
  clubId: CLUB_ID,
  title: t.title,
  description: t.description,
  assignedToUserId: null,
  assignedToName: t.assignedTo,
  priority: t.priority,
  status: t.status,
  dueAt: isoDaysFromNow(t.dueOffsetDays),
  createdAt: isoDaysFromNow(-4),
  updatedAt: isoDaysFromNow(-1),
}));

export const operationsMessages = [
  { id: "demo-opmsg-1", title: "Training moved to Ground B", body: "Pitch A is being resurfaced this week, all sessions move to Ground B.", tone: "warn", audience: "ALL", isPinned: true, offsetDays: -1 },
  { id: "demo-opmsg-2", title: "Nutrition workshop Friday", body: "Optional session with the club nutritionist after training.", tone: "ok", audience: "PLAYERS", isPinned: false, offsetDays: -3 },
].map((m) => ({
  id: m.id,
  clubId: CLUB_ID,
  title: m.title,
  body: m.body,
  tone: m.tone,
  audience: m.audience,
  isPinned: m.isPinned,
  isActive: true,
  createdAt: isoDaysFromNow(m.offsetDays),
  updatedAt: isoDaysFromNow(m.offsetDays),
}));

export const operationsFeed = [
  { id: "demo-feed-1", text: "Match report published for vs Harbor City SC", offsetHours: -6 },
  { id: "demo-feed-2", text: "Marcus Webb reached 50 club goals", offsetHours: -30 },
  { id: "demo-feed-3", text: "New training load entries logged for First Team", offsetHours: -50 },
].map((f) => ({ id: f.id, clubId: CLUB_ID, text: f.text, createdAt: iso(now() + f.offsetHours * 60 * 60 * 1000) }));

export const operationsTraining = players
  .filter((p) => PLAYER_SEEDS.find((s) => s.id === p.user.id)?.squad === "first")
  .slice(0, 8)
  .map((p, i) => ({
    id: `demo-load-${i + 1}`,
    clubId: CLUB_ID,
    userId: p.user.id,
    createdByUserId: USER_ID,
    sessionDate: isoDaysFromNow(-i),
    sessionType: i % 2 === 0 ? "Field session" : "Gym + conditioning",
    durationMinutes: 75 + (i % 3) * 15,
    rpe: 5 + (i % 4),
    loadScore: 320 + i * 12,
    notes: null,
    createdAt: isoDaysFromNow(-i),
    updatedAt: isoDaysFromNow(-i),
  }));

export const dashboardOverviewKpis = {
  squads: squads.length,
  players: players.length,
  upcoming: matches.filter((m) => m.status === "SCHEDULED").length,
  injuries: clubInjuries.length,
};

export function buildDashboardCharts() {
  const days = 14;
  const points = (max: number, variance: number) =>
    Array.from({ length: days }).map((_, i) => ({
      x: isoDaysFromNow(-days + i + 1).slice(0, 10),
      y: Math.max(0, Math.round(max / 2 + Math.sin(i / 2) * variance + (i % 3))),
    }));

  return {
    series: [
      { name: "Matches Played", points: points(2, 1) },
      { name: "Goals", points: points(5, 2) },
      { name: "Assists", points: points(4, 2) },
    ],
  };
}

export function buildAnalyticsPayload() {
  const days = 10;
  const trend = Array.from({ length: days }).map((_, i) => ({
    day: isoDaysFromNow(-days + i + 1).slice(0, 10),
    entries: 2 + (i % 3),
    performance: 60 + Math.round(Math.sin(i / 2) * 15) + i,
    readiness: 70 + Math.round(Math.cos(i / 3) * 10),
    momentum: 55 + Math.round(Math.sin(i / 3) * 12) + i,
  }));

  return {
    totals: {
      entries: 24,
      averagePerformance: 78,
      averageReadiness: 82,
      averageMomentum: 74,
      averageCompleteness: 91,
      topCategory: "MATCH",
    },
    trend,
    metricsSummary: {
      strongest: { label: "Win Rate", average: 88 },
      weakest: { label: "Recovery Score", average: 61 },
    },
    latest: [
      {
        id: "demo-analytics-1",
        category: "MATCH" as const,
        subjectLabel: `vs ${OPPONENTS[3]}`,
        recordedAt: isoDaysFromNow(-2),
        notes: "Strong pressing performance, tired legs in the final 15.",
        performanceIndex: 84,
        readinessIndex: 76,
        momentumIndex: 80,
        dataCompleteness: 95,
        createdBy: demoUser,
      },
      {
        id: "demo-analytics-2",
        category: "CLUB" as const,
        subjectLabel: "Weekly club pulse",
        recordedAt: isoDaysFromNow(-6),
        notes: "Morale high after unbeaten run.",
        performanceIndex: 79,
        readinessIndex: 81,
        momentumIndex: 83,
        dataCompleteness: 88,
        createdBy: { fullName: "Priya Nandakumar" },
      },
    ],
  };
}

export const billingSummary = {
  club: { id: CLUB_ID, billingPlan: "PROFESSIONAL", effectiveBillingPlan: "PROFESSIONAL" },
  enabledFeatures: [
    { feature: "advanced_analytics", enabled: true },
    { feature: "marketplace_recruiting", enabled: true },
    { feature: "medical_management", enabled: true },
    { feature: "ai_assistant", enabled: false },
    { feature: "social_publishing", enabled: false },
  ],
};
