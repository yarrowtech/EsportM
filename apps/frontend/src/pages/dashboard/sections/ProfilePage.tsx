import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "../../../hooks/useMe";
import {
  getClubMatches,
  getClubMembers,
  getClubSquads,
} from "../../../api/admin.api";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";
import {
  getMyPlayerHistory,
  getMyPlayerProfile,
  updateMyPlayerProfile,
  type PlayerTrainingLoadEntry,
  type PlayerWellnessEntry,
} from "../../../api/players.api";
import type { PlayerHealthDto } from "../../../api/players.api";
import {
  calculateAge,
  calculateBmi,
  toDateInput,
} from "../../../utils/playerProfile";

type FormValues = {
  wellnessStatus: "FIT" | "UNAVAILABLE" | "";
  hasInjury: boolean;
  readinessScore: string;
  energyLevel: string;
  sorenessLevel: string;
  sleepHours: string;
  healthNotes: string;
};

type ProfileOutletContext = {
  clubId?: string;
  role?: string;
  subRoles?: string[];
  permissions?: string[];
};

function toNumberOrNull(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ProfilePage() {
  const ctx = (useOutletContext() as ProfileOutletContext) || {};
  const isPlayerDashboard = String(ctx.role || "").toUpperCase() === "PLAYER";

  if (!isPlayerDashboard) {
    return <ClubProfileContent ctx={ctx} />;
  }

  return <PlayerProfileContent />;
}

function ClubProfileContent({ ctx }: { ctx: ProfileOutletContext }) {
  const meQuery = useMe();
  const clubId = String(ctx.clubId || localStorage.getItem("activeClubId") || "").trim();
  const permissions = Array.isArray(ctx.permissions) ? ctx.permissions : [];
  const canReadMembers = permissions.includes("members.read");
  const canReadSquads = permissions.includes("squads.read");
  const canReadMatches = permissions.includes("matches.read");

  const memberships = Array.isArray((meQuery.data as any)?.memberships)
    ? (meQuery.data as any).memberships
    : [];
  const activeMembership =
    (meQuery.data as any)?.activeMembership ||
    memberships.find((membership: any) => membership?.clubId === clubId) ||
    memberships[0] ||
    null;
  const club = activeMembership?.club || null;
  const role = String(activeMembership?.primary || ctx.role || "-").toUpperCase();
  const subRoles = Array.isArray(activeMembership?.subRoles)
    ? activeMembership.subRoles
    : Array.isArray(ctx.subRoles)
      ? ctx.subRoles
      : [];

  const membersQuery = useQuery({
    queryKey: ["club-members", clubId],
    queryFn: () => getClubMembers(clubId),
    enabled: !!clubId && canReadMembers,
    staleTime: 30_000,
  });
  const squadsQuery = useQuery({
    queryKey: ["club-squads", clubId],
    queryFn: () => getClubSquads(clubId),
    enabled: !!clubId && canReadSquads,
    staleTime: 30_000,
  });
  const matchesQuery = useQuery({
    queryKey: ["club-matches", clubId],
    queryFn: () => getClubMatches(clubId),
    enabled: !!clubId && canReadMatches,
    staleTime: 30_000,
  });

  const members = membersQuery.data || [];
  const squads = squadsQuery.data || [];
  const matches = matchesQuery.data || [];
  const upcomingMatches = matches.filter((match: any) => {
    const status = String(match.status || "").toUpperCase();
    if (status === "CANCELLED" || status === "FINISHED") return false;
    if (!match.kickoffAt) return status === "SCHEDULED";
    return new Date(match.kickoffAt).getTime() >= Date.now();
  });

  if (meQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading club profile...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Club Profile"
        subtitle="Club identity, workspace context, and operating details for the active club dashboard."
        right={<DotTag tone="ok">{role}</DotTag>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Members" value={canReadMembers ? members.length : "-"} />
        <Stat label="Squads" value={canReadSquads ? squads.length : "-"} />
        <Stat label="Matches" value={canReadMatches ? matches.length : "-"} />
        <Stat label="Upcoming" value={canReadMatches ? upcomingMatches.length : "-"} />
        <Stat label="Sub Roles" value={subRoles.length || "-"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Section title="Club Details" subtitle="Active club profile shown for club-level dashboards.">
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Club name" value={club?.name || "-"} />
              <ReadOnlyField label="Club slug" value={club?.slug || "-"} />
            </div>
            <ReadOnlyField label="Club ID" value={club?.id || clubId || "-"} />
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Your primary role" value={role} />
              <ReadOnlyField label="Your sub roles" value={subRoles.length ? subRoles.join(", ") : "-"} />
            </div>
          </div>
        </Section>

        <Section title="Workspace Access" subtitle="Permission-backed club modules available to this context.">
          <div className="flex flex-wrap gap-2">
            <DotTag tone={canReadMembers ? "ok" : "default"}>Members</DotTag>
            <DotTag tone={canReadSquads ? "ok" : "default"}>Squads</DotTag>
            <DotTag tone={canReadMatches ? "ok" : "default"}>Matches</DotTag>
            <DotTag tone={permissions.includes("stats.read") ? "ok" : "default"}>Stats</DotTag>
            <DotTag tone={permissions.includes("injuries.read") ? "ok" : "default"}>Medical</DotTag>
          </div>
          <div className="mt-5 space-y-3">
            <ReadOnlyField label="Signed-in account" value={(meQuery.data as any)?.user?.email || "-"} />
            <ReadOnlyField label="Display name" value={(meQuery.data as any)?.user?.fullName || "-"} />
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}

function PlayerProfileContent() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const profileQuery = useQuery({
    queryKey: ["player-profile"],
    queryFn: getMyPlayerProfile,
    staleTime: 30_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const historyQuery = useQuery({
    queryKey: ["player-history", "30d"],
    queryFn: () => getMyPlayerHistory("30d"),
    staleTime: 30_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      wellnessStatus: "",
      hasInjury: false,
      readinessScore: "",
      energyLevel: "",
      sorenessLevel: "",
      sleepHours: "",
      healthNotes: "",
    },
  });

  useEffect(() => {
    const profile = profileQuery.data;
    reset({
      wellnessStatus:
        profile?.wellnessStatus === "FIT"
          ? "FIT"
          : profile?.wellnessStatus
            ? "UNAVAILABLE"
            : "",
      hasInjury: !!profile?.hasInjury,
      readinessScore:
        typeof profile?.readinessScore === "number"
          ? String(profile.readinessScore)
          : "",
      energyLevel:
        typeof profile?.energyLevel === "number"
          ? String(profile.energyLevel)
          : "",
      sorenessLevel:
        typeof profile?.sorenessLevel === "number"
          ? String(profile.sorenessLevel)
          : "",
      sleepHours:
        typeof profile?.sleepHours === "number"
          ? String(profile.sleepHours)
          : "",
      healthNotes: profile?.healthNotes || "",
    });
  }, [profileQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: PlayerHealthDto) => updateMyPlayerProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      queryClient.invalidateQueries({ queryKey: ["player-history"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setMessage({
        type: "ok",
        text: "Health and injury status saved. Selection tools will use the latest availability data.",
      });
    },
    onError(error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setMessage({
        type: "err",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save health status.",
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    const payload: PlayerHealthDto = {
      wellnessStatus: values.wellnessStatus || null,
      hasInjury: values.hasInjury,
      readinessScore: toNumberOrNull(values.readinessScore),
      energyLevel: toNumberOrNull(values.energyLevel),
      sorenessLevel: toNumberOrNull(values.sorenessLevel),
      sleepHours: toNumberOrNull(values.sleepHours),
      healthNotes: values.healthNotes?.trim() || null,
    };
    mutation.mutate(payload);
  });

  const profile = profileQuery.data;
  const age = useMemo(() => calculateAge(profile?.dob), [profile?.dob]);
  const bmi = useMemo(
    () => calculateBmi(profile?.heightCm ?? null, profile?.weightKg ?? null),
    [profile?.heightCm, profile?.weightKg],
  );

  const readinessWatch = watch("readinessScore");
  const energyWatch = watch("energyLevel");
  const sorenessWatch = watch("sorenessLevel");
  const sleepWatch = watch("sleepHours");
  const wellnessWatch = watch("wellnessStatus");
  const hasInjuryWatch = watch("hasInjury");
  const wellnessEntries = (historyQuery.data?.wellnessEntries ||
    []) as PlayerWellnessEntry[];
  const trainingLoads = (historyQuery.data?.trainingLoads ||
    []) as PlayerTrainingLoadEntry[];

  if (profileQuery.isLoading || meQuery.isLoading || historyQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading profile data...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Player Profile"
        subtitle="Baseline player data is admin-managed. Players can submit only health and injury status here."
        right={<DotTag tone="ok">LIVE</DotTag>}
      />

      {message && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor:
              message.type === "ok" ? "rgba(34,197,94,.8)" : adminCardBorder,
            background:
              message.type === "ok"
                ? "rgba(16,185,129,.12)"
                : "rgba(255,255,255,.65)",
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Age" value={age ?? "-"} />
        <Stat label="BMI" value={bmi ? `${bmi} kg/m2` : "-"} />
        <Stat
          label="Readiness"
          value={readinessWatch || profile?.readinessScore || "-"}
        />
        <Stat
          label="Energy"
          value={energyWatch || profile?.energyLevel || "-"}
        />
        <Stat
          label="Soreness"
          value={sorenessWatch || profile?.sorenessLevel || "-"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Section
          title="Profile Snapshot"
          subtitle="Club admins manage player bio data. This panel is read-only for players."
        >
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField
                label="Full name"
                value={meQuery.data?.user?.fullName || "-"}
              />
              <ReadOnlyField
                label="Email"
                value={meQuery.data?.user?.email || "-"}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField
                label="Date of birth"
                value={toDateInput(profile?.dob) || "-"}
              />
              <ReadOnlyField
                label="Nationality"
                value={profile?.nationality || "-"}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <ReadOnlyField
                label="Height (cm)"
                value={profile?.heightCm ? String(profile.heightCm) : "-"}
              />
              <ReadOnlyField
                label="Weight (kg)"
                value={profile?.weightKg ? String(profile.weightKg) : "-"}
              />
              <ReadOnlyField
                label="Dominant foot"
                value={profile?.dominantFoot || "-"}
              />
            </div>

            <ReadOnlyField
              label="Positions"
              value={
                profile?.positions?.length ? profile.positions.join(", ") : "-"
              }
            />

            <p className="text-xs text-[rgb(var(--muted))]">
              Need a correction to player bio data? Ask a club admin to update
              the player record.
            </p>
          </div>
        </Section>

        <Section
          title="Health Check-In"
          subtitle="Only health and injury status can be updated by players."
          dark
        >
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-white">
                    Availability status
                  </p>
                  <p className="text-xs text-white/70">
                    Coaches and admins will see this fit / not fit check before
                    selection.
                  </p>
                </div>
                <DotTag
                  tone={wellnessWatch === "UNAVAILABLE" ? "danger" : "ok"}
                >
                  {wellnessWatch || profile?.wellnessStatus || "PENDING"}
                </DotTag>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-white/70">
                  Fit to play
                  <select
                    {...register("wellnessStatus")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="">Not submitted</option>
                    <option value="FIT">Fit</option>
                    <option value="UNAVAILABLE">Not fit</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
                  <span>Any injuries</span>
                  <input type="checkbox" {...register("hasInjury")} />
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  Readiness score (0-100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("readinessScore")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="82"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-xs text-white/70">
                  Energy (1-10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...register("energyLevel")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="8"
                  />
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  Soreness (1-10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    {...register("sorenessLevel")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="3"
                  />
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  Sleep hours
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step="0.5"
                    {...register("sleepHours")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="7.5"
                  />
                </label>
              </div>

              <label className="mt-3 grid gap-1 text-xs text-white/70">
                Notes for staff
                <textarea
                  {...register("healthNotes")}
                  rows={4}
                  className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Any tightness, fatigue, or restrictions to mention before selection."
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-white/60">
                Last health check: {formatDateTime(profile?.healthUpdatedAt)}
              </p>
              <button
                type="submit"
                disabled={mutation.status === "pending"}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--text))] shadow-lg transition hover:opacity-90 disabled:opacity-60"
              >
                {mutation.status === "pending" ? "Saving..." : "Save health"}
              </button>
            </div>
          </form>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Stat label="BMI" value={bmi ? `${bmi} kg/m2` : "-"} />
            <Stat
              label="Sleep"
              value={sleepWatch || profile?.sleepHours || "-"}
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white/80">
              <p className="font-semibold text-white">
                Latest readiness snapshot
              </p>
              <p className="mt-1 text-xs text-white/70">
                Fit to play:{" "}
                {wellnessWatch || profile?.wellnessStatus || "Not submitted"} |
                Any injuries:{" "}
                {hasInjuryWatch ? "Yes" : profile?.hasInjury ? "Yes" : "No"} |
                Readiness: {readinessWatch || profile?.readinessScore || "-"} |
                Energy {energyWatch || profile?.energyLevel || "-"} | Soreness{" "}
                {sorenessWatch || profile?.sorenessLevel || "-"}
              </p>
              <p className="mt-2 text-xs text-white/60">
                Last health check: {formatDateTime(profile?.healthUpdatedAt)}
              </p>
            </div>
            <p className="text-sm text-white/70">
              If you are not fully fit, update the health check before matchday
              so staff can avoid risky selections.
            </p>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="Recent Check-Ins"
          subtitle="Your latest self-reported wellness history."
        >
          {!wellnessEntries.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              No check-ins saved in the last 30 days.
            </p>
          ) : (
            <div className="space-y-3">
              {wellnessEntries.slice(0, 6).map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      {entry.wellnessStatus || "PENDING"} | Readiness{" "}
                      {entry.readinessScore ?? "-"}
                    </p>
                    <DotTag tone={entry.hasInjury ? "warn" : "ok"}>
                      {entry.hasInjury ? "Injury flagged" : "Clear"}
                    </DotTag>
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {formatDateTime(entry.recordedAt)} | Energy{" "}
                    {entry.energyLevel ?? "-"} | Soreness{" "}
                    {entry.sorenessLevel ?? "-"} | Sleep{" "}
                    {entry.sleepHours ?? "-"}
                  </p>
                  {entry.healthNotes ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {entry.healthNotes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Recent Training Load"
          subtitle="Admin-entered sessions that feed your workload trend."
        >
          {!trainingLoads.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              No training load entries yet.
            </p>
          ) : (
            <div className="space-y-3">
              {trainingLoads.slice(0, 6).map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      {entry.sessionType || "Training"} | Load {entry.loadScore}
                    </p>
                    <DotTag>
                      {entry.durationMinutes} min x RPE {entry.rpe}
                    </DotTag>
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {formatDateTime(entry.sessionDate)} by{" "}
                    {entry.createdBy?.fullName ||
                      entry.createdBy?.email ||
                      "Club admin"}
                  </p>
                  {entry.notes ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {entry.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageWrap>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-xs text-[rgb(var(--muted))]">
      <span>{label}</span>
      <div
        className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
        style={{ borderColor: adminCardBorder }}
      >
        {value}
      </div>
    </div>
  );
}
