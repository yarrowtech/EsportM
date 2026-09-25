// A custom axios adapter that stands in for the real backend. Every request
// this app makes is routed here and answered from the in-memory demo store,
// so the whole product runs client-side with no server, ever.
import type { AxiosAdapter } from "axios";
import * as fx from "./fixtures";
import { state, nextId } from "./store";

type Handler = (ctx: { params: string[]; query: Record<string, string>; body: any }) => {
  data: unknown;
  status?: number;
};

type Route = { method: string; regex: RegExp; handler: Handler };

const routes: Route[] = [];

function on(method: string, path: string, handler: Handler) {
  const regex = new RegExp(
    "^" +
      path
        .split("/")
        .map((segment) => (segment.startsWith(":") ? "([^/]+)" : segment))
        .join("/") +
      "$"
  );
  routes.push({ method: method.toUpperCase(), regex, handler });
}

function meResponse() {
  return {
    user: { ...fx.demoUser, memberships: [{ id: fx.MEMBERSHIP_ID, primary: fx.membership.primary, subRoles: [...fx.membership.subRoles], club: fx.club }] },
    memberships: [{ clubId: fx.CLUB_ID, primary: fx.membership.primary, subRoles: [...fx.membership.subRoles], club: fx.club }],
    activeClubId: fx.CLUB_ID,
    activeMembership: { clubId: fx.CLUB_ID, primary: fx.membership.primary, subRoles: [...fx.membership.subRoles], club: fx.club },
    isPlatformAdmin: false,
  };
}

on("GET", "/auth/me", () => ({ data: meResponse() }));

on("GET", "/clubs/my", () => ({ data: [fx.club] }));

on("POST", "/clubs", ({ body }) => ({
  data: { club: { id: nextId("demo-club"), name: body?.name || "New Club", slug: body?.slug || "new-club" } },
}));

on("GET", "/clubs/:id/theme", () => ({ data: { theme: { mode: "light", primary: "#4f46e5", deep: "#111827" } } }));
on("PATCH", "/clubs/:id/theme", ({ body }) => ({
  data: { theme: { mode: "light", primary: "#4f46e5", deep: "#111827", ...body } },
}));

on("GET", "/clubs/:id/players", () => ({ data: { players: state.players } }));
on("PATCH", "/clubs/:id/players/:userId/profile", ({ params, body }) => {
  const player = state.players.find((p) => p.user.id === params[1]);
  if (player) Object.assign(player.profile, body);
  return { data: { profile: player?.profile || body } };
});

on("GET", "/clubs/:id/injuries", () => ({ data: state.injuries }));
on("POST", "/clubs/:id/injuries", ({ body }) => {
  const injury = { id: nextId("demo-injury"), clubId: fx.CLUB_ID, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
  state.injuries.unshift(injury);
  return { data: injury, status: 201 };
});

on("GET", "/clubs/:id/players/:userId/training-loads", ({ params }) => ({
  data: { entries: fx.operationsTraining.filter((entry) => entry.userId === params[1]) },
}));
on("POST", "/clubs/:id/players/:userId/training-loads", ({ params, body }) => ({
  data: { entry: { id: nextId("demo-load"), clubId: fx.CLUB_ID, userId: params[1], createdByUserId: fx.USER_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), loadScore: 300, ...body } },
  status: 201,
}));

on("GET", "/clubs/:id/members", () => ({ data: { members: state.members } }));
on("PATCH", "/clubs/:id/members/:userId", ({ params, body }) => {
  const member = state.members.find((m) => m.userId === params[1]);
  if (member) Object.assign(member, body);
  return { data: { member } };
});
on("DELETE", "/clubs/:id/members/:userId", ({ params }) => {
  const idx = state.members.findIndex((m) => m.userId === params[1]);
  if (idx >= 0) state.members.splice(idx, 1);
  return { data: { ok: true } };
});

