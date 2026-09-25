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

export default function PitchManagerDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const overviewQuery = useDashboardOverview("PITCH_MANAGER");
  const chartsQuery = useDashboardCharts(range, "PITCH_MANAGER");
  const recentQuery = useDashboardRecent(16, "PITCH_MANAGER");

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading = overviewQuery.isLoading || chartsQuery.isLoading || recentQuery.isLoading;

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

  const matches = useMemo(
    () =>
      [...(recent.matches || [])].sort(
        (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
      ),
    [recent.matches]
  );

  const chartData = useMemo(() => {
    const index = new Map<string, { matches: number }>();
    const series = (charts.series || []).find((item) => item.name === "Matches Played");
    for (const point of series?.points || []) {
      index.set(point.x, { matches: point.y || 0 });
    }
    return Array.from(index.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([x, row]) => ({ day: normalizeLabel(x), ...row }));
  }, [charts.series]);

  const liveNow = matches.filter((m) => String(m.status || "").toUpperCase() === "LIVE").length;
  const pendingPrep = matches.filter((m) => String(m.status || "").toUpperCase() === "SCHEDULED").length;
  const completed = matches.filter((m) => String(m.status || "").toUpperCase() === "FINISHED").length;

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading pitch manager dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Pitch Control"
        subtitle="Fixture readiness and ground operations from live scheduling data."
        right={<DotTag>PITCH_MANAGER</DotTag>}
      />

      {(overviewQuery.isError || chartsQuery.isError || recentQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some pitch modules could not load. Try refresh.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
        <Stat label="Live Matches" value={liveNow} />
        <Stat label="Scheduled Prep" value={pendingPrep} />
        <Stat label="Completed" value={completed} />
        <Stat label="Squads" value={byKey.get("squads") || 0} />
        <Stat label="Players" value={byKey.get("players") || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Ground Utilization Trend"
          subtitle="Match load trend for venue readiness."
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
                    stroke="rgba(var(--primary), .92)"
                    fill="rgba(var(--primary), .28)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No utilization points in selected range.</p>
            )}
          </div>
        </Section>

        <Section title="Ops Snapshot" subtitle="Current operational load." className="xl:col-span-4" dark>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Live events</p>
              <p className="text-2xl font-semibold text-white">{liveNow}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Prep queue</p>
              <p className="text-2xl font-semibold text-white">{pendingPrep}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Recommendation</p>
              <p className="text-sm font-bold text-white">
                {pendingPrep > 3 ? "Increase prep crew" : "Current staffing is sufficient"}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Fixture Operations Board" subtitle="Chronological fixture list for ground operations.">
        {!matches.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No fixtures found.</p>
        ) : (
          <div className="space-y-3">
            {matches.slice(0, 12).map((match) => (
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
                <DotTag tone={statusTone(match.status)}>{match.status || "SCHEDULED"}</DotTag>
              </article>
            ))}
          </div>
        )}
      </Section>
      <DashboardAnalyticsLab asRole="PITCH_MANAGER" />
    </PageWrap>
  );
}

