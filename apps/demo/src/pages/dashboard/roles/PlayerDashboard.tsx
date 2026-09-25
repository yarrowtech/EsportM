import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDashboardCharts,
  useDashboardOverview,
  useDashboardRecent,
} from "../../../hooks/useDashboard";
import { useMe } from "../../../hooks/useMe";
import DashboardAnalyticsLab from "../components/DashboardAnalyticsLab";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  cx,
  formatDate,
  formatDateTime,
} from "../../admin/admin-ui";

type Range = "7d" | "30d" | "90d";

type KPI = { key: string; label: string; value: number };
type PlayerTotals = {
  matches?: number;
  goals?: number;
  assists?: number;
  minutes?: number;
};
type PlayerInjury = {
  type?: string | null;
  severity?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};
type OverviewPayload = {
  kpis?: KPI[];
  player?: {
    totals?: PlayerTotals;
    activeInjury?: PlayerInjury | null;
  };
};
type ChartSeries = {
  name: string;
  axis?: "score" | "volume";
  kind?: "line" | "bar";
  points: Array<{ x: string; y: number }>;
};
type ChartsPayload = {
  series?: ChartSeries[];
  markers?: Array<{
    day: string;
    items?: Array<{ label: string; tone?: string }>;
  }>;
};
type MatchRow = {
  id: string;
  title?: string | null;
  opponent?: string | null;
  kickoffAt?: string | null;
  venue?: string | null;
  status?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
};
type InjuryRow = {
  id: string;
  type?: string | null;
  severity?: string | null;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};
type RecentPayload = { matches?: MatchRow[]; injuries?: InjuryRow[] };

