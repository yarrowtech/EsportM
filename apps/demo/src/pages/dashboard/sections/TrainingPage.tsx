import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsTraining } from "../../../hooks/useOperations";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type Range = "7d" | "30d" | "90d";
type TrainingPayload = {
  summary?: {
    squads?: number;
    players?: number;
    upcoming?: number;
    activeInjuries?: number;
    totalMatches?: number;
    totalGoals?: number;
    totalAssists?: number;
  };
  trend?: Array<{ day: string; matches: number; goals: number; assists: number }>;
  upcomingMatches?: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt?: string | null;
    venue?: string | null;
    status?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }>;
  activeInjuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    userId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
};

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TrainingPage() {
  const [range, setRange] = useState<Range>("30d");

  const trainingQuery = useOperationsTraining(range);
  const training = (trainingQuery.data || {}) as TrainingPayload;

  const loading = trainingQuery.isLoading;
  const summary = training.summary || {};
  const chartData = useMemo(
    () =>
      (training.trend || []).map((point) => ({
        day: normalizeLabel(point.day),
        matches: point.matches || 0,
        goals: point.goals || 0,
        assists: point.assists || 0,
      })),
    [training.trend]
  );

  const totalMatchLoad = chartData.reduce((sum, row) => sum + row.matches, 0);
  const totalGoalOutput = chartData.reduce((sum, row) => sum + row.goals, 0);
  const totalAssistOutput = chartData.reduce((sum, row) => sum + row.assists, 0);

  const recentMatches = [...(training.upcomingMatches || [])].sort(
    (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
  );

  const activeInjuries = training.activeInjuries || [];
  const intensity = Math.min(100, Math.round((totalMatchLoad * 10 + totalGoalOutput * 4) / 3));
  const execution = Math.min(100, Math.round((totalGoalOutput + totalAssistOutput) * 8));
  const readiness = Math.max(20, 95 - Math.min(60, Math.round(activeInjuries.length * 9)));

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading training center...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Training Center"
        subtitle="Live workload, output, and readiness generated from match and club performance data."
        right={<DotTag>TRAINING</DotTag>}
      />

      {trainingQuery.isError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some training metrics are unavailable right now.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label={`Session Load (${range})`} value={totalMatchLoad} />
        <Stat label={`Goals (${range})`} value={totalGoalOutput} />
        <Stat label={`Assists (${range})`} value={totalAssistOutput} />
        <Stat label="Players Available" value={summary.players || 0} />
        <Stat label="Upcoming Fixtures" value={summary.upcoming || 0} />
        <Stat label="Squads" value={summary.squads || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Load Trend"
          subtitle="Matches, goals and assists over selected training range."
          className="xl:col-span-8"
          right={
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d"] as Range[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    range === option ? "bg-[rgba(var(--primary),.24)]" : "bg-white/70 hover:bg-white/90"
                  }`}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-[300px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${adminCardBorder}`,
                      background: "rgba(255,255,255,.92)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="matches"
                    stroke="rgba(var(--primary-2), .82)"
                    fill="rgba(var(--primary-2), .18)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="goals"
                    stroke="rgba(var(--primary), .95)"
                    fill="rgba(var(--primary), .30)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="assists"
                    stroke="rgba(16,185,129,.92)"
                    fill="rgba(16,185,129,.20)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No training trend data in this range.</p>
            )}
          </div>
        </Section>

        <Section title="Readiness Bars" subtitle="Derived from live output and medical load." className="xl:col-span-4" dark>
          <ProgressBlock label="Intensity" value={intensity} />
          <ProgressBlock label="Execution" value={execution} />
          <ProgressBlock label="Readiness" value={readiness} />
          <div className="mt-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
            <p className="text-xs text-white/70">Active injuries</p>
            <p className="text-xl font-semibold text-white">{activeInjuries.length}</p>
          </div>
        </Section>
      </div>

      <Section title="Upcoming Session Board" subtitle="Nearest fixtures used for planning blocks.">
        {!recentMatches.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No upcoming schedule data available.</p>
        ) : (
          <div className="space-y-3">
            {recentMatches.slice(0, 8).map((match) => (
              <article
                key={match.id}
                className="rounded-2xl border bg-white/72 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <p className="text-sm font-semibold text-[rgb(var(--text))]">
                  {match.title || `vs ${match.opponent || "Opponent"}`}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {formatDateTime(match.kickoffAt)} | {match.venue || "Venue TBA"} | {match.status || "SCHEDULED"}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

function ProgressBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-white/70">{label}</p>
        <p className="text-xs font-bold text-white">{value}%</p>
      </div>
      <div className="h-2 rounded-full bg-white/15">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(3, Math.min(100, value))}%`,
            background: "linear-gradient(90deg, rgba(var(--primary),.9), rgba(255,255,255,.8))",
          }}
        />
      </div>
    </div>
  );
}

