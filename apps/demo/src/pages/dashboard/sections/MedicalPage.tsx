import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOutletContext } from "react-router-dom";
import {
  createClubPlayerTrainingLoad,
  createClubInjury,
  getClubInjuries,
  getClubPlayerTrainingLoads,
  getClubPlayers,
  updateClubPlayerProfile,
  type ClubPlayer,
  type ClubInjury,
  type ClubPlayerTrainingLoadEntry,
} from "../../../api/admin.api";
import {
  getMyPlayerProfile,
  updateMyPlayerProfile,
  type PlayerHealthDto,
} from "../../../api/players.api";
import { type RolePermission } from "../../../utils/rolePolicy";
import { normalizePositions, toDateInput } from "../../../utils/playerProfile";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type HealthFormValues = {
  wellnessStatus: "FIT" | "UNAVAILABLE" | "";
  hasInjury: boolean;
  readinessScore: string;
  energyLevel: string;
  sorenessLevel: string;
  sleepHours: string;
  healthNotes: string;
};

type PlayerRecordFormValues = {
  userId: string;
  dob: string;
  nationality: string;
  heightCm: string;
  weightKg: string;
  dominantFoot: "RIGHT" | "LEFT" | "BOTH" | "";
  positions: string;
};

type InjuryFormValues = {
  userId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type TrainingLoadFormValues = {
  userId: string;
  sessionDate: string;
  sessionType: string;
  durationMinutes: string;
  rpe: string;
  notes: string;
};

function toNumberOrNull(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function severityKey(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") return value;
  return "LOW";
}

function severityTone(severity?: string | null) {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH") return "danger";
  if (value === "MEDIUM") return "warn";
  return "ok";
}

function messageOf(error: unknown, fallback: string) {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
}

function displayPlayer(player: ClubPlayer) {
  return player.user.fullName || player.user.email;
}

export default function MedicalPage() {
  const queryClient = useQueryClient();
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = String(ctx.clubId || "").trim();
  const permissionSet = useMemo(
    () => new Set<RolePermission>(ctx.permissions || []),
    [ctx.permissions],
  );
  const canReadPlayers = permissionSet.has("players.read");
  const canWritePlayers = permissionSet.has("players.write");
  const canReadInjuries = permissionSet.has("injuries.read");
  const canWriteInjuries = permissionSet.has("injuries.write");

  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const healthForm = useForm<HealthFormValues>({
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

  const injuryForm = useForm<InjuryFormValues>({
    defaultValues: {
      userId: "",
      type: "",
      severity: "LOW",
      description: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  });

  const playerRecordForm = useForm<PlayerRecordFormValues>({
    defaultValues: {
      userId: "",
      dob: "",
      nationality: "",
      heightCm: "",
      weightKg: "",
      dominantFoot: "",
      positions: "",
    },
  });

  const trainingLoadForm = useForm<TrainingLoadFormValues>({
    defaultValues: {
      userId: "",
      sessionDate: "",
      sessionType: "",
      durationMinutes: "",
      rpe: "",
      notes: "",
    },
  });

  const profileQuery = useQuery({
    queryKey: ["player-profile"],
    queryFn: getMyPlayerProfile,
    staleTime: 30_000,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const playersQuery = useQuery({
    queryKey: ["club-players", clubId],
    queryFn: () => getClubPlayers(clubId),
    enabled: !!clubId && canReadPlayers,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const injuriesQuery = useQuery({
    queryKey: ["club-injuries", clubId],
    queryFn: () => getClubInjuries(clubId),
    enabled: !!clubId && canReadInjuries,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const trainingLoadsPlayerId =
    trainingLoadForm.watch("userId") || playerRecordForm.watch("userId") || "";
  const trainingLoadsQuery = useQuery({
    queryKey: [
      "club-player-training-loads",
      clubId,
      trainingLoadsPlayerId,
      "30d",
    ],
    queryFn: () =>
      getClubPlayerTrainingLoads(clubId, trainingLoadsPlayerId, "30d"),
    enabled: !!clubId && !!trainingLoadsPlayerId && canReadPlayers,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    healthForm.reset({
      wellnessStatus:
        profile.wellnessStatus === "FIT"
          ? "FIT"
          : profile.wellnessStatus
            ? "UNAVAILABLE"
            : "",
      hasInjury: !!profile.hasInjury,
      readinessScore:
        typeof profile.readinessScore === "number"
          ? String(profile.readinessScore)
          : "",
      energyLevel:
        typeof profile.energyLevel === "number"
          ? String(profile.energyLevel)
          : "",
      sorenessLevel:
        typeof profile.sorenessLevel === "number"
          ? String(profile.sorenessLevel)
          : "",
      sleepHours:
        typeof profile.sleepHours === "number"
          ? String(profile.sleepHours)
          : "",
      healthNotes: profile.healthNotes || "",
    });
  }, [healthForm, profileQuery.data]);

  const saveHealthMutation = useMutation({
    mutationFn: (payload: PlayerHealthDto) => updateMyPlayerProfile(payload),
    onSuccess: async () => {
      setMessage({
        type: "ok",
        text: "Health check-in saved. Squad selection and medical views now use the updated data.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["player-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["club-players", clubId] }),
      ]);
    },
    onError: (error: unknown) => {
      setMessage({
        type: "err",
        text: messageOf(error, "Unable to save health check-in."),
      });
    },
  });

  const updatePlayerRecordMutation = useMutation({
    mutationFn: (values: PlayerRecordFormValues) =>
      updateClubPlayerProfile(clubId, values.userId, {
        dob: values.dob ? new Date(values.dob).toISOString() : null,
        nationality: values.nationality.trim() || null,
        heightCm: toNumberOrNull(values.heightCm),
        weightKg: toNumberOrNull(values.weightKg),
        dominantFoot: values.dominantFoot || null,
        positions: normalizePositions(values.positions),
      }),
    onSuccess: async () => {
      setMessage({
        type: "ok",
        text: "Player record saved. Bio data is now admin-managed only.",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["club-players", clubId] }),
        queryClient.invalidateQueries({ queryKey: ["player-profile"] }),
      ]);
    },
    onError: (error: unknown) => {
      setMessage({
        type: "err",
        text: messageOf(error, "Unable to update player record."),
      });
    },
  });

  const createInjuryMutation = useMutation({
    mutationFn: (payload: InjuryFormValues) =>
      createClubInjury(clubId, {
        userId: payload.userId,
        type: payload.type.trim(),
        severity: payload.severity,
        description: payload.description.trim() || undefined,
        startDate: payload.startDate,
        endDate: payload.endDate || undefined,
        isActive: payload.isActive,
      }),
    onSuccess: async () => {
      setMessage({
        type: "ok",
        text: "Medical case created and added to the live injury feed.",
      });
      injuryForm.reset({
        userId: "",
        type: "",
        severity: "LOW",
        description: "",
        startDate: "",
        endDate: "",
        isActive: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["club-injuries", clubId] }),
        queryClient.invalidateQueries({ queryKey: ["club-players", clubId] }),
      ]);
    },
    onError: (error: unknown) => {
      setMessage({
        type: "err",
        text: messageOf(error, "Unable to create medical case."),
      });
    },
  });

  const createTrainingLoadMutation = useMutation({
    mutationFn: (values: TrainingLoadFormValues) =>
      createClubPlayerTrainingLoad(clubId, values.userId, {
        sessionDate: values.sessionDate,
        sessionType: values.sessionType.trim() || null,
        durationMinutes: Number(values.durationMinutes),
        rpe: Number(values.rpe),
        notes: values.notes.trim() || null,
      }),
    onSuccess: async () => {
      setMessage({
        type: "ok",
        text: "Training load saved and added to the player workload trend.",
      });
      trainingLoadForm.reset({
        userId: trainingLoadForm.getValues("userId"),
        sessionDate: "",
        sessionType: "",
        durationMinutes: "",
        rpe: "",
        notes: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["club-player-training-loads", clubId],
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "charts"] }),
      ]);
    },
    onError: (error: unknown) => {
      setMessage({
        type: "err",
        text: messageOf(error, "Unable to save training load."),
      });
    },
  });

  const onSubmitHealth = healthForm.handleSubmit((values) => {
    setMessage(null);
    saveHealthMutation.mutate({
      wellnessStatus: values.wellnessStatus || null,
      hasInjury: values.hasInjury,
      readinessScore: toNumberOrNull(values.readinessScore),
      energyLevel: toNumberOrNull(values.energyLevel),
      sorenessLevel: toNumberOrNull(values.sorenessLevel),
      sleepHours: toNumberOrNull(values.sleepHours),
      healthNotes: values.healthNotes.trim() || null,
    });
  });

  const onSubmitInjury = injuryForm.handleSubmit((values) => {
    setMessage(null);
    createInjuryMutation.mutate(values);
  });

  const onSubmitPlayerRecord = playerRecordForm.handleSubmit((values) => {
    setMessage(null);
    updatePlayerRecordMutation.mutate(values);
  });

  const onSubmitTrainingLoad = trainingLoadForm.handleSubmit((values) => {
    setMessage(null);
    createTrainingLoadMutation.mutate(values);
  });

  const injuries = useMemo(
    () => (injuriesQuery.data || []) as ClubInjury[],
    [injuriesQuery.data],
  );
  const players = useMemo(
    () => (playersQuery.data || []) as ClubPlayer[],
    [playersQuery.data],
  );
  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.user.id, player])),
    [players],
  );
  const activeInjuries = useMemo(
    () => injuries.filter((injury) => injury.isActive),
    [injuries],
  );
  const highSeverity = activeInjuries.filter(
    (injury) => String(injury.severity || "").toUpperCase() === "HIGH",
  ).length;

  const severityDist = useMemo(() => {
    const dist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const injury of injuries) dist[severityKey(injury.severity)] += 1;
    return [
      { severity: "HIGH", count: dist.HIGH },
      { severity: "MEDIUM", count: dist.MEDIUM },
      { severity: "LOW", count: dist.LOW },
    ];
  }, [injuries]);

  const selectedWellness = healthForm.watch("wellnessStatus");
  const hasInjuryWatch = healthForm.watch("hasInjury");
  const selectedPlayerId = playerRecordForm.watch("userId");
  const selectedPlayer = selectedPlayerId
    ? playerMap.get(selectedPlayerId)
    : null;
  const trainingLoadEntries = useMemo(
    () => (trainingLoadsQuery.data || []) as ClubPlayerTrainingLoadEntry[],
    [trainingLoadsQuery.data],
  );

  useEffect(() => {
    if (!selectedPlayer) {
      playerRecordForm.reset({
        userId: selectedPlayerId || "",
        dob: "",
        nationality: "",
        heightCm: "",
        weightKg: "",
        dominantFoot: "",
        positions: "",
      });
      return;
    }

    playerRecordForm.reset({
      userId: selectedPlayer.user.id,
      dob: toDateInput(selectedPlayer.profile?.dob) || "",
      nationality: selectedPlayer.profile?.nationality || "",
      heightCm:
        typeof selectedPlayer.profile?.heightCm === "number"
          ? String(selectedPlayer.profile.heightCm)
          : "",
      weightKg:
        typeof selectedPlayer.profile?.weightKg === "number"
          ? String(selectedPlayer.profile.weightKg)
          : "",
      dominantFoot: selectedPlayer.profile?.dominantFoot || "",
      positions: selectedPlayer.profile?.positions?.join(", ") || "",
    });
  }, [playerRecordForm, selectedPlayer, selectedPlayerId]);

  const loading =
    profileQuery.isLoading ||
    (canReadPlayers && playersQuery.isLoading) ||
    (canReadInjuries && injuriesQuery.isLoading);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading medical center...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Medical Center"
        subtitle="Players can update only health and injury status. Admins manage player records and create injury cases."
        right={<DotTag>MEDICAL</DotTag>}
      />

      {message ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: adminCardBorder,
            background: "rgba(255,255,255,.65)",
          }}
        >
          <span
            className={
              message.type === "ok" ? "text-emerald-700" : "text-rose-700"
            }
          >
            {message.text}
          </span>
        </div>
      ) : null}

      {(profileQuery.isError ||
        injuriesQuery.isError ||
        playersQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{
            borderColor: adminCardBorder,
            background: "rgba(255,255,255,.65)",
          }}
        >
          Unable to load full medical dataset.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Active Cases" value={activeInjuries.length} />
        <Stat label="High Severity Active" value={highSeverity} />
        <Stat label="Total Records" value={injuries.length} />
        <Stat
          label="Resolved Cases"
          value={injuries.length - activeInjuries.length}
        />
        <Stat
          label="My Readiness"
          value={
            healthForm.watch("readinessScore") ||
            profileQuery.data?.readinessScore ||
            "-"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Health Check-In"
          subtitle="Players can submit readiness directly here. This data feeds squad availability tags."
          className="xl:col-span-5"
        >
          <form className="grid gap-3" onSubmit={onSubmitHealth}>
            <div
              className="flex items-center justify-between gap-2 rounded-2xl border bg-white/70 px-3 py-3"
              style={{ borderColor: adminCardBorder }}
            >
              <div>
                <p className="text-sm font-bold text-[rgb(var(--text))]">
                  Current selection status
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Latest self-report is consumed by squad operations and medical
                  review.
                </p>
              </div>
              <DotTag
                tone={selectedWellness === "UNAVAILABLE" ? "danger" : "ok"}
              >
                {selectedWellness ||
                  profileQuery.data?.wellnessStatus ||
                  "PENDING"}
              </DotTag>
            </div>

            <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
              Fit to play
              <select
                {...healthForm.register("wellnessStatus")}
                className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="">Not submitted</option>
                <option value="FIT">Fit</option>
                <option value="UNAVAILABLE">Not fit</option>
              </select>
            </label>

            <label
              className="flex items-center justify-between gap-3 rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
              style={{ borderColor: adminCardBorder }}
            >
              <span>Any injuries</span>
              <input type="checkbox" {...healthForm.register("hasInjury")} />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Readiness score (0-100)
                <input
                  type="number"
                  min={0}
                  max={100}
                  {...healthForm.register("readinessScore")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Sleep hours
                <input
                  type="number"
                  min={0}
                  max={24}
                  step="0.5"
                  {...healthForm.register("sleepHours")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Energy (1-10)
                <input
                  type="number"
                  min={1}
                  max={10}
                  {...healthForm.register("energyLevel")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
              <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                Soreness (1-10)
                <input
                  type="number"
                  min={1}
                  max={10}
                  {...healthForm.register("sorenessLevel")}
                  className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                  style={{ borderColor: adminCardBorder }}
                />
              </label>
            </div>

            <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
              Notes for staff
              <textarea
                rows={4}
                {...healthForm.register("healthNotes")}
                className="rounded-2xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none"
                style={{ borderColor: adminCardBorder }}
                placeholder="Any pain, fatigue, or restrictions to flag before selection."
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[rgb(var(--muted))]">
                Last saved: {formatDateTime(profileQuery.data?.healthUpdatedAt)}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Injury reported: {hasInjuryWatch ? "Yes" : "No"}
              </p>
              <button
                type="submit"
                disabled={saveHealthMutation.isPending}
                className="rounded-full bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--primary-2))] disabled:opacity-60"
              >
                {saveHealthMutation.isPending ? "Saving..." : "Save check-in"}
              </button>
            </div>
          </form>
        </Section>

        <Section
          title="Medical Case Entry"
          subtitle="Only admins can create injury records for club players."
          className="xl:col-span-7"
          dark
        >
          {!canWriteInjuries || !canReadPlayers ? (
            <p className="text-sm text-white/75">
              Medical case entry is available only to admins with injury
              management access.
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={onSubmitInjury}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-white/70">
                  Player
                  <select
                    {...injuryForm.register("userId")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="">Select player</option>
                    {players.map((player) => (
                      <option key={player.user.id} value={player.user.id}>
                        {displayPlayer(player)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  Case type
                  <input
                    type="text"
                    {...injuryForm.register("type")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Hamstring strain, ankle sprain..."
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-xs text-white/70">
                  Severity
                  <select
                    {...injuryForm.register("severity")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  Start date
                  <input
                    type="date"
                    {...injuryForm.register("startDate")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs text-white/70">
                  End date
                  <input
                    type="date"
                    {...injuryForm.register("endDate")}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-xs text-white/70">
                Description
                <textarea
                  rows={4}
                  {...injuryForm.register("description")}
                  className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Mechanism, diagnosis notes, or current restrictions."
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-white/75">
                <input type="checkbox" {...injuryForm.register("isActive")} />
                Keep case active
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createInjuryMutation.isPending}
                  className="rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-extrabold text-[rgb(var(--text))] disabled:opacity-60"
                >
                  {createInjuryMutation.isPending
                    ? "Saving..."
                    : "Create medical case"}
                </button>
              </div>
            </form>
          )}
        </Section>
      </div>

      {canWritePlayers ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section
            title="Player Data Upload"
            subtitle="Only admins can maintain player bio data. Players can submit only health and injury status themselves."
          >
            {!canReadPlayers ? (
              <p className="text-sm text-[rgb(var(--muted))]">
                Player data upload requires player read access.
              </p>
            ) : (
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={onSubmitPlayerRecord}
              >
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))] md:col-span-2">
                  Player
                  <select
                    {...playerRecordForm.register("userId")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <option value="">Select player</option>
                    {players.map((player) => (
                      <option key={player.user.id} value={player.user.id}>
                        {displayPlayer(player)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Date of birth
                  <input
                    type="date"
                    {...playerRecordForm.register("dob")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Nationality
                  <input
                    type="text"
                    {...playerRecordForm.register("nationality")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="India, Brazil, France..."
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Height (cm)
                  <input
                    type="number"
                    min={120}
                    max={250}
                    {...playerRecordForm.register("heightCm")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Weight (kg)
                  <input
                    type="number"
                    min={30}
                    max={200}
                    {...playerRecordForm.register("weightKg")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  />
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))]">
                  Dominant foot
                  <select
                    {...playerRecordForm.register("dominantFoot")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <option value="">Not specified</option>
                    <option value="RIGHT">Right</option>
                    <option value="LEFT">Left</option>
                    <option value="BOTH">Both</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-[rgb(var(--muted))] md:col-span-2">
                  Positions
                  <input
                    type="text"
                    {...playerRecordForm.register("positions")}
                    className="rounded-xl border bg-white/90 px-3 py-2 text-sm text-[rgb(var(--text))]"
                    style={{ borderColor: adminCardBorder }}
                    placeholder="ST, CAM, RW"
                  />
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      !selectedPlayerId || updatePlayerRecordMutation.isPending
                    }
                    className="rounded-full bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--primary-2))] disabled:opacity-60"
                  >
                    {updatePlayerRecordMutation.isPending
                      ? "Saving..."
                      : "Save player record"}
                  </button>
                </div>
              </form>
            )}
          </Section>

          <Section
            title="Training Load Upload"
            subtitle="Admins can log player session load to feed workload trends."
            dark
          >
            {!canReadPlayers ? (
              <p className="text-sm text-white/75">
                Training load upload requires player read access.
              </p>
            ) : (
              <>
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={onSubmitTrainingLoad}
                >
                  <label className="grid gap-1 text-xs text-white/70 md:col-span-2">
                    Player
                    <select
                      {...trainingLoadForm.register("userId")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="">Select player</option>
                      {players.map((player) => (
                        <option key={player.user.id} value={player.user.id}>
                          {displayPlayer(player)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-white/70">
                    Session date
                    <input
                      type="datetime-local"
                      {...trainingLoadForm.register("sessionDate")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/70">
                    Session type
                    <input
                      type="text"
                      {...trainingLoadForm.register("sessionType")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Gym, Field, Recovery"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/70">
                    Duration (min)
                    <input
                      type="number"
                      min={1}
                      max={600}
                      {...trainingLoadForm.register("durationMinutes")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/70">
                    RPE (1-10)
                    <input
                      type="number"
                      min={1}
                      max={10}
                      {...trainingLoadForm.register("rpe")}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/70 md:col-span-2">
                    Notes
                    <textarea
                      rows={3}
                      {...trainingLoadForm.register("notes")}
                      className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                      placeholder="High-intensity block, return-to-play restrictions, recovery session..."
                    />
                  </label>
                  <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-white/60">
                      Load score is calculated as duration x RPE.
                    </p>
                    <button
                      type="submit"
                      disabled={
                        createTrainingLoadMutation.isPending ||
                        !trainingLoadForm.watch("userId")
                      }
                      className="rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-extrabold text-[rgb(var(--text))] disabled:opacity-60"
                    >
                      {createTrainingLoadMutation.isPending
                        ? "Saving..."
                        : "Save training load"}
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-3">
                  {!trainingLoadsPlayerId ? (
                    <p className="text-sm text-white/70">
                      Select a player to view recent training load entries.
                    </p>
                  ) : !trainingLoadEntries.length ? (
                    <p className="text-sm text-white/70">
                      No recent training load entries for this player.
                    </p>
                  ) : (
                    trainingLoadEntries.slice(0, 5).map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            {entry.sessionType || "Training"} | Load{" "}
                            {entry.loadScore}
                          </p>
                          <DotTag>
                            {entry.durationMinutes}m x RPE {entry.rpe}
                          </DotTag>
                        </div>
                        <p className="mt-1 text-xs text-white/70">
                          {formatDateTime(entry.sessionDate)} by{" "}
                          {entry.createdBy?.fullName ||
                            entry.createdBy?.email ||
                            "Club admin"}
                        </p>
                        {entry.notes ? (
                          <p className="mt-2 text-xs text-white/60">
                            {entry.notes}
                          </p>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </>
            )}
          </Section>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Severity Distribution"
          subtitle="All injury records grouped by severity."
          className="xl:col-span-5"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDist}>
                <CartesianGrid
                  stroke="rgba(20,24,32,.12)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="severity"
                  tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${adminCardBorder}`,
                    background: "rgba(255,255,255,.92)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="rgba(var(--primary), .82)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Active Recovery Queue"
          subtitle="Cases requiring current monitoring."
          className="xl:col-span-7"
          dark
        >
          {!activeInjuries.length ? (
            <p className="text-sm text-white/75">
              No active injuries currently.
            </p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.map((injury) => {
                const player = playerMap.get(injury.userId);
                return (
                  <div
                    key={injury.id}
                    className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-bold text-white">
                        {injury.type || "Injury"} |{" "}
                        {player
                          ? displayPlayer(player)
                          : `User ${injury.userId}`}
                      </p>
                      <DotTag tone={severityTone(injury.severity)}>
                        {injury.severity || "LOW"}
                      </DotTag>
                    </div>
                    <p className="text-xs text-white/70">
                      Start {formatDateTime(injury.startDate)} | End{" "}
                      {formatDateTime(injury.endDate)}
                    </p>
                    {injury.description ? (
                      <p className="mt-2 text-xs text-white/60">
                        {injury.description}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <Section title="Medical Log" subtitle="Chronological injury feed.">
        {!injuries.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            No injury records found.
          </p>
        ) : (
          <div className="space-y-3">
            {injuries.map((injury) => {
              const player = playerMap.get(injury.userId);
              return (
                <article
                  key={injury.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">
                      {injury.type || "Injury"} |{" "}
                      {player ? displayPlayer(player) : `User ${injury.userId}`}
                    </p>
                    <DotTag tone={severityTone(injury.severity)}>
                      {injury.severity || "LOW"}
                    </DotTag>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Active: {String(injury.isActive)} | Start{" "}
                    {formatDateTime(injury.startDate)} | End{" "}
                    {formatDateTime(injury.endDate)}
                  </p>
                  {injury.description ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {injury.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}
