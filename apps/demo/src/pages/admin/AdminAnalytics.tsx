import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getClubMatches,
  getClubPlayers,
  getClubSquads,
  getLeaderboard,
  type LeaderboardMetric,
  type LeaderboardRow,
} from "../../api/admin.api";
import { dashboardApi } from "../../api/dashboard.api";
import { operationsApi } from "../../api/operations.api";
import { type RolePermission } from "../../utils/rolePolicy";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
} from "./admin-ui";

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type DashboardChartPayload = {
  series?: Array<{
    name: string;
    points: Array<{ x: string; y: number }>;
  }>;
};

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
  activeInjuries?: Array<{ id: string; severity?: string | null; isActive?: boolean }>;
};

type TaskPayload = {
  counts?: { total?: number; high?: number; open?: number; dueSoon?: number };
};

type FeedPayload = {
  feed?: Array<{
    id: string;
    kind: "MATCH" | "INJURY" | "SIGNUP" | "MESSAGE";
    ts: string;
  }>;
};

type RoleLens = "ADMIN" | "MANAGER" | "PLAYER" | "COACH" | "PHYSIO" | "AGENT" | "NUTRITIONIST" | "PITCH_MANAGER";
const ROLE_LENSES: RoleLens[] = [
  "ADMIN",
  "MANAGER",
  "PLAYER",
  "COACH",
  "PHYSIO",
  "AGENT",
  "NUTRITIONIST",
  "PITCH_MANAGER",
];

