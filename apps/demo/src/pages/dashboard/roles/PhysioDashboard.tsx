import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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
    physio?: {
      highSeverityActive?: number;
      newThisWeek?: Array<{
        id: string;
        type: string;
        severity: string;
        createdAt: string;
        userId: string;
      }>;
    };
  };
};
type ChartsData = {
  series?: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
};
type RecentData = {
  injuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    userId?: string;
  }>;
  matches?: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt?: string | null;
    status?: string | null;
  }>;
};

const EMPTY_INJURIES: NonNullable<RecentData["injuries"]> = [];
const EMPTY_MATCHES: NonNullable<RecentData["matches"]> = [];
const EMPTY_POINTS: Array<{ x: string; y: number }> = [];

function severityTone(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH") return "danger";
  if (value === "MEDIUM") return "warn";
  return "ok";
}

function severityKey(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") return value;
  return "LOW";
}

export default function PhysioDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const physioOverviewQuery = useDashboardOverview("PHYSIO");
  const autoOverviewQuery = useDashboardOverview();
  const chartsQuery = useDashboardCharts(range, "PHYSIO");
  const recentQuery = useDashboardRecent(24, "PHYSIO");

  const overview = ((physioOverviewQuery.data || autoOverviewQuery.data || {}) as OverviewData) || {};
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading =
    (physioOverviewQuery.isLoading && autoOverviewQuery.isLoading) ||
    chartsQuery.isLoading ||
    recentQuery.isLoading;

  const physio = overview.work?.physio || {};
  const injuries = useMemo<NonNullable<RecentData["injuries"]>>(
    () => recent.injuries || EMPTY_INJURIES,
    [recent.injuries]
  );
  const matches = useMemo<NonNullable<RecentData["matches"]>>(
    () => recent.matches || EMPTY_MATCHES,
    [recent.matches]
  );
  const activeInjuries = useMemo(
    () => injuries.filter((injury) => injury.isActive),
    [injuries]
  );
  const highSeverityActive = activeInjuries.filter(
    (injury) => String(injury.severity || "").toUpperCase() === "HIGH"
  ).length;

  const severityDist = useMemo(() => {
    const acc = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const injury of injuries) {
      acc[severityKey(injury.severity)] += 1;
    }
    return [
      { severity: "HIGH", count: acc.HIGH },
      { severity: "MEDIUM", count: acc.MEDIUM },
      { severity: "LOW", count: acc.LOW },
    ];
  }, [injuries]);

  const workloadDist = useMemo(() => {
    const matchSeries =
      (charts.series || []).find((series) => series.name === "Matches Played")?.points || EMPTY_POINTS;
    return matchSeries.map((point) => ({
      day: point.x.slice(5),
      load: point.y || 0,
    }));
  }, [charts.series]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading physio dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Physio Command"
        subtitle="Track injury severity, active cases, and workload pressure from live records."
        right={<DotTag>PHYSIO</DotTag>}
      />

      {physioOverviewQuery.isError && autoOverviewQuery.isError ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load physio context. Verify PHYSIO role in active club.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Injury Records" value={injuries.length} />
        <Stat label="Active Cases" value={activeInjuries.length} />
        <Stat label="High Severity Active" value={physio.highSeverityActive ?? highSeverityActive} />
        <Stat label="New This Week" value={physio.newThisWeek?.length || 0} />
        <Stat label="Recent Matches" value={matches.length} />
        <Stat label="Range" value={range.toUpperCase()} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Injury Severity Distribution"
          subtitle="Current dataset grouped by severity."
          className="xl:col-span-6"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDist}>
                <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                <XAxis dataKey="severity" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${adminCardBorder}`,
                    background: "rgba(255,255,255,.92)",
                  }}
                />
                <Bar dataKey="count" fill="rgba(var(--primary), .82)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Workload Rhythm"
          subtitle="Team match load that influences recovery demand."
          className="xl:col-span-6"
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
          <div className="h-[280px]">
            {workloadDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadDist}>
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
                  <Bar dataKey="load" fill="rgba(var(--primary-2), .72)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No workload points available.</p>
            )}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Active Injury Queue" subtitle="Immediate cases requiring attention." className="xl:col-span-7">
          {!activeInjuries.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No active cases.</p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.map((injury) => (
                <article
                  key={injury.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--text))]">
                      {injury.type || "Injury"} | User {injury.userId || "-"}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      Start {formatDateTime(injury.startDate)} | End {formatDateTime(injury.endDate)}
                    </p>
                  </div>
                  <DotTag tone={severityTone(injury.severity)}>{injury.severity || "LOW"}</DotTag>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="New This Week" subtitle="Recent injury additions." className="xl:col-span-5" dark>
          {!physio.newThisWeek?.length ? (
            <p className="text-sm text-white/75">No new entries this week.</p>
          ) : (
            <div className="space-y-3">
              {physio.newThisWeek.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <p className="text-sm font-bold text-white">
                    {item.type} ({item.severity})
                  </p>
                  <p className="text-xs text-white/70">
                    User {item.userId} | {formatDateTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
      <DashboardAnalyticsLab asRole="PHYSIO" />
    </PageWrap>
  );
}

