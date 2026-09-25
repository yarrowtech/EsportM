import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  getClubPlayers,
  getLeaderboard,
  type ClubPlayer,
  type LeaderboardMetric,
  type LeaderboardRow,
} from "../../../api/admin.api";
import { useDashboardCharts, useDashboardOverview } from "../../../hooks/useDashboard";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
} from "../../admin/admin-ui";
import { calculateAge, calculateBmi } from "../../../utils/playerProfile";

type Range = "7d" | "30d" | "90d";
type OverviewData = {
  kpis?: Array<{ key: string; label: string; value: number }>;
};
type ChartsData = {
  series?: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
};

const HEIGHT_BUCKETS = [
  { label: "<160cm", min: 0, max: 159 },
  { label: "160-169cm", min: 160, max: 169 },
  { label: "170-179cm", min: 170, max: 179 },
  { label: "180cm+", min: 180, max: Infinity },
] as const;

const DOMINANT_FOOT_LABELS: Record<string, string> = {
  RIGHT: "Right",
  LEFT: "Left",
  BOTH: "Both / Ambidextrous",
  Unspecified: "Not specified",
};

function normalizeLabel(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function metricValue(row: LeaderboardRow, metric: LeaderboardMetric) {
  if (row?.totals && typeof row.totals[metric] === "number") return row.totals[metric] ?? 0;
  if (typeof row?.value === "number") return row.value;
  if (typeof row?.score === "number") return row.score;
  if (typeof row?.[metric] === "number") return row[metric] as number;
  return 0;
}

function hasPlayerProfile(
  player: ClubPlayer
): player is ClubPlayer & { profile: NonNullable<ClubPlayer["profile"]> } {
  return Boolean(player.profile);
}

export default function StatsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [metric, setMetric] = useState<LeaderboardMetric>("goals");
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [boardErr, setBoardErr] = useState<string | null>(null);

  const meQuery = useMe();
  const overviewQuery = useDashboardOverview();
  const chartsQuery = useDashboardCharts(range);

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const meData = (meQuery.data || {}) as { activeClubId?: string | null };
  const clubId = meData.activeClubId || localStorage.getItem("activeClubId") || "";
  const playersQuery = useQuery({
    queryKey: ["club-players", clubId],
    queryFn: () => getClubPlayers(clubId),
    enabled: Boolean(clubId),
  });

  useEffect(() => {
    let alive = true;
    async function loadBoard() {
      if (!clubId) return;
      try {
        setBoardErr(null);
        const rows = await getLeaderboard(clubId, metric, 10);
        if (!alive) return;
        setBoard(rows || []);
      } catch {
        if (!alive) return;
        setBoard([]);
        setBoardErr("Unable to load leaderboard");
      }
    }
    loadBoard();
    return () => {
      alive = false;
    };
  }, [clubId, metric]);

  const loading =
    overviewQuery.isLoading ||
    chartsQuery.isLoading ||
    meQuery.isLoading ||
    playersQuery.isLoading;

  const playerProfiles = useMemo(() => {
    const rows = playersQuery.data || [];
    return rows.filter(hasPlayerProfile);
  }, [playersQuery.data]);

  const average = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

  const ages = playerProfiles
    .map((player) => calculateAge(player.profile.dob))
    .filter((value): value is number => typeof value === "number");
  const avgAge = ages.length ? Math.round(average(ages) ?? 0) : null;

  const heights = playerProfiles
    .map((player) => player.profile.heightCm)
    .filter((value): value is number => typeof value === "number");
  const avgHeight = heights.length ? Math.round(average(heights) ?? 0) : null;

  const weights = playerProfiles
    .map((player) => player.profile.weightKg)
    .filter((value): value is number => typeof value === "number");
  const avgWeight = weights.length ? Math.round(average(weights) ?? 0) : null;

  const bmis = playerProfiles
    .map((player) => calculateBmi(player.profile.heightCm, player.profile.weightKg))
    .filter((value): value is number => typeof value === "number");
  const avgBmi = bmis.length ? Number((average(bmis) ?? 0).toFixed(1)) : null;

  const heightDistribution = useMemo(() => {
    return HEIGHT_BUCKETS.map((bucket) => {
      const count = playerProfiles.filter((player) => {
        const height = player.profile.heightCm;
        if (!height) return false;
        if (bucket.max === Infinity) return height >= bucket.min;
        return height >= bucket.min && height <= bucket.max;
      }).length;
      return { label: bucket.label, count };
    });
  }, [playerProfiles]);

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const profile of playerProfiles) {
      (profile.profile.positions || []).forEach((pos) => {
        const normalized = pos.toUpperCase();
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    }
    return counts;
  }, [playerProfiles]);
  const positionList = useMemo(
    () =>
      Object.entries(positionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6),
    [positionCounts]
  );

  const footCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const profile of playerProfiles) {
      const foot = profile.profile.dominantFoot || "Unspecified";
      counts[foot] = (counts[foot] || 0) + 1;
    }
    return counts;
  }, [playerProfiles]);
  const footList = useMemo(
    () =>
      Object.entries(footCounts).map(([key, count]) => ({
        label: DOMINANT_FOOT_LABELS[key] || key,
        count,
      })),
    [footCounts]
  );
  const heightMax = Math.max(...heightDistribution.map((bucket) => bucket.count), 1);
  const totalFoot = footList.reduce((sum, item) => sum + item.count, 0);

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

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

  const totalGoals = chartData.reduce((sum, row) => sum + row.goals, 0);
  const totalAssists = chartData.reduce((sum, row) => sum + row.assists, 0);
  const totalMatches = chartData.reduce((sum, row) => sum + row.matches, 0);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading stats center...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Stats Center"
        subtitle="Club performance analytics and leaderboard insights from live data."
        right={<DotTag>STATS</DotTag>}
      />

      {(overviewQuery.isError || chartsQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some stats modules failed to load.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Squads" value={byKey.get("squads") || 0} />
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label={`Matches (${range})`} value={totalMatches} />
        <Stat label={`Goals (${range})`} value={totalGoals} />
        <Stat label={`Assists (${range})`} value={totalAssists} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Performance Trend"
          subtitle="Match volume and attacking output over selected range."
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
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No chart data for selected range.</p>
            )}
          </div>
        </Section>

        <Section
          title="Leaderboard"
          subtitle="Top performers by selected metric."
          className="xl:col-span-4"
          dark
          right={
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as LeaderboardMetric)}
              className="rounded-full border bg-white/90 px-3 py-1 text-xs font-semibold text-[rgb(var(--primary-2))] outline-none"
              style={{ borderColor: "rgba(255,255,255,.35)" }}
            >
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
              <option value="minutes">Minutes</option>
            </select>
          }
        >
          {boardErr ? <p className="text-sm text-rose-300">{boardErr}</p> : null}
          {!board.length ? (
            <p className="text-sm text-white/75">No leaderboard entries.</p>
          ) : (
            <div className="space-y-3">
              {board.slice(0, 8).map((row, index) => (
                <div key={`${row.user?.id || index}`} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <p className="truncate text-sm font-bold text-white">
                    #{index + 1} {row.user?.fullName || row.user?.email || row.user?.id}
                  </p>
                  <p className="text-xs text-white/70">
                    {metric.toUpperCase()}: {metricValue(row, metric)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
      <Section
        title="Profile Analytics"
        subtitle="Aggregated metrics from submitted player bios."
        className="mt-6"
      >
        {playersQuery.isError && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
            style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
          >
            Unable to load player profile stats.
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Profiled players" value={playerProfiles.length} />
          <Stat label="Avg age" value={avgAge ? `${avgAge} yrs` : "-"} />
          <Stat label="Avg height" value={avgHeight ? `${avgHeight} cm` : "-"} />
          <Stat label="Avg weight" value={avgWeight ? `${avgWeight} kg` : "-"} />
          <Stat label="Avg BMI" value={avgBmi ? `${avgBmi}` : "-"} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div
            className="rounded-2xl border px-4 py-4"
            style={{ borderColor: adminCardBorder }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
              Height distribution
            </p>
            <div className="mt-3 space-y-3">
              {heightDistribution.map((bucket) => {
                const width = Math.round((bucket.count / heightMax) * 100);
                return (
                  <div key={bucket.label}>
                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                      <span>{bucket.label}</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-white/15">
                      <div
                        className="h-2 rounded-full bg-[rgb(var(--primary))]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl border px-4 py-4"
            style={{ borderColor: adminCardBorder }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
              Dominant foot
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {footList.length ? (
                footList.map((entry) => {
                  const percent = totalFoot ? Math.round((entry.count / totalFoot) * 100) : 0;
                  return (
                    <DotTag key={entry.label} tone="ok">
                      {entry.label}: {percent}%
                    </DotTag>
                  );
                })
              ) : (
                <p className="text-xs text-[rgb(var(--muted))]">No foot data yet.</p>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl border px-4 py-4"
            style={{ borderColor: adminCardBorder }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
              Positions
            </p>
            <div className="mt-3 space-y-2">
              {positionList.length ? (
                positionList.map(([position, count]) => (
                  <div key={position} className="flex items-center justify-between text-sm">
                    <span>{position}</span>
                    <span className="text-xs text-[rgb(var(--muted))]">{count} players</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[rgb(var(--muted))]">No position data yet.</p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </PageWrap>
  );
}