on("GET", "/clubs/:id/squads", () => ({ data: { squads: state.squads } }));
on("GET", "/clubs/:id/squads/:squadId", ({ params }) => ({
  data: { squad: state.squadDetails[params[1]] || { ...state.squads.find((s) => s.id === params[1]), members: [] } },
}));
on("POST", "/clubs/:id/squads", ({ body }) => {
  const squad = { id: nextId("demo-squad"), clubId: fx.CLUB_ID, name: body?.name || "New Squad", code: body?.code || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { members: 0 } };
  state.squads.push(squad);
  state.squadDetails[squad.id] = { ...squad, members: [] };
  return { data: { squad }, status: 201 };
});
on("POST", "/clubs/:id/squads/:squadId/members", ({ params, body }) => {
  const detail = state.squadDetails[params[1]];
  const member = { id: nextId("demo-squad-member"), squadId: params[1], userId: body?.userId, jerseyNo: body?.jerseyNo ?? null, position: body?.position ?? null, createdAt: new Date().toISOString(), user: state.players.find((p) => p.user.id === body?.userId)?.user };
  if (detail) {
    detail.members.push(member);
    const squad = state.squads.find((s) => s.id === params[1]);
    if (squad) squad._count = { members: detail.members.length };
  }
  return { data: { member }, status: 201 };
});
on("DELETE", "/clubs/:id/squads/:squadId/members/:userId", ({ params }) => {
  const detail = state.squadDetails[params[1]];
  if (detail) {
    detail.members = detail.members.filter((m: any) => m.userId !== params[2]);
    const squad = state.squads.find((s) => s.id === params[1]);
    if (squad) squad._count = { members: detail.members.length };
  }
  return { data: { ok: true } };
});

on("GET", "/clubs/:id/matches", () => ({ data: { matches: state.matches } }));
on("POST", "/clubs/:id/matches", ({ body }) => {
  const match = {
    id: nextId("demo-match"),
    clubId: fx.CLUB_ID,
    squadId: body?.squadId || null,
    squad: state.squads.find((s) => s.id === body?.squadId) || null,
    title: body?.title || `vs ${body?.opponent || "Opponent"}`,
    opponent: body?.opponent || "Opponent",
    venue: body?.venue || "TBA",
    kickoffAt: body?.kickoffAt || new Date().toISOString(),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.matches.push(match as any);
  return { data: { match }, status: 201 };
});
on("PATCH", "/clubs/:id/matches/:matchId/status", ({ params, body }) => {
  const match = state.matches.find((m) => m.id === params[1]);
  if (match) Object.assign(match, body);
  return { data: { match } };
});
on("PATCH", "/clubs/:id/matches/:matchId/squad", ({ params, body }) => {
  const match = state.matches.find((m) => m.id === params[1]);
  if (match) (match as any).squadId = body?.squadId ?? null;
  return { data: { match } };
});
on("GET", "/clubs/:id/matches/:matchId/lineup/workspace", ({ params }) => {
  const match = state.matches.find((m) => m.id === params[1]);
  const roster = state.players.slice(0, 18).map((p) => ({
    squadMemberId: p.membershipId,
    userId: p.user.id,
    user: p.user,
    jerseyNo: null,
    position: p.profile.positions?.[0] || null,
    profile: p.profile,
    health: p.health,
    activeInjury: p.activeInjury,
    selectedSlot: null,
  }));
  const fit = roster.filter((r) => r.health?.status === "FIT").length;
  const caution = roster.filter((r) => r.health?.status === "CAUTION").length;
  const unavailable = roster.filter((r) => r.health?.status === "UNAVAILABLE").length;
  return {
    data: {
      match,
      availableSquads: state.squads,
      selectedSquad: state.squads[0],
      availability: { fit, caution, unavailable, noData: 0 },
      lineup: { id: null, formation: null, captainUserId: null, starting: [], bench: [] },
      roster,
    },
  };
});
on("PUT", "/clubs/:id/matches/:matchId/lineup/home", () => ({ data: [] }));

on("GET", "/clubs/:id/stats/leaderboard", ({ query }) => {
  const metric = (query.metric as "goals" | "assists" | "minutes") || "goals";
  const limit = Number(query.limit || 10);
  return { data: { leaderboard: (fx.leaderboards[metric] || fx.leaderboards.goals).slice(0, limit) } };
});

on("POST", "/clubs/:id/invite", ({ params, body }) => ({
  data: {
    ok: true,
    invite: { email: body?.email, clubId: params[0], primary: body?.primary, subRoles: body?.subRoles || [], expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), token: nextId("demo-token"), link: `${window.location.origin}/invitations/accept?token=demo` },
  },
  status: 201,
}));
on("GET", "/invitations/validate", () => ({
  data: { ok: true, invitation: { email: "invitee@phoenixfc.demo", clubId: fx.CLUB_ID, clubName: fx.club.name, primary: "PLAYER", subRoles: [], expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() } },
}));
on("POST", "/invitations/accept", () => ({ data: { ok: true } }));
on("GET", "/clubs/:id/signups/pending", () => ({
  data: { users: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0, hasNext: false, scope: "CLUB", q: "" } },
}));
on("POST", "/clubs/:id/signups/assign", () => ({ data: { assignment: { ok: true } } }));
on("GET", "/invitations/my-pending", () => ({ data: [] }));
on("POST", "/invitations/accept-assignment", () => ({ data: { ok: true, membership: { clubId: fx.CLUB_ID, primary: "PLAYER", subRoles: [], club: fx.club } } }));

