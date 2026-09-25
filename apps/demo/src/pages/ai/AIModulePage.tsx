import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  CalendarDays,
  Compass,
  Grid2x2,
  House,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiApi } from "../../api/ai.api";
import { api } from "../../api/axios";
import "./ai-module.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: "openai" | "rule-based";
};

const QUICK_PROMPTS = [
  "Give me today's priorities in 3 points",
  "Who needs recovery focus this week",
  "What should we change in schedule next 3 days",
  "What is the top recommendation now",
];

function messageOf(error: unknown, fallback: string) {
  const typed = error as { response?: { data?: { message?: string } }; message?: string };
  return typed?.response?.data?.message || typed?.message || fallback;
}

function formatDateTime(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDay(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTrendLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function severityTone(level: string): "low" | "medium" | "high" {
  const normalized = String(level || "").toUpperCase();
  if (normalized === "HIGH" || normalized === "CRITICAL" || normalized === "MATCHDAY") return "high";
  if (normalized === "MEDIUM" || normalized === "LIGHT" || normalized === "RECOVERY") return "medium";
  return "low";
}

function Pill({ value }: { value: string }) {
  return <span className={`ai-ref-pill ai-ref-pill--${severityTone(value)}`}>{value}</span>;
}

export default function AIModulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const range = "30d";
  const scheduleDays = 7;
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [assistantMode, setAssistantMode] = useState<"openai" | "rule-based" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clubId = localStorage.getItem("activeClubId") || "";

  const insightsQuery = useQuery({
    queryKey: ["ai", "insights", clubId || "NO_CLUB", range, scheduleDays],
    enabled: !!clubId,
    queryFn: () => aiApi.insights(clubId, range, scheduleDays),
  });

  const meQuery = useQuery({
    queryKey: ["auth", "me", "ai-module"],
    enabled: !!clubId,
    queryFn: async () => {
      const response = await api.get<{
        user?: { fullName?: string | null; email?: string | null };
      }>("/auth/me");
      return response.data;
    },
    staleTime: 60_000,
  });

  const askMutation = useMutation({
    mutationFn: (input: { question: string; range: string; days: number }) =>
      aiApi.assistant(clubId, {
        question: input.question,
        range: input.range,
        days: input.days,
      }),
    onSuccess: (payload) => {
      setAssistantMode(payload.mode);
      setChat((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.answer,
          mode: payload.mode,
        },
      ]);
      queryClient.setQueryData(
        ["ai", "insights", clubId || "NO_CLUB", range, scheduleDays],
        payload.insights
      );
    },
    onError: (error: unknown) => {
      setChat((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: messageOf(error, "AI assistant failed to respond."),
        },
      ]);
    },
  });

  const insights = insightsQuery.data;

  const trendData = useMemo(
    () =>
      (insights?.trend || []).map((row) => ({
        day: formatTrendLabel(row.day),
        matches: row.matches,
        goals: row.goals,
        assists: row.assists,
      })),
    [insights?.trend]
  );

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !clubId || askMutation.isPending) return;
    setChat((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text: trimmed }]);
    setQuestion("");
    askMutation.mutate({ question: trimmed, range, days: scheduleDays });
  };

  const onAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  if (!clubId) {
    return (
      <div className="ai-ref-page ai-ref-page--empty">
        <section className="ai-ref-empty ai-ref-empty--single">
          <h1>AI Module Unavailable</h1>
          <p>
            AI analytics in EsportM is club-scoped. Select or join a club first from your
            dashboard.
          </p>
          <div className="ai-ref-empty-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Open Dashboard
            </button>
            <button type="button" className="is-secondary" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (insightsQuery.isLoading && !insights) {
    return (
      <div className="ai-ref-page ai-ref-page--empty">
        <section className="ai-ref-empty ai-ref-empty--single">
          <Loader2 size={18} className="ai-spin" />
          <h1>Loading AI Workspace</h1>
          <p>Preparing schedule, skill analysis, and recommendations.</p>
        </section>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="ai-ref-page ai-ref-page--empty">
        <section className="ai-ref-empty ai-ref-empty--single">
          <h1>AI Module Unavailable</h1>
          <p>{messageOf(insightsQuery.error, "Failed to load AI insights.")}</p>
        </section>
      </div>
    );
  }

  const scheduleItems = insights.schedule?.days?.slice(0, 3) || [];
  const recItems = (
    insights.recommendations.filter((row) => row.priority === "HIGH").length
      ? insights.recommendations.filter((row) => row.priority === "HIGH")
      : insights.recommendations
  ).slice(0, 2);
  const skill = insights.skills?.teamAverages;
  const recentChat = chat.slice(-3).reverse();
  const botHint = recItems[0]?.action || "Need a boost?";
  const displayName =
    meQuery.data?.user?.fullName?.trim() || meQuery.data?.user?.email?.trim() || "Coach";

  return (
    <div className="ai-ref-page">
      <div className="ai-ref-frame">
        <aside className="ai-ref-rail">
          <button
            type="button"
            className="ai-ref-rail-btn ai-ref-rail-btn--main"
            onClick={() => {
              setChat([]);
              setQuestion("");
              inputRef.current?.focus();
            }}
            aria-label="New prompt"
            data-tip="New Prompt"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className="ai-ref-rail-btn"
            onClick={() => ask("Search key risks right now")}
            aria-label="Search risk"
            data-tip="Search Risk"
          >
            <Search size={14} />
          </button>
          <button
            type="button"
            className="ai-ref-rail-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Open dashboard"
            data-tip="Dashboard"
          >
            <Compass size={14} />
          </button>
          <button
            type="button"
            className="ai-ref-rail-btn"
            onClick={() => navigate("/marketplace")}
            aria-label="Open marketplace"
            data-tip="Marketplace"
          >
            <Grid2x2 size={14} />
          </button>
          <button
            type="button"
            className="ai-ref-rail-btn"
            onClick={() => navigate("/social")}
            aria-label="Open social"
            data-tip="Social"
          >
            <TimerReset size={14} />
          </button>
          <button
            type="button"
            className="ai-ref-rail-logo"
            onClick={() => navigate("/")}
            aria-label="Go home"
            data-tip="Home"
          >
            <House size={13} />
          </button>
        </aside>

        <main className="ai-ref-canvas">
          <header className="ai-ref-topbar">
            <div className="ai-ref-topbar-left">
              <Sparkles size={12} />
              <span>Assistant v2.6</span>
            </div>
            <p>Daily EsportM</p>
            <button type="button" className="ai-ref-upgrade" onClick={() => ask("Give me an executive summary for leadership")}>
              <Sparkles size={12} />
              Upgrade
            </button>
          </header>

          <section className="ai-ref-hero">
            <div className="ai-ref-hero-copy">
              <h1>
                <span>Hi {displayName},</span> Ready to
                <br />
                Achieve Great Things?
              </h1>
            </div>
            <div className="ai-ref-hero-bot">
              <div className="ai-ref-bot-avatar">
                <Brain size={30} />
              </div>
              <div className="ai-ref-bot-msg">
                <strong>Hey there</strong>
                <p>{botHint}</p>
              </div>
            </div>
          </section>

          <section className="ai-ref-card-grid">
            <article className="ai-ref-card">
              <div className="ai-ref-card-icon ai-ref-card-icon--one">
                <CalendarDays size={18} />
              </div>
              <p className="ai-ref-card-text">
                Organize daily training and match prep using live schedule intelligence.
              </p>
              {!scheduleItems.length ? (
                <small className="ai-ref-card-sub">No schedule currently available</small>
              ) : (
                <ul className="ai-ref-mini-list">
                  {scheduleItems.map((item) => (
                    <li key={item.date}>
                      <span>{formatDay(item.date)}</span>
                      <Pill value={item.load} />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="ai-ref-card ai-ref-card--lift">
              <div className="ai-ref-card-icon ai-ref-card-icon--two">
                <Sparkles size={18} />
              </div>
              <p className="ai-ref-card-text">
                Stay connected with AI recommendations and align your team on high-impact actions.
              </p>
              {!recItems.length ? (
                <small className="ai-ref-card-sub">No urgent recommendation right now</small>
              ) : (
                <ul className="ai-ref-mini-list ai-ref-mini-list--wide">
                  {recItems.map((row) => (
                    <li key={row.id}>
                      <span>{row.title}</span>
                      <Pill value={row.priority} />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="ai-ref-card">
              <div className="ai-ref-card-icon ai-ref-card-icon--three">
                <Compass size={18} />
              </div>
              <p className="ai-ref-card-text">
                Track team skill snapshot and keep focus on finishing, creation, and discipline.
              </p>
              {!skill ? (
                <small className="ai-ref-card-sub">No skill analysis currently available</small>
              ) : (
                <div className="ai-ref-skill-row">
                  <div>
                    <span>Overall</span>
                    <strong>{skill.overall}</strong>
                  </div>
                  <div>
                    <span>Finish</span>
                    <strong>{skill.finishing}</strong>
                  </div>
                  <div>
                    <span>Create</span>
                    <strong>{skill.creation}</strong>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="ai-ref-composer">
            <div className="ai-ref-composer-top">
              <p>
                <Sparkles size={12} />
                {messageOf(insightsQuery.error, "Live insights connected")}
              </p>
              <span>{assistantMode ? `Powered by ${assistantMode}` : "Powered by Assistant v2.6"}</span>
            </div>

            <form onSubmit={onAsk} className="ai-ref-input">
              <input
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder='Example: "What should be our training focus tomorrow?"'
              />
              <button type="submit" disabled={askMutation.isPending || !question.trim()}>
                {askMutation.isPending ? <Loader2 size={14} className="ai-spin" /> : <Send size={14} />}
              </button>
            </form>

            <div className="ai-ref-actions">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  disabled={askMutation.isPending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          <details className="ai-ref-advanced">
            <summary>Live output</summary>
            <div className="ai-ref-advanced-grid">
              <article className="ai-ref-advanced-card">
                <h3>Recent AI Notes</h3>
                {!recentChat.length ? (
                  <p className="ai-ref-muted">No conversation yet.</p>
                ) : (
                  recentChat.map((item) => (
                    <div key={item.id} className={`ai-ref-note ${item.role === "user" ? "is-user" : ""}`}>
                      <div>
                        <strong>{item.role === "user" ? "You" : "Assistant"}</strong>
                        {item.mode ? <Pill value={item.mode} /> : null}
                      </div>
                      <p>{item.text}</p>
                    </div>
                  ))
                )}
              </article>

              <article className="ai-ref-advanced-card">
                <h3>Trend</h3>
                <div className="ai-ref-chart">
                  {trendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid stroke="rgba(95,94,166,0.12)" strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6a7190" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#6a7190" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid rgba(95,94,166,0.2)",
                            background: "rgba(255,255,255,0.96)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="matches"
                          stroke="rgba(109,108,135,.9)"
                          fill="rgba(109,108,135,.16)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="goals"
                          stroke="rgba(95,94,166,.95)"
                          fill="rgba(95,94,166,.2)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="assists"
                          stroke="rgba(55,146,114,.95)"
                          fill="rgba(55,146,114,.14)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="ai-ref-muted">No trend points available.</p>
                  )}
                </div>
              </article>
            </div>
            <p className="ai-ref-updated">Updated {formatDateTime(insights.generatedAt)}</p>
          </details>
        </main>
      </div>
    </div>
  );
}
