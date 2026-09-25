import { http } from "./http";

export const authApi = {
  me: (clubId?: string) =>
    http
      .get("/auth/me", {
        params: clubId ? { clubId } : undefined,
      })
      .then((r) => r.data),
};

export const dashboardApi = {
  overview: (as?: string) =>
    http.get("/dashboard/overview", { params: { as } }).then(r => r.data),

  charts: (range: string, as?: string) =>
    http.get("/dashboard/charts", { params: { range, as } }).then(r => r.data),

  recent: (limit = 10, as?: string) =>
    http.get("/dashboard/recent", { params: { limit, as } }).then(r => r.data),

  analytics: (range: string, as?: string) =>
    http.get("/dashboard/analytics", { params: { range, as } }).then(r => r.data),

  createAnalytics: (payload: {
    category: "MATCH" | "PLAYER" | "CLUB";
    subjectLabel: string;
    recordedAt: string;
    notes?: string;
    metrics: Partial<Record<
      | "matchLoad"
      | "trainingLoad"
      | "winRate"
      | "possession"
      | "playerFitness"
      | "playerMorale"
      | "recoveryScore"
      | "clubCohesion"
      | "fanEngagement"
      | "disciplineScore",
      number
    >>;
  }) => http.post("/dashboard/analytics", payload).then(r => r.data),
};
