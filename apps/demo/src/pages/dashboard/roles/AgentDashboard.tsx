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
  cx,
  formatDateTime,
} from "../../admin/admin-ui";
import DashboardAnalyticsLab from "../components/DashboardAnalyticsLab";

type Range = "7d" | "30d" | "90d";
type OverviewData = {
  kpis?: Array<{ key: string; label: string; value: number }>;
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
};

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusTone(status?: string | null) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

export default function AgentDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const overviewQuery = useDashboardOverview("AGENT");
  const chartsQuery = useDashboardCharts(range, "AGENT");
  const recentQuery = useDashboardRecent(12, "AGENT");

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading = overviewQuery.isLoading || chartsQuery.isLoading || recentQuery.isLoading;

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

  const chartData = useMemo(() => {
    const index = new Map<string, { goals: number; assists: number; matches: number }>();
    for (const series of charts.series || []) {
      for (const point of series.points || []) {
        if (!index.has(point.x)) index.set(point.x, { goals: 0, assists: 0, matches: 0 });
        const row = index.get(point.x)!;
        if (series.name === "Goals") row.goals = point.y || 0;
        if (series.name === "Assists") row.assists = point.y || 0;
        if (series.name === "Matches Played") row.matches = point.y || 0;
      }
    }
    return Array.from(index.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([x, row]) => ({ day: normalizeLabel(x), ...row }));
  }, [charts.series]);

  const matches = useMemo(
    () =>
      [...(recent.matches || [])].sort(
        (a, b) => new Date(b.kickoffAt || 0).getTime() - new Date(a.kickoffAt || 0).getTime()
      ),
    [recent.matches]
  );

  const projectedValue = Math.max(
    0,
    Math.round((byKey.get("players") || 0) * 125000 + (byKey.get("upcoming") || 0) * 15000)
  );

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading agent dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Agent Desk"
        subtitle="Performance and fixture signals to support player representation decisions."
        right={<DotTag>AGENT</DotTag>}
      />

      {(overviewQuery.isError || chartsQuery.isError || recentQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some agent modules could not load. Try refresh.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
        <Stat label="Matches Tracked" value={matches.length} />
        <Stat label="Injuries" value={byKey.get("injuries") || 0} />
        <Stat label="Projected Value" value={`$${projectedValue.toLocaleString()}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Market Trend"
          subtitle="Goals, assists, and appearances trend across range."
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
                    range === option ? "bg-[rgba(var(--primary),.24)]" : "bg-white/70 hover:bg-white/90"
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
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No trend points available.</p>
            )}
          </div>
        </Section>

        <Section title="Deal Radar" subtitle="Live contract-facing context." className="xl:col-span-4" dark>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Upcoming fixtures</p>
              <p className="text-2xl font-semibold text-white">{byKey.get("upcoming") || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Open injury concerns</p>
              <p className="text-2xl font-semibold text-white">{byKey.get("injuries") || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Negotiation signal</p>
              <p className="text-sm font-bold text-white">
                {(byKey.get("injuries") || 0) > 2 ? "Risk-adjust value" : "Stable value band"}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Fixture Ledger" subtitle="Recent fixtures with score and status.">
        {!matches.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No fixtures found.</p>
        ) : (
          <div className="space-y-3">
            {matches.slice(0, 10).map((match) => (
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
      <DashboardAnalyticsLab asRole="AGENT" />
    </PageWrap>
  );
}

