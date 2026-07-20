import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "../../../api/dashboard.api";
import { PricingFeatureGate } from "../../../features/prototype-pricing/PricingFeatureGate";
import { useDashboardAnalytics } from "../../../hooks/useDashboard";
import {
  DotTag,
  Section,
  Stat,
  adminCardBorder,
  cx,
  formatDateTime,
} from "../../admin/admin-ui";

type Range = "7d" | "30d" | "90d";
type Category = "MATCH" | "PLAYER" | "CLUB";
type MetricKey =
  | "matchLoad"
  | "trainingLoad"
  | "winRate"
  | "possession"
  | "playerFitness"
  | "playerMorale"
  | "recoveryScore"
  | "clubCohesion"
  | "fanEngagement"
  | "disciplineScore";

type AnalyticsPayload = {
  totals?: {
    entries?: number;
    averagePerformance?: number;
    averageReadiness?: number;
    averageMomentum?: number;
    averageCompleteness?: number;
    topCategory?: string | null;
  };
  trend?: Array<{
    day: string;
    entries: number;
    performance: number;
    readiness: number;
    momentum: number;
  }>;
  metricsSummary?: {
    strongest?: { label?: string | null; average?: number | null } | null;
    weakest?: { label?: string | null; average?: number | null } | null;
  };
  latest?: Array<{
    id: string;
    category: Category;
    subjectLabel: string;
    recordedAt: string;
    notes?: string | null;
    performanceIndex: number;
    readinessIndex: number;
    momentumIndex: number;
    dataCompleteness: number;
    createdBy?: { fullName?: string | null; email?: string | null } | null;
  }>;
};

const metricFields: Array<{ key: MetricKey; label: string; hint: string }> = [
  { key: "matchLoad", label: "Match Load", hint: "Intensity and competitive demand" },
  { key: "trainingLoad", label: "Training Load", hint: "Session volume and strain" },
  { key: "winRate", label: "Win Rate", hint: "Recent outcomes converted to 0-100" },
  { key: "possession", label: "Possession", hint: "Ball control and territorial command" },
  { key: "playerFitness", label: "Player Fitness", hint: "Physical readiness and sharpness" },
  { key: "playerMorale", label: "Player Morale", hint: "Confidence and dressing-room energy" },
  { key: "recoveryScore", label: "Recovery Score", hint: "Fatigue recovery and freshness" },
  { key: "clubCohesion", label: "Club Cohesion", hint: "Coordination across the squad" },
  { key: "fanEngagement", label: "Fan Engagement", hint: "Support and attention around the club" },
  { key: "disciplineScore", label: "Discipline Score", hint: "Errors, fouls, and control" },
];

