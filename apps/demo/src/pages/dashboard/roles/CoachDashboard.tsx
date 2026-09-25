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
import { useDashboardCharts, useDashboardOverview, useDashboardRecent } from "../../../hooks/useDashboard";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";
import DashboardAnalyticsLab from "../components/DashboardAnalyticsLab";

type Range = "7d" | "30d" | "90d";
type OverviewData = {
  kpis?: Array<{ key: string; label: string; value: number }>;
  work?: {
    coaching?: {
      last30Appearances?: number;
      last30Goals?: number;
      last30Assists?: number;
    };
  };
};
type ChartsData = {
  series?: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
};
type RecentData = {
  matches?: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt?: string | null;
    venue?: string | null;
    status?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }>;
  injuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    startDate?: string | null;
  }>;
};

const EMPTY_POINTS: Array<{ x: string; y: number }> = [];

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function seriesTotal(points: Array<{ y: number }> = []) {
  return points.reduce((sum, point) => sum + (point.y || 0), 0);
}

function statusTone(status?: string | null) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

export default function CoachDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const coachOverviewQuery = useDashboardOverview("COACH");
  const autoOverviewQuery = useDashboardOverview();
  const chartsQuery = useDashboardCharts(range, "COACH");
  const recentQuery = useDashboardRecent(12, "COACH");

  const overview = ((coachOverviewQuery.data || autoOverviewQuery.data || {}) as OverviewData) || {};
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading =
    (coachOverviewQuery.isLoading && autoOverviewQuery.isLoading) ||
    chartsQuery.isLoading ||
    recentQuery.isLoading;

  const coaching = overview.work?.coaching || {};
  const matches = [...(recent.matches || [])].sort(
    (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
  );
  const activeInjuries = (recent.injuries || []).filter((injury) => injury.isActive);

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const kpi of overview.kpis || []) map.set(kpi.key, Number(kpi.value) || 0);
    return map;
  }, [overview.kpis]);

  const seriesMap = useMemo(() => {
    const map = new Map<string, Array<{ x: string; y: number }>>();
    for (const series of charts.series || []) map.set(series.name, series.points || []);
    return map;
  }, [charts.series]);

  const goalsTrend = useMemo(() => seriesMap.get("Goals") || EMPTY_POINTS, [seriesMap]);
  const assistsTrend = useMemo(() => seriesMap.get("Assists") || EMPTY_POINTS, [seriesMap]);
  const matchTrend = useMemo(() => seriesMap.get("Matches Played") || EMPTY_POINTS, [seriesMap]);

  const chartData = useMemo(() => {
    const index = new Map<string, { goals: number; assists: number; matches: number }>();
    for (const point of goalsTrend) {
      index.set(point.x, { goals: point.y || 0, assists: 0, matches: 0 });
    }
    for (const point of assistsTrend) {
      const row = index.get(point.x) || { goals: 0, assists: 0, matches: 0 };
      row.assists = point.y || 0;
      index.set(point.x, row);
    }
    for (const point of matchTrend) {
      const row = index.get(point.x) || { goals: 0, assists: 0, matches: 0 };
      row.matches = point.y || 0;
      index.set(point.x, row);
    }

    return Array.from(index.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([x, row]) => ({ day: normalizeLabel(x), ...row }));
  }, [goalsTrend, assistsTrend, matchTrend]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading coach dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Coach Command"
        subtitle="Tactical output, match rhythm, and training influence from live club data."
        right={<DotTag>COACH</DotTag>}
      />

      {coachOverviewQuery.isError && autoOverviewQuery.isError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load coach context. Verify COACH role assignment in this active club.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Appearances (30d)" value={coaching.last30Appearances || 0} />
        <Stat label="Goals (30d)" value={coaching.last30Goals || 0} />
        <Stat label="Assists (30d)" value={coaching.last30Assists || 0} />
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
        <Stat label="Active Injuries" value={activeInjuries.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Performance Trend"
          subtitle="Goals, assists, and appearances by selected range."
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
          <div className="h-[290px]">
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
                    stroke="rgba(var(--primary-2), .8)"
                    fill="rgba(var(--primary-2), .18)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="goals"
                    stroke="rgba(var(--primary), .95)"
                    fill="rgba(var(--primary), .32)"
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
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No trend points available.</p>
            )}
          </div>
        </Section>

        <Section title="Injury Watch" subtitle="Active player concerns before fixtures." className="xl:col-span-4" dark>
          {!activeInjuries.length ? (
            <p className="text-sm text-white/75">No active injuries currently flagged.</p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.slice(0, 6).map((injury) => (
                <div key={injury.id} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <p className="text-sm font-bold text-white">
                    {injury.type || "Injury"} ({injury.severity || "N/A"})
                  </p>
                  <p className="text-xs text-white/70">Since {formatDateTime(injury.startDate)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Upcoming Fixtures" subtitle="Live upcoming schedule from club data.">
        {!matches.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No matches found.</p>
        ) : (
          <div className="space-y-3">
            {matches.slice(0, 8).map((match) => (
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
                    {formatDateTime(match.kickoffAt)} | {match.venue || "Venue TBA"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DotTag tone={statusTone(match.status)}>{match.status || "SCHEDULED"}</DotTag>
                  <span className="text-xs font-bold text-[rgb(var(--text))]">
                    {match.homeScore != null && match.awayScore != null
                      ? `${match.homeScore} - ${match.awayScore}`
                      : "Pending"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={`Goals (${range})`} value={seriesTotal(goalsTrend)} />
        <Stat label={`Assists (${range})`} value={seriesTotal(assistsTrend)} />
        <Stat label={`Appearances (${range})`} value={seriesTotal(matchTrend)} />
      </div>
      <DashboardAnalyticsLab asRole="COACH" />
    </PageWrap>
  );
}

