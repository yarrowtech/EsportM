import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMe } from "../../../hooks/useMe";
import { useDashboardCharts, useDashboardOverview, useDashboardRecent } from "../../../hooks/useDashboard";
import DashboardAnalyticsLab from "../components/DashboardAnalyticsLab";
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
  injuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    startDate?: string | null;
    endDate?: string | null;
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

export default function ClubAdminDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("30d");
  const meQuery = useMe();

  const overviewQuery = useDashboardOverview("ADMIN");
  const chartsQuery = useDashboardCharts(range, "ADMIN");
  const recentQuery = useDashboardRecent(20, "ADMIN");
  const meData = (meQuery.data || {}) as { isPlatformAdmin?: boolean };
  const isPlatformAdmin = !!meData.isPlatformAdmin;

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading = overviewQuery.isLoading || chartsQuery.isLoading || recentQuery.isLoading;

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

  const matches = [...(recent.matches || [])].sort(
    (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
  );
  const injuries = recent.injuries || [];
  const activeInjuries = injuries.filter((injury) => injury.isActive);

  const chartData = useMemo(() => {
    const index = new Map<string, { matches: number; goals: number; assists: number }>();
    for (const series of charts.series || []) {
      for (const point of series.points || []) {
        if (!index.has(point.x)) index.set(point.x, { matches: 0, goals: 0, assists: 0 });
        const row = index.get(point.x)!;
        if (series.name === "Matches Played") row.matches = point.y || 0;
        if (series.name === "Goals") row.goals = point.y || 0;
        if (series.name === "Assists") row.assists = point.y || 0;
      }
    }
    return Array.from(index.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([x, row]) => ({ day: normalizeLabel(x), ...row }));
  }, [charts.series]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading club-admin dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title={isPlatformAdmin ? "Superadmin Dashboard" : "Club Admin Dashboard"}
        subtitle={
          isPlatformAdmin
            ? "Platform-wide oversight with direct access to admin workspace and live operational signals."
            : "Executive club pulse from live metrics. Open full admin workspace for management actions."
        }
        right={
          <div className="flex items-center gap-2">
            <DotTag>{isPlatformAdmin ? "SUPERADMIN" : "ADMIN"}</DotTag>
            <button
              type="button"
              onClick={() => navigate("/admin/matches")}
              className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
              style={{ borderColor: adminCardBorder }}
            >
              Create Match
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/messages")}
              className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
              style={{ borderColor: adminCardBorder }}
            >
              Open Messages
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
              style={{ borderColor: adminCardBorder }}
            >
              Open Admin Workspace
            </button>
          </div>
        }
      />

      {(overviewQuery.isError || chartsQuery.isError || recentQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some admin modules failed to load. You can still use the full Admin Workspace.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Squads" value={byKey.get("squads") || 0} />
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
        <Stat label="Active Injuries" value={byKey.get("injuries") || activeInjuries.length} />
        <Stat label="Fixtures (recent)" value={matches.length} />
        <Stat label="Injury Records" value={injuries.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Club Trend"
          subtitle="Matches, goals, and assists over selected range."
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
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No trend data.</p>
            )}
          </div>
        </Section>

        <Section title="Health Risk Lens" subtitle="Current active medical risks." className="xl:col-span-4" dark>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Active injuries</p>
              <p className="text-2xl font-semibold text-white">{activeInjuries.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">High severity</p>
              <p className="text-2xl font-semibold text-white">
                {activeInjuries.filter((i) => String(i.severity || "").toUpperCase() === "HIGH").length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/65">Ongoing fixtures</p>
              <p className="text-2xl font-semibold text-white">
                {
                  matches.filter((m) => {
                    const status = String(m.status || "").toUpperCase();
                    return status !== "FINISHED" && status !== "CANCELLED";
                  }).length
                }
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Fixture Stream" subtitle="Near-term fixtures and status." className="xl:col-span-7">
          {!matches.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No fixtures available.</p>
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

        <Section title="Medical Feed" subtitle="Recent injuries in club stream." className="xl:col-span-5">
          {!injuries.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No injury updates.</p>
          ) : (
            <div className="space-y-3">
              {injuries.slice(0, 10).map((injury) => (
                <article
                  key={injury.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      {injury.type || "Injury"}
                    </p>
                    <DotTag
                      tone={String(injury.severity || "").toUpperCase() === "HIGH" ? "danger" : "warn"}
                    >
                      {injury.severity || "LOW"}
                    </DotTag>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Active: {String(injury.isActive)} | Start {formatDateTime(injury.startDate)} | End{" "}
                    {formatDateTime(injury.endDate)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>
      <DashboardAnalyticsLab asRole="ADMIN" canWrite />
    </PageWrap>
  );
}