const RANGES = ["7d", "30d", "90d"] as const;

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function metricValue(row: LeaderboardRow, metric: LeaderboardMetric) {
  if (row?.totals && typeof row.totals[metric] === "number") return row.totals[metric] ?? 0;
  if (typeof row?.value === "number") return row.value;
  if (typeof row?.score === "number") return row.score;
  if (typeof row?.[metric] === "number") return row[metric] as number;
  return 0;
}

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminAnalytics() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const canRead = (ctx.permissions || []).includes("stats.read");

  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [metric, setMetric] = useState<LeaderboardMetric>("goals");
  const [compareMetric, setCompareMetric] = useState<LeaderboardMetric>("assists");
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [lensRole, setLensRole] = useState<RoleLens>("ADMIN");

  const [playersCount, setPlayersCount] = useState(0);
  const [squadsCount, setSquadsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [compareBoard, setCompareBoard] = useState<LeaderboardRow[]>([]);
  const [chartsPayload, setChartsPayload] = useState<DashboardChartPayload>({});
  const [trainingPayload, setTrainingPayload] = useState<TrainingPayload>({});
  const [tasksPayload, setTasksPayload] = useState<TaskPayload>({});
  const [feedPayload, setFeedPayload] = useState<FeedPayload>({});
  const [roleSnapshots, setRoleSnapshots] = useState<
    Array<{
      role: RoleLens;
      ok: boolean;
      note: string;
      kpis: Record<string, number>;
    }>
  >([]);

  useEffect(() => {
    let alive = true;

    async function loadMain() {
      if (!clubId) {
        setErr("No club selected. Please choose a club from the header.");
        setLoading(false);
        return;
      }
      if (!canRead) {
        setErr("You do not have permission to view analytics for this club.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        const [players, squads, matches, board, boardCompare, chartRes, training, tasks, feed] =
          await Promise.all([
            getClubPlayers(clubId),
            getClubSquads(clubId),
            getClubMatches(clubId),
            getLeaderboard(clubId, metric, 14),
            getLeaderboard(clubId, compareMetric, 14),
            dashboardApi.charts(range, lensRole),
            operationsApi.training(clubId, range),
            operationsApi.tasks(clubId, 80),
            operationsApi.feed(clubId, 80),
          ]);

        if (!alive) return;
        setPlayersCount(players.length);
        setSquadsCount(squads.length);
        setMatchesCount(matches.length);
        setLeaderboard(board || []);
        setCompareBoard(boardCompare || []);
        setChartsPayload((chartRes || {}) as DashboardChartPayload);
        setTrainingPayload((training || {}) as TrainingPayload);
        setTasksPayload((tasks || {}) as TaskPayload);
        setFeedPayload((feed || {}) as FeedPayload);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(messageOf(e, "Failed to load analytics data."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadMain();
    return () => {
      alive = false;
    };
  }, [canRead, clubId, compareMetric, lensRole, metric, range]);

  useEffect(() => {
    let alive = true;

    async function loadRoleSnapshots() {
      if (!clubId || !canRead) {
        setRoleSnapshots([]);
        return;
      }

      setRoleLoading(true);
      const settled = await Promise.allSettled(
        ROLE_LENSES.map(async (role) => {
          const data = await dashboardApi.overview(role);
          const kpis = Array.isArray(data?.kpis)
            ? data.kpis.reduce((acc: Record<string, number>, item: { key: string; value: number }) => {
                acc[item.key] = Number(item.value) || 0;
                return acc;
              }, {})
            : {};
          return { role, ok: true, note: "Live", kpis };
        })
      );

      if (!alive) return;
      setRoleSnapshots(
        settled.map((result, index) => {
          const role = ROLE_LENSES[index];
          if (result.status === "fulfilled") return result.value;
          return {
            role,
            ok: false,
            note: messageOf(result.reason, "Unavailable"),
            kpis: {},
          };
        })
      );
      setRoleLoading(false);
    }

    void loadRoleSnapshots();
    return () => {
      alive = false;
    };
  }, [canRead, clubId]);

  const trendData = useMemo(() => {
    const byDay = new Map<string, Record<string, number>>();
    const series = chartsPayload.series || [];

    for (const line of series) {
      for (const point of line.points || []) {
        if (!byDay.has(point.x)) byDay.set(point.x, {});
        byDay.get(point.x)![line.name] = point.y;
      }
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([day, values]) => ({
        day: normalizeLabel(day),
        matches: values["Matches Played"] || 0,
        goals: values["Goals"] || 0,
        assists: values["Assists"] || 0,
      }));
  }, [chartsPayload.series]);

  const leaderboardBars = useMemo(() => {
    return leaderboard.slice(0, 10).map((row, index) => ({
      name: row.user?.fullName || row.user?.email || `Player ${index + 1}`,
      value: metricValue(row, metric),
    }));
  }, [leaderboard, metric]);

  const compareBars = useMemo(() => {
    return compareBoard.slice(0, 10).map((row, index) => ({
      name: row.user?.fullName || row.user?.email || `Player ${index + 1}`,
      value: metricValue(row, compareMetric),
    }));
  }, [compareBoard, compareMetric]);

  const operationsRows = useMemo(() => {
    const matches = trendData.reduce((sum, row) => sum + row.matches, 0);
    const goals = trendData.reduce((sum, row) => sum + row.goals, 0);
    const assists = trendData.reduce((sum, row) => sum + row.assists, 0);
    const openTasks = Number(tasksPayload.counts?.open || 0);
    const highTasks = Number(tasksPayload.counts?.high || 0);
    const dueSoon = Number(tasksPayload.counts?.dueSoon || 0);

    const feedRows = feedPayload.feed || [];
    const feedKinds = feedRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.kind] = (acc[row.kind] || 0) + 1;
      return acc;
    }, {});

    return [
      { key: "Matches", value: matches },
      { key: "Goals", value: goals },
      { key: "Assists", value: assists },
      { key: "Open Tasks", value: openTasks },
      { key: "High Priority", value: highTasks },
      { key: "Due Soon", value: dueSoon },
      { key: "Feed: Match", value: feedKinds.MATCH || 0 },
      { key: "Feed: Injury", value: feedKinds.INJURY || 0 },
      { key: "Feed: Signup", value: feedKinds.SIGNUP || 0 },
      { key: "Feed: Message", value: feedKinds.MESSAGE || 0 },
    ];
  }, [feedPayload.feed, tasksPayload.counts, trendData]);

  const highSeverityInjuries = useMemo(() => {
    return (trainingPayload.activeInjuries || []).filter(
      (row) => String(row.severity || "").toUpperCase() === "HIGH" && row.isActive
    ).length;
  }, [trainingPayload.activeInjuries]);

  const messagesLast24h = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return (feedPayload.feed || []).filter(
      (row) => row.kind === "MESSAGE" && new Date(row.ts).getTime() >= dayAgo
    ).length;
  }, [feedPayload.feed]);

  const riskScore = useMemo(() => {
    const high = Number(tasksPayload.counts?.high || 0);
    const dueSoon = Number(tasksPayload.counts?.dueSoon || 0);
    const injuries = highSeverityInjuries;
    const raw = high * 6 + dueSoon * 4 + injuries * 9;
    return Math.min(100, Math.max(0, Math.round(raw / 2)));
  }, [highSeverityInjuries, tasksPayload.counts?.dueSoon, tasksPayload.counts?.high]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading analytics intelligence hub...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Analytics Intelligence Hub"
        subtitle="Cross-dashboard performance, operations, risk, and role-lens insights in one place."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <DotTag>MAIN FEATURE</DotTag>
            <DotTag tone="warn">{range}</DotTag>
            <DotTag tone="ok">Lens: {lensRole}</DotTag>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRange(item)}
            className={`rounded-full border px-3 py-1 text-xs font-extrabold transition ${
              range === item ? "bg-[rgba(var(--primary),.22)]" : "bg-white/70 hover:bg-white/90"
            }`}
            style={{ borderColor: adminCardBorder }}
          >
            {item}
          </button>
        ))}

        <select
          value={metric}
          onChange={(event) => setMetric(event.target.value as LeaderboardMetric)}
          className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none"
          style={{ borderColor: adminCardBorder }}
        >
          <option value="goals">Primary: Goals</option>
          <option value="assists">Primary: Assists</option>
          <option value="minutes">Primary: Minutes</option>
        </select>

        <select
          value={compareMetric}
          onChange={(event) => setCompareMetric(event.target.value as LeaderboardMetric)}
          className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none"
          style={{ borderColor: adminCardBorder }}
        >
          <option value="goals">Compare: Goals</option>
          <option value="assists">Compare: Assists</option>
          <option value="minutes">Compare: Minutes</option>
        </select>

        <select
          value={lensRole}
          onChange={(event) => setLensRole(event.target.value as RoleLens)}
          className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none"
          style={{ borderColor: adminCardBorder }}
        >
          {ROLE_LENSES.map((role) => (
            <option key={role} value={role}>
              Lens: {role}
            </option>
          ))}
        </select>
      </div>

      {err ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Stat label="Players" value={playersCount} />
        <Stat label="Squads" value={squadsCount} />
        <Stat label="Matches" value={matchesCount} />
        <Stat label="Upcoming (7d)" value={trainingPayload.summary?.upcoming || 0} />
        <Stat label="Active Injuries" value={trainingPayload.summary?.activeInjuries || 0} />
        <Stat label="Open Tasks" value={tasksPayload.counts?.open || 0} />
        <Stat label="High Priority Tasks" value={tasksPayload.counts?.high || 0} />
        <Stat label="Messages (24h)" value={messagesLast24h} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Performance Trend Engine"
          subtitle="Matches, goals, assists in selected range and role lens."
          className="xl:col-span-8"
        >
          <div className="h-[300px]">
            {trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
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
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No chart points in selected range.</p>
            )}
          </div>
        </Section>

        <Section
          title="Risk Radar"
          subtitle="Live operational and medical pressure index."
          className="xl:col-span-4"
          dark
        >
          <RiskBar label="Risk Score" value={riskScore} />
          <RiskBar label="High Severity Injuries" value={Math.min(100, highSeverityInjuries * 15)} />
          <RiskBar label="Due Soon Tasks" value={Math.min(100, Number(tasksPayload.counts?.dueSoon || 0) * 12)} />
          <RiskBar label="High Priority Tasks" value={Math.min(100, Number(tasksPayload.counts?.high || 0) * 10)} />
        </Section>
      </div>

      <Section
        title="Every Dashboard Lens"
        subtitle="Role-level KPI snapshots across all dashboard perspectives."
        right={roleLoading ? <DotTag tone="warn">Refreshing role lenses...</DotTag> : <DotTag tone="ok">Role lenses live</DotTag>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roleSnapshots.map((item) => (
            <article
              key={item.role}
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.62)" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-[rgb(var(--text))]">{item.role}</p>
                <DotTag tone={item.ok ? "ok" : "danger"}>{item.ok ? "Live" : "Blocked"}</DotTag>
              </div>
              {item.ok ? (
                <div className="space-y-1 text-xs text-[rgb(var(--muted))]">
                  <p>Players: {item.kpis.players || 0}</p>
                  <p>Squads: {item.kpis.squads || 0}</p>
                  <p>Upcoming: {item.kpis.upcoming || 0}</p>
                  <p>Injuries: {item.kpis.injuries || 0}</p>
                </div>
              ) : (
                <p className="text-xs text-rose-700">{item.note}</p>
              )}
            </article>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title={`Top ${metric.toUpperCase()} Board`} subtitle="Primary leaderboard view." className="xl:col-span-4">
          {!leaderboard.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No leaderboard rows.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 8).map((row, index) => (
                <div key={`${row.user?.id || index}`} className="rounded-xl border bg-white/74 px-3 py-2" style={{ borderColor: adminCardBorder }}>
                  <p className="truncate text-sm font-bold text-[rgb(var(--text))]">
                    #{index + 1} {row.user?.fullName || row.user?.email || row.user?.id}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {metric}: {metricValue(row, metric)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title={`Top ${compareMetric.toUpperCase()} Board`}
          subtitle="Comparative leaderboard view."
          className="xl:col-span-4"
        >
          {!compareBoard.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No comparison rows.</p>
          ) : (
            <div className="space-y-2">
              {compareBoard.slice(0, 8).map((row, index) => (
                <div key={`${row.user?.id || index}`} className="rounded-xl border bg-white/74 px-3 py-2" style={{ borderColor: adminCardBorder }}>
                  <p className="truncate text-sm font-bold text-[rgb(var(--text))]">
                    #{index + 1} {row.user?.fullName || row.user?.email || row.user?.id}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {compareMetric}: {metricValue(row, compareMetric)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Operations Matrix" subtitle="Unified operations and engagement counters." className="xl:col-span-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationsRows}>
                <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                <XAxis dataKey="key" tick={{ fontSize: 10, fill: "rgb(var(--muted))" }} interval={0} angle={-20} textAnchor="end" height={56} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${adminCardBorder}`,
                    background: "rgba(255,255,255,.92)",
                  }}
                />
                <Bar dataKey="value" fill="rgba(var(--primary), .82)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title={`${metric.toUpperCase()} Distribution`}
          subtitle="Top player values for the selected primary metric."
          className="xl:col-span-6"
        >
          <div className="h-[280px]">
            {leaderboardBars.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardBars}>
                  <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${adminCardBorder}`,
                      background: "rgba(255,255,255,.92)",
                    }}
                  />
                  <Bar dataKey="value" fill="rgba(var(--primary), .82)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No leaderboard rows available.</p>
            )}
          </div>
        </Section>

        <Section
          title={`${compareMetric.toUpperCase()} Distribution`}
          subtitle="Top player values for comparison metric."
          className="xl:col-span-6"
        >
          <div className="h-[280px]">
            {compareBars.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareBars}>
                  <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${adminCardBorder}`,
                      background: "rgba(255,255,255,.92)",
                    }}
                  />
                  <Bar dataKey="value" fill="rgba(16,185,129,.82)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No comparison rows available.</p>
            )}
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}

function RiskBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
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