function nowForInput() {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function normalizeDay(day: string) {
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function categoryTone(category?: string | null) {
  if (category === "MATCH") return "ok";
  if (category === "PLAYER") return "warn";
  if (category === "CLUB") return "default";
  return "default";
}

function toNumberMap(values: Record<MetricKey, string>) {
  const output: Partial<Record<MetricKey, number>> = {};
  for (const field of metricFields) {
    const raw = values[field.key];
    if (raw === "") continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) continue;
    output[field.key] = Math.max(0, Math.min(100, parsed));
  }
  return output;
}

type DashboardAnalyticsLabProps = {
  asRole?: string;
  canWrite?: boolean;
};

export default function DashboardAnalyticsLab({
  asRole,
  canWrite = false,
}: DashboardAnalyticsLabProps) {
  const [range, setRange] = useState<Range>("30d");
  const [category, setCategory] = useState<Category>("MATCH");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [recordedAt, setRecordedAt] = useState(nowForInput);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metricValues, setMetricValues] = useState<Record<MetricKey, string>>({
    matchLoad: "",
    trainingLoad: "",
    winRate: "",
    possession: "",
    playerFitness: "",
    playerMorale: "",
    recoveryScore: "",
    clubCohesion: "",
    fanEngagement: "",
    disciplineScore: "",
  });

  const queryClient = useQueryClient();
  const analyticsQuery = useDashboardAnalytics(range, asRole);
  const analytics = (analyticsQuery.data || {}) as AnalyticsPayload;

  const trendData = useMemo(() => {
    return (analytics.trend || []).map((row) => ({
      day: normalizeDay(row.day),
      performance: row.performance,
      readiness: row.readiness,
      momentum: row.momentum,
      entries: row.entries,
    }));
  }, [analytics.trend]);

  const createMutation = useMutation({
    mutationFn: dashboardApi.createAnalytics,
    onSuccess: async () => {
      setError(null);
      setSubjectLabel("");
      setNotes("");
      setRecordedAt(nowForInput());
      setMetricValues({
        matchLoad: "",
        trainingLoad: "",
        winRate: "",
        possession: "",
        playerFitness: "",
        playerMorale: "",
        recoveryScore: "",
        clubCohesion: "",
        fanEngagement: "",
        disciplineScore: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || "Failed to save analytics input.");
    },
  });

  const totalEntries = analytics.totals?.entries || 0;
  const topCategory = analytics.totals?.topCategory || "N/A";
  const strongestMetric = analytics.metricsSummary?.strongest;
  const weakestMetric = analytics.metricsSummary?.weakest;

  const handleSubmit = () => {
    const metrics = toNumberMap(metricValues);
    if (!subjectLabel.trim()) {
      setError("Add a subject label before saving analytics.");
      return;
    }
    if (!Object.keys(metrics).length) {
      setError("Enter at least one metric to analyze.");
      return;
    }

    const parsedRecordedAt = new Date(recordedAt);
    if (Number.isNaN(parsedRecordedAt.getTime())) {
      setError("Use a valid date and time.");
      return;
    }

    createMutation.mutate({
      category,
      subjectLabel: subjectLabel.trim(),
      recordedAt: parsedRecordedAt.toISOString(),
      notes: notes.trim() || undefined,
      metrics,
    });
  };

  return (
    <PricingFeatureGate feature="advanced_analytics">
      <Section
        title="Analytics Input Lab"
        subtitle={
          canWrite
            ? "Capture match, player, and club inputs from the team. Stored entries are converted into KPI indices and trend lines for every dashboard role."
            : "Trend and recent inputs from the club analytics stream. Only admins can save new analytics records."
        }
        right={
          <div className="flex flex-wrap items-center gap-2">
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
      <div className="grid gap-4 xl:grid-cols-12">
        {canWrite ? (
          <div className="space-y-4 xl:col-span-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[rgb(var(--muted))]">Input Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category)}
                  className="w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: adminCardBorder }}
                >
                  <option value="MATCH">Match Data</option>
                  <option value="PLAYER">Player Data</option>
                  <option value="CLUB">Club Data</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-[rgb(var(--muted))]">Recorded At</span>
                <input
                  type="datetime-local"
                  value={recordedAt}
                  onChange={(event) => setRecordedAt(event.target.value)}
                  className="w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-[rgb(var(--muted))]">Subject Label</span>
              <input
                type="text"
                value={subjectLabel}
                onChange={(event) => setSubjectLabel(event.target.value)}
                placeholder="Example: Matchday 9, U21 striker block, April club pulse"
                className="w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm outline-none"
                style={{ borderColor: adminCardBorder }}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {metricFields.map((field) => (
                <label key={field.key} className="space-y-1">
                  <span className="text-xs font-semibold text-[rgb(var(--text))]">{field.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={metricValues[field.key]}
                    onChange={(event) =>
                      setMetricValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder="0 - 100"
                    className="w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <span className="block text-[11px] text-[rgb(var(--muted))]">{field.hint}</span>
                </label>
              ))}
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-[rgb(var(--muted))]">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Why this input matters, what changed, and who reported it."
                className="w-full rounded-2xl border bg-white/80 px-3 py-2 text-sm outline-none"
                style={{ borderColor: adminCardBorder }}
              />
            </label>

            {error ? (
              <div
                className="rounded-2xl border px-3 py-3 text-sm font-medium text-rose-700"
                style={{ borderColor: "rgba(244,63,94,.22)", background: "rgba(255,255,255,.68)" }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: adminCardBorder,
                background: "linear-gradient(145deg, rgba(var(--primary), .22), rgba(255,255,255,.82))",
              }}
            >
              {createMutation.isPending ? "Saving analytics..." : "Save Analytics Input"}
            </button>
          </div>
        ) : (
          <div className="xl:col-span-4">
            <div
              className="rounded-[24px] border px-4 py-4"
              style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.64)" }}
            >
              <p className="text-sm font-semibold text-[rgb(var(--text))]">Read-Only Stream</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Analytics inputs are locked for this role. Club admins can save match, player, and
                club records here.
              </p>
            </div>
          </div>
        )}

        <div className={cx("space-y-4", canWrite ? "xl:col-span-7" : "xl:col-span-8")}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Entries" value={totalEntries} hint={`Top category: ${topCategory}`} />
            <Stat
              label="Performance"
              value={analytics.totals?.averagePerformance ?? 0}
              hint="Weighted outcome and execution index"
            />
            <Stat
              label="Readiness"
              value={analytics.totals?.averageReadiness ?? 0}
              hint="Availability and workload balance"
            />
            <Stat
              label="Momentum"
              value={analytics.totals?.averageMomentum ?? 0}
              hint={`Completeness ${analytics.totals?.averageCompleteness ?? 0}%`}
            />
          </div>

          <div
            className="rounded-[24px] border px-4 py-4"
            style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.64)" }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text))]">Analytics Trend</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Performance, readiness, and momentum derived from saved user inputs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {strongestMetric ? (
                  <DotTag tone="ok">
                    Strongest: {strongestMetric.label} {strongestMetric.average ?? 0}
                  </DotTag>
                ) : null}
                {weakestMetric ? (
                  <DotTag tone="warn">
                    Weakest: {weakestMetric.label} {weakestMetric.average ?? 0}
                  </DotTag>
                ) : null}
              </div>
            </div>

            <div className="h-[280px]">
              {analyticsQuery.isLoading ? (
                <p className="pt-8 text-sm text-[rgb(var(--muted))]">Loading analytics trend...</p>
              ) : trendData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${adminCardBorder}`,
                        background: "rgba(255,255,255,.92)",
                      }}
                    />
                    <Line type="monotone" dataKey="performance" stroke="rgba(var(--primary), .95)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="readiness" stroke="rgba(var(--primary-2), .86)" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="momentum" stroke="rgba(16,185,129,.95)" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="pt-8 text-sm text-[rgb(var(--muted))]">
                  No analytics inputs in this range yet. Save a match, player, or club entry to start measuring trends.
                </p>
              )}
            </div>
          </div>

          <div
            className="rounded-[24px] border px-4 py-4"
            style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.64)" }}
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-[rgb(var(--text))]">Recent Inputs</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Latest saved records from the club-wide analytics stream.
              </p>
            </div>

            {!analytics.latest?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No saved analytics records yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.latest.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border bg-white/70 px-3 py-3"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--text))]">{entry.subjectLabel}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          {formatDateTime(entry.recordedAt)} by{" "}
                          {entry.createdBy?.fullName || entry.createdBy?.email || "Club member"}
                        </p>
                      </div>
                      <DotTag tone={categoryTone(entry.category)}>{entry.category}</DotTag>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <MiniIndexCard label="Performance" value={entry.performanceIndex} />
                      <MiniIndexCard label="Readiness" value={entry.readinessIndex} />
                      <MiniIndexCard label="Momentum" value={entry.momentumIndex} />
                      <MiniIndexCard label="Completeness" value={entry.dataCompleteness} />
                    </div>

                    {entry.notes ? (
                      <p className="mt-3 text-xs text-[rgb(var(--muted))]">{entry.notes}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </Section>
    </PricingFeatureGate>
  );
}

function MiniIndexCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border px-3 py-2" style={{ borderColor: adminCardBorder }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{value}</p>
    </div>
  );
}
