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
  }>;
  matches?: Array<{
    id: string;
    title?: string | null;
    kickoffAt?: string | null;
    status?: string | null;
  }>;
};

function severityTone(severity?: string | null) {
  const normalized = String(severity || "").toUpperCase();
  if (normalized === "HIGH") return "danger";
  if (normalized === "MEDIUM") return "warn";
  return "ok";
}

export default function NutritionDashboard() {
  const [range, setRange] = useState<Range>("30d");

  const overviewQuery = useDashboardOverview("NUTRITIONIST");
  const chartsQuery = useDashboardCharts(range, "NUTRITIONIST");
  const recentQuery = useDashboardRecent(20, "NUTRITIONIST");

  const overview = (overviewQuery.data || {}) as OverviewData;
  const charts = (chartsQuery.data || {}) as ChartsData;
  const recent = (recentQuery.data || {}) as RecentData;

  const loading = overviewQuery.isLoading || chartsQuery.isLoading || recentQuery.isLoading;

  const byKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of overview.kpis || []) map.set(item.key, Number(item.value) || 0);
    return map;
  }, [overview.kpis]);

  const injuries = recent.injuries || [];
  const activeInjuries = injuries.filter((injury) => injury.isActive);
  const matches = recent.matches || [];

  const loadData = useMemo(() => {
    const series = (charts.series || []).find((item) => item.name === "Matches Played");
    return (series?.points || []).map((point) => ({
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
          Loading nutrition dashboard...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Nutrition Command"
        subtitle="Workload and recovery context from live match and injury streams."
        right={<DotTag>NUTRITIONIST</DotTag>}
      />

      {(overviewQuery.isError || chartsQuery.isError || recentQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Some nutrition modules could not load. Try refresh.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Players" value={byKey.get("players") || 0} />
        <Stat label="Upcoming (7d)" value={byKey.get("upcoming") || 0} />
        <Stat label="Active Injuries" value={activeInjuries.length} />
        <Stat label="High Severity" value={activeInjuries.filter((i) => String(i.severity).toUpperCase() === "HIGH").length} />
        <Stat label="Recent Matches" value={matches.length} />
        <Stat label="Range" value={range.toUpperCase()} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Training Load Curve"
          subtitle="Match-load rhythm used for recovery planning."
          className="xl:col-span-7"
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
            {loadData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadData}>
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
                  <Bar dataKey="load" fill="rgba(var(--primary), .82)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-6 text-sm text-[rgb(var(--muted))]">No load points available.</p>
            )}
          </div>
        </Section>

        <Section title="Recovery Flags" subtitle="Current medical risk flags." className="xl:col-span-5" dark>
          {!activeInjuries.length ? (
            <p className="text-sm text-white/75">No active recovery risks.</p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.slice(0, 8).map((injury) => (
                <div key={injury.id} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{injury.type || "Injury"}</p>
                    <DotTag tone={severityTone(injury.severity)}>{injury.severity || "LOW"}</DotTag>
                  </div>
                  <p className="text-xs text-white/70">
                    Start {formatDateTime(injury.startDate)} | End {formatDateTime(injury.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
      <DashboardAnalyticsLab asRole="NUTRITIONIST" />
    </PageWrap>
  );
}

