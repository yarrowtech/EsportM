import { http } from "./http";

export type AiRange = "7d" | "30d" | "90d";

export type AiRecommendation = {
  id: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category?: "MEDICAL" | "SCHEDULE" | "SKILL" | "OPERATIONS";
  confidence?: number;
  impactScore?: number;
  title: string;
  reason: string;
  action: string;
};

export type AiTrendPoint = {
  day: string;
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
};

export type AiInsights = {
  club?: { id: string; name: string; slug: string };
  generatedAt: string;
  rangeDays: number;
  summary: {
    players: number;
    squads: number;
    matchesInRange: number;
    upcoming7d: number;
    activeInjuries: number;
    highSeverityInjuries: number;
    openTasks: number;
    dueSoonTasks: number;
    highPriorityTasks: number;
    messagesLast24h: number;
    totalGoals: number;
    totalAssists: number;
    totalMinutes: number;
  };
  risk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    drivers: {
      injuryPressure: number;
      dueSoonPressure: number;
      backlogPressure: number;
      fixturePressure: number;
    };
  };
  trend: AiTrendPoint[];
  topPerformers: {
    goals: Array<{ userId: string; name: string; value: number }>;
    assists: Array<{ userId: string; name: string; value: number }>;
    minutes: Array<{ userId: string; name: string; value: number }>;
  };
  upcomingMatches: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt: string;
    venue?: string | null;
    status: string;
    scoreline: string;
  }>;
  activeInjuries: Array<{
    id: string;
    userId: string;
    playerName: string;
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    startDate: string;
    endDate?: string | null;
  }>;
  recommendations: AiRecommendation[];
  skills?: {
    generatedAt: string;
    teamAverages: {
      finishing: number;
      creation: number;
      endurance: number;
      discipline: number;
      overall: number;
    };
    leaders?: {
      overall: Array<{ userId: string; name: string; value: number }>;
    };
    players: Array<{
      userId: string;
      name: string;
      matches: number;
      totals: { goals: number; assists: number; minutes: number; yellow: number; red: number };
      per90: { goals: number; assists: number };
      indices: {
        finishing: number;
        creation: number;
        endurance: number;
        discipline: number;
        overall: number;
      };
    }>;
  };
  schedule?: {
    generatedAt: string;
    window: { from: string; to: string; days: number };
    summary: {
      matchDays: number;
      recoveryDays: number;
      intensiveDays: number;
      lightDays: number;
    };
    days: Array<{
      date: string;
      load: "MATCHDAY" | "RECOVERY" | "INTENSIVE" | "LIGHT";
      focus: string;
      taskPressure: { due: number; high: number };
      linkedMatch?: {
        id: string;
        title?: string | null;
        opponent?: string | null;
        kickoffAt: string;
        venue?: string | null;
      } | null;
    }>;
  };
  recommendationSystem?: {
    generatedAt: string;
    version: string;
    riskContext: { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };
    categories: {
      MEDICAL: AiRecommendation[];
      SCHEDULE: AiRecommendation[];
      SKILL: AiRecommendation[];
      OPERATIONS: AiRecommendation[];
    };
    prioritized: Array<{ rank: number } & AiRecommendation>;
    automationCandidates: Array<{ id: string; title: string; eligible: boolean }>;
  };
  dataQuality: {
    statRows: number;
    playersWithStats: number;
    lastFinishedMatchAt?: string | null;
  };
};

export type AskAiPayload = {
  question: string;
  range?: string;
  lensRole?: string;
  days?: number;
};

export type AskAiResponse = {
  mode: "openai" | "rule-based";
  model?: string | null;
  generatedAt: string;
  answer: string;
  insights: AiInsights;
};

export const aiApi = {
  insights: (clubId: string, range: string = "30d", days: number = 7) =>
    http
      .get<AiInsights>(`/clubs/${encodeURIComponent(clubId)}/ai/insights`, {
        params: { range, days },
      })
      .then((response) => response.data),

  schedule: (clubId: string, range: string = "30d", days: number = 7) =>
    http
      .get<{ schedule: AiInsights["schedule"]; risk: AiInsights["risk"] }>(
        `/clubs/${encodeURIComponent(clubId)}/ai/schedule`,
        { params: { range, days } }
      )
      .then((response) => response.data),

  skills: (clubId: string, range: string = "30d") =>
    http
      .get<{ skills: AiInsights["skills"]; topPerformers: AiInsights["topPerformers"] }>(
        `/clubs/${encodeURIComponent(clubId)}/ai/skills`,
        { params: { range } }
      )
      .then((response) => response.data),

  recommendations: (clubId: string, range: string = "30d", days: number = 7) =>
    http
      .get<{
        recommendations: AiRecommendation[];
        recommendationSystem: AiInsights["recommendationSystem"];
      }>(`/clubs/${encodeURIComponent(clubId)}/ai/recommendations`, {
        params: { range, days },
      })
      .then((response) => response.data),

  assistant: (clubId: string, payload: AskAiPayload) =>
    http
      .post<AskAiResponse>(`/clubs/${encodeURIComponent(clubId)}/ai/assistant`, payload)
      .then((response) => response.data),
};