function toNum(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeDateLabel(day: string) {
  if (!day) return day;
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function matchTone(status?: string | null) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

function injuryTone(severity?: string | null) {
  const normalized = String(severity || "").toUpperCase();
  if (normalized === "HIGH") return "danger";
  if (normalized === "MEDIUM") return "warn";
  return "ok";
}

export default function PlayerDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const meQuery = useMe();
  const overviewQuery = useDashboardOverview("PLAYER");
  const chartsQuery = useDashboardCharts(range, "PLAYER");
  const recentQuery = useDashboardRecent(12, "PLAYER");

  const loading =
    meQuery.isLoading ||
    overviewQuery.isLoading ||
    chartsQuery.isLoading ||
    recentQuery.isLoading;

  const overview = (overviewQuery.data || {}) as OverviewPayload;
  const charts = (chartsQuery.data || {}) as ChartsPayload;
  const recent = (recentQuery.data || {}) as RecentPayload;

  const meUser = (
    meQuery.data as { user?: { fullName?: string | null; email?: string } }
  )?.user;
  const playerName = meUser?.fullName || meUser?.email || "Player";
  const firstName = playerName.split(" ")[0] || "Player";

  const totals = overview.player?.totals || {};
  const totalMatches = toNum(totals.matches);
  const totalGoals = toNum(totals.goals);
  const totalAssists = toNum(totals.assists);
  const totalMinutes = toNum(totals.minutes);
  const goalsPer90 =
    totalMinutes > 0
      ? Number(((totalGoals * 90) / totalMinutes).toFixed(2))
      : 0;
  const assistsPer90 =
    totalMinutes > 0
      ? Number(((totalAssists * 90) / totalMinutes).toFixed(2))
      : 0;
  const contributions = totalGoals + totalAssists;

  const activeInjury = overview.player?.activeInjury || null;

  const chartData = useMemo(() => {
    const byDate = new Map<
      string,
      {
        minutes: number;
        contribution: number;
        readiness: number;
        trainingLoad: number;
      }
    >();

    for (const series of charts.series || []) {
      for (const point of series.points || []) {
        if (!byDate.has(point.x)) {
          byDate.set(point.x, {
            minutes: 0,
            contribution: 0,
            readiness: 0,
            trainingLoad: 0,
          });
        }
        const row = byDate.get(point.x)!;
        if (series.name === "Minutes") row.minutes = point.y || 0;
        if (series.name === "Contribution") row.contribution = point.y || 0;
        if (series.name === "Readiness") row.readiness = point.y || 0;
        if (series.name === "Training Load") row.trainingLoad = point.y || 0;
      }
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([day, values]) => ({
        rawDay: day,
        day: normalizeDateLabel(day),
        ...values,
      }));
  }, [charts.series]);

  const chartMarkers = useMemo(() => {
    return (charts.markers || []).map((marker) => ({
      ...marker,
      label: normalizeDateLabel(marker.day),
      items: marker.items || [],
    }));
  }, [charts.markers]);

  const matches = useMemo(() => {
    return [...(recent.matches || [])].sort((a, b) => {
      const ta = new Date(a.kickoffAt || 0).getTime();
      const tb = new Date(b.kickoffAt || 0).getTime();
      return tb - ta;
    });
  }, [recent.matches]);

  const nextMatch = useMemo(() => {
    return matches
      .filter((match) => {
        const kickoff = new Date(match.kickoffAt || "").getTime();
        const status = String(match.status || "").toUpperCase();
        return (
          Number.isFinite(kickoff) &&
          status !== "FINISHED" &&
          status !== "CANCELLED"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.kickoffAt || 0).getTime() -
          new Date(b.kickoffAt || 0).getTime(),
      )[0];
  }, [matches]);

  const recentInjuries = (recent.injuries || []).slice(0, 6);

  const clubKpiMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const kpi of overview.kpis || []) map.set(kpi.label, toNum(kpi.value));
    return map;
  }, [overview.kpis]);

  const clubPlayers = clubKpiMap.get("Players") || 0;
  const clubUpcoming = clubKpiMap.get("Upcoming Matches (7d)") || 0;

  const involvementRate =
    totalMatches > 0
      ? Math.min(100, Math.round((contributions / totalMatches) * 40))
      : 0;
  const readiness = activeInjury ? 45 : 88;
  const workload = Math.min(
    100,
    Math.round((totalMinutes / Math.max(1, totalMatches * 90)) * 100),
  );

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading player dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title={`Welcome, ${firstName}`}
        subtitle="Real-time player performance, match activity, and readiness in one workspace."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <DotTag>PLAYER</DotTag>
            <DotTag tone={activeInjury ? "warn" : "ok"}>
              {activeInjury ? "Limited" : "Fit"}
            </DotTag>
          </div>
        }
      />

      {overviewQuery.isError || chartsQuery.isError || recentQuery.isError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{
            borderColor: adminCardBorder,
            background: "rgba(255,255,255,.65)",
          }}
        >
          Some dashboard modules could not load. Try refresh.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="My Matches" value={totalMatches} />
        <Stat label="My Goals" value={totalGoals} />
        <Stat label="My Assists" value={totalAssists} />
        <Stat label="Minutes" value={totalMinutes} />
        <Stat label="Goals / 90" value={goalsPer90} />
        <Stat label="Assists / 90" value={assistsPer90} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Performance Trend"
          subtitle="Minutes, contribution, readiness, and training load by time range."
          className="xl:col-span-8"
          right={
            <div className="flex items-center gap-2">
              {(["7d", "30d", "90d"] as Range[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cx(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    range === option
                      ? "bg-[rgba(var(--primary),.24)]"
                      : "bg-white/70 hover:bg-white/90",
                  )}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-[290px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid
                    stroke="rgba(20,24,32,.12)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
                  />
                  <YAxis
                    yAxisId="score"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${adminCardBorder}`,
                      background: "rgba(255,255,255,.92)",
                    }}
                  />
                  {chartMarkers.map((marker) => (
                    <ReferenceLine
                      key={marker.day}
                      x={marker.label}
                      stroke="rgba(244,114,182,.55)"
                      strokeDasharray="4 4"
                    />
                  ))}
                  <Bar
                    yAxisId="volume"
                    dataKey="minutes"
                    fill="rgba(var(--primary-2), .45)"
                    radius={[8, 8, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    yAxisId="volume"
                    dataKey="trainingLoad"
                    fill="rgba(16,185,129,.28)"
                    radius={[8, 8, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="contribution"
                    stroke="rgba(var(--primary), .95)"
                    strokeWidth={2.6}
                    dot={{ r: 2 }}
                  />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="readiness"
                    stroke="rgba(244,114,182,.95)"
                    strokeWidth={2.4}
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">
                No trend data yet. Match stats, health check-ins, and admin
                training logs will populate this chart.
              </p>
            )}
          </div>
          {!!chartMarkers.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chartMarkers.slice(0, 6).map((marker) =>
                marker.items.map((item, index) => (
                  <DotTag
                    key={`${marker.day}-${item.label}-${index}`}
                    tone={
                      item.tone === "danger"
                        ? "danger"
                        : item.tone === "ok"
                          ? "ok"
                          : "warn"
                    }
                  >
                    {marker.label}: {item.label}
                  </DotTag>
                )),
              )}
            </div>
          )}
        </Section>

        <Section
          title="Readiness Panel"
          subtitle="Availability and next fixture signal."
          className="xl:col-span-4"
          dark
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Availability</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {activeInjury ? "Limited" : "Fully Fit"}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {activeInjury
                  ? `${activeInjury.type || "Injury"} (${activeInjury.severity || "N/A"})`
                  : "No active injury flagged"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Next match</p>
              <p className="mt-1 text-sm font-bold text-white">
                {nextMatch
                  ? nextMatch.title || `vs ${nextMatch.opponent || "Opponent"}`
                  : "No upcoming fixture"}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {nextMatch
                  ? `${formatDateTime(nextMatch.kickoffAt)} | ${nextMatch.venue || "Venue TBA"}`
                  : "-"}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="My Match Timeline"
          subtitle="Latest match records."
          className="xl:col-span-7"
        >
          {!matches.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              No matches found.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 7).map((match) => (
                <article
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--text))]">
                      {match.title || `vs ${match.opponent || "Opponent"}`}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {formatDateTime(match.kickoffAt)} |{" "}
                      {match.venue || "No venue"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DotTag tone={matchTone(match.status)}>
                      {match.status || "SCHEDULED"}
                    </DotTag>
                    <span className="text-xs font-bold text-[rgb(var(--text))]">
                      {typeof match.homeScore === "number" &&
                      typeof match.awayScore === "number"
                        ? `${match.homeScore} - ${match.awayScore}`
                        : "Pending"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Injury Log"
          subtitle="Recent medical updates."
          className="xl:col-span-5"
        >
          {!recentInjuries.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              No injury records in recent feed.
            </p>
          ) : (
            <div className="space-y-3">
              {recentInjuries.map((injury) => (
                <article
                  key={injury.id}
                  className={cx(
                    "rounded-xl border px-3 py-3",
                    injury.isActive ? "bg-rose-50/70" : "bg-white/74",
                  )}
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      {injury.type || "Injury"}
                    </p>
                    <DotTag tone={injuryTone(injury.severity)}>
                      {injury.severity || "LOW"}
                    </DotTag>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Start {formatDate(injury.startDate)} | End{" "}
                    {formatDate(injury.endDate)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section
        title="Focus Metrics"
        subtitle="Derived from your live stats and current club context."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <ProgressStat
            label="Contribution Rate"
            value={involvementRate}
            hint={`${contributions} G+A total`}
          />
          <ProgressStat
            label="Workload Index"
            value={workload}
            hint={`${totalMinutes} mins tracked`}
          />
          <ProgressStat
            label="Readiness"
            value={readiness}
            hint={
              activeInjury
                ? "Active injury present"
                : `Club has ${clubPlayers} players, ${clubUpcoming} upcoming`
            }
          />
        </div>
      </Section>
      <DashboardAnalyticsLab asRole="PLAYER" />
    </PageWrap>
  );
}

function ProgressStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <article
      className="rounded-2xl border bg-white/72 px-4 py-3"
      style={{ borderColor: adminCardBorder }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-[rgb(var(--muted))]">
          {label}
        </p>
        <p className="text-xs font-semibold text-[rgb(var(--text))]">{safe}%</p>
      </div>
      <div className="h-2 rounded-full bg-black/5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(3, safe)}%`,
            background:
              "linear-gradient(90deg, rgba(var(--primary),.88), rgba(var(--primary-2),.68))",
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{hint}</p>
    </article>
  );
}