on("GET", "/clubs/:id/schedule", () => ({ data: state.scheduleEvents }));
on("POST", "/clubs/:id/schedule", ({ body }) => {
  const event = { id: nextId("demo-event"), clubId: fx.CLUB_ID, createdByUserId: fx.USER_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), targetGroups: [], ...body };
  state.scheduleEvents.push(event);
  return { data: event, status: 201 };
});

on("GET", "/notifications", () => ({
  data: { notifications: state.notifications, unreadCount: state.notifications.filter((n) => !n.isRead).length },
}));
on("PATCH", "/notifications/:id/read", ({ params }) => {
  const notification = state.notifications.find((n) => n.id === params[0]);
  if (notification) notification.isRead = true;
  return { data: { ok: true } };
});

on("GET", "/dashboard/overview", () => ({
  data: {
    kpis: [
      { key: "squads", label: "Squads", value: state.squads.length },
      { key: "players", label: "Players", value: state.players.length },
      { key: "upcoming", label: "Upcoming (7d)", value: state.matches.filter((m) => m.status === "SCHEDULED").length },
      { key: "injuries", label: "Active Injuries", value: state.injuries.filter((i) => i.isActive).length },
    ],
  },
}));
on("GET", "/dashboard/charts", () => ({ data: fx.buildDashboardCharts() }));
on("GET", "/dashboard/recent", () => ({
  data: {
    matches: [...state.matches].sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime()),
    injuries: state.injuries,
  },
}));
on("GET", "/dashboard/analytics", () => ({ data: { ...fx.buildAnalyticsPayload(), latest: state.analyticsLatest } }));
on("POST", "/dashboard/analytics", ({ body }) => {
  const entry = {
    id: nextId("demo-analytics"),
    category: body?.category || "CLUB",
    subjectLabel: body?.subjectLabel || "Untitled",
    recordedAt: body?.recordedAt || new Date().toISOString(),
    notes: body?.notes || null,
    performanceIndex: body?.metrics?.winRate ?? body?.metrics?.matchLoad ?? 75,
    readinessIndex: body?.metrics?.playerFitness ?? body?.metrics?.recoveryScore ?? 75,
    momentumIndex: body?.metrics?.clubCohesion ?? body?.metrics?.fanEngagement ?? 75,
    dataCompleteness: Math.min(100, 40 + Object.keys(body?.metrics || {}).length * 10),
    createdBy: fx.demoUser,
  };
  state.analyticsLatest = [entry, ...state.analyticsLatest];
  return { data: entry, status: 201 };
});

on("GET", "/marketplace/listings", ({ query }) => {
  let listings = [...fx.marketplaceListings];
  if (query.search) {
    const q = query.search.toLowerCase();
    listings = listings.filter((l) => l.fullName.toLowerCase().includes(q) || l.headline.toLowerCase().includes(q));
  }
  if (query.position) listings = listings.filter((l) => l.positions.includes(query.position));
  const limit = Number(query.limit || listings.length);
  return {
    data: {
      count: listings.length,
      limit,
      availablePositions: Array.from(new Set(fx.marketplaceListings.flatMap((l) => l.positions))),
      listings: listings.slice(0, limit),
    },
  };
});
on("GET", "/marketplace/me/listing", () => ({ data: { hasClubMembership: true, listing: state.marketplaceListing } }));
on("POST", "/marketplace/me/listing", ({ body }) => {
  state.marketplaceListing = { id: nextId("demo-my-listing"), userId: fx.USER_ID, status: "ACTIVE", openToOffers: true, ...body };
  return { data: { listing: state.marketplaceListing } };
});
on("GET", "/marketplace/me/offers", () => ({ data: fx.myMarketplaceOffers }));
on("POST", "/marketplace/listings/:id/offers", () => ({ data: { ok: true }, status: 201 }));
on("GET", "/marketplace/recruiter/offers", () => ({ data: { offers: fx.recruiterOffers } }));
on("POST", "/marketplace/offers/:id/accept", () => ({ data: { ok: true } }));
on("POST", "/marketplace/offers/:id/reject", () => ({ data: { ok: true } }));

on("GET", "/billing/club/:id", () => ({ data: fx.billingSummary }));
on("POST", "/billing/razorpay/order", ({ body }) => ({
  data: { keyId: "demo", order: { id: nextId("demo-order"), amount: 0, currency: "INR" }, plan: body?.plan, amountInr: 0, billingCycle: body?.billingCycle, club: fx.club },
}));
on("POST", "/billing/razorpay/verify", () => ({ data: { ok: true } }));
on("POST", "/billing/schedule-downgrade", () => ({ data: { ok: true } }));

on("GET", "/clubs/:id/operations/training", () => ({ data: fx.operationsTraining }));
on("GET", "/clubs/:id/operations/tasks", () => ({ data: state.tasks }));
on("GET", "/clubs/:id/operations/feed", () => ({ data: fx.operationsFeed }));
on("GET", "/clubs/:id/operations/messages", () => ({ data: state.messages }));
on("POST", "/clubs/:id/operations/tasks", ({ body }) => {
  const task = { id: nextId("demo-task"), clubId: fx.CLUB_ID, status: "OPEN", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
  state.tasks.unshift(task);
  return { data: task, status: 201 };
});
on("PATCH", "/clubs/:id/operations/tasks/:taskId", ({ params, body }) => {
  const task = state.tasks.find((t) => t.id === params[1]);
  if (task) Object.assign(task, body);
  return { data: task };
});
on("POST", "/clubs/:id/operations/messages", ({ body }) => {
  const message = { id: nextId("demo-opmsg"), clubId: fx.CLUB_ID, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
  state.messages.unshift(message);
  return { data: message, status: 201 };
});
on("PATCH", "/clubs/:id/operations/messages/:messageId", ({ params, body }) => {
  const message = state.messages.find((m) => m.id === params[1]);
  if (message) Object.assign(message, body);
  return { data: message };
});

on("GET", "/players/me", () => ({ data: { profile: null } }));
on("GET", "/players/me/history", () => ({ data: { clubId: fx.CLUB_ID, wellnessEntries: [], trainingLoads: [] } }));
on("PATCH", "/players/me", ({ body }) => ({ data: { profile: body } }));

on("GET", "/social/feed", () => ({ data: { count: 0, posts: [] } }));

function findRoute(method: string, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.regex.exec(pathname);
    if (match) return { handler: route.handler, params: match.slice(1) };
  }
  return null;
}

function parseRequestUrl(url: string) {
  const [pathname, qs] = url.split("?");
  const query: Record<string, string> = {};
  if (qs) {
    for (const pair of qs.split("&")) {
      if (!pair) continue;
      const [k, v] = pair.split("=");
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  return { pathname, query };
}

function parseBody(data: unknown) {
  if (data == null) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = String(config.method || "get").toUpperCase();
  const { pathname, query } = parseRequestUrl(String(config.url || ""));
  if (config.params && typeof config.params === "object") {
    for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
      if (v !== undefined && v !== null) query[k] = String(v);
    }
  }
  const body = parseBody(config.data);

  await delay(180 + Math.round(Math.random() * 220));

  const matched = findRoute(method, pathname);
  const result = matched
    ? matched.handler({ params: matched.params, query, body })
    : { data: method === "GET" ? [] : { ok: true }, status: 200 };

  return {
    data: result.data,
    status: result.status ?? 200,
    statusText: "OK",
    headers: {},
    config,
    request: {},
  };
};
