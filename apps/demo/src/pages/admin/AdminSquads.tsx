import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  addSquadMember,
  createSquad,
  getClubPlayers,
  getClubSquads,
  getSquad,
  removeSquadMember,
  type ClubPlayer,
  type SquadDetail,
  type SquadSummary,
} from "../../api/admin.api";
import { type RolePermission } from "../../utils/rolePolicy";
import { describeFitnessLevel, type FitnessDescriptor, type FitnessTone } from "../../utils/playerProfile";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "./admin-ui";

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

const FITNESS_TONE_STYLES: Record<FitnessTone, { border: string; background: string; color: string }> = {
  good: {
    border: "1px solid rgba(16, 185, 129, 0.5)",
    background: "rgba(16, 185, 129, 0.12)",
    color: "#047857",
  },
  warn: {
    border: "1px solid rgba(251, 191, 36, 0.7)",
    background: "rgba(251, 191, 36, 0.12)",
    color: "#92400e",
  },
  alert: {
    border: "1px solid rgba(239, 68, 68, 0.5)",
    background: "rgba(239, 68, 68, 0.12)",
    color: "#991b1b",
  },
  neutral: {
    border: "1px solid rgba(148, 163, 184, 0.8)",
    background: "rgba(148, 163, 184, 0.2)",
    color: "#475569",
  },
};

const UNKNOWN_FITNESS: FitnessDescriptor = { label: "Unknown", tone: "neutral", bmi: null };

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

export default function AdminSquads() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const permissionSet = new Set<RolePermission>(ctx.permissions || []);
  const canRead = permissionSet.has("squads.read");
  const canReadPlayers = permissionSet.has("players.read");
  const canManage = permissionSet.has("squads.write");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [squads, setSquads] = useState<SquadSummary[]>([]);
  const [players, setPlayers] = useState<ClubPlayer[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState("");
  const [selectedSquad, setSelectedSquad] = useState<SquadDetail | null>(null);

  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadCode, setNewSquadCode] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteUserId, setInviteUserId] = useState("");
  const [jerseyNo, setJerseyNo] = useState("");
  const [position, setPosition] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    if (!clubId) {
      setErr("No club selected. Please choose a club from the header.");
      setLoading(false);
      return;
    }
    if (!canRead) {
      setErr("You do not have permission to view squads for this club.");
      setSquads([]);
      setPlayers([]);
      setSelectedSquadId("");
      setSelectedSquad(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const [clubSquads, clubPlayers] = await Promise.all([
        getClubSquads(clubId),
        canReadPlayers ? getClubPlayers(clubId) : Promise.resolve([]),
      ]);
      setSquads(clubSquads || []);
      setPlayers(clubPlayers || []);

      setSelectedSquadId((prev) => prev || clubSquads?.[0]?.id || "");
    } catch (e: unknown) {
      setErr(messageOf(e, "Failed to load squad data."));
    } finally {
      setLoading(false);
    }
  }, [canRead, canReadPlayers, clubId]);

  const loadSelected = useCallback(async (squadId: string) => {
    if (!canRead || !clubId || !squadId) {
      setSelectedSquad(null);
      return;
    }
    try {
      const squad = await getSquad(clubId, squadId);
      setSelectedSquad(squad);
    } catch (e: unknown) {
      setSelectedSquad(null);
      setToast({ type: "err", msg: messageOf(e, "Failed to load selected squad.") });
    }
  }, [canRead, clubId]);

  useEffect(() => {
    setSelectedSquadId("");
    loadBase();
  }, [clubId, loadBase]);

  useEffect(() => {
    loadSelected(selectedSquadId);
  }, [clubId, selectedSquadId, loadSelected]);

  const unassignedPlayers = useMemo(() => {
    const inSelected = new Set((selectedSquad?.members || []).map((member) => member.userId));
    return players.filter((player) => !inSelected.has(player.user.id));
  }, [players, selectedSquad]);

  const playerFitnessMap = useMemo(() => {
    const map = new Map<string, FitnessDescriptor>();
    players.forEach((player) => {
      map.set(player.user.id, describeFitnessLevel(player.profile ?? null));
    });
    return map;
  }, [players]);

  const getPlayerFitness = (userId?: string | null) => {
    if (!userId) return UNKNOWN_FITNESS;
    return playerFitnessMap.get(userId) ?? UNKNOWN_FITNESS;
  };

  const selectedInviteFitness = inviteUserId ? getPlayerFitness(inviteUserId) : null;

  const onCreateSquad = async () => {
    if (!canManage) {
      setToast({ type: "err", msg: "Only ADMIN or MANAGER can create squads." });
      return;
    }
    if (!newSquadName.trim()) {
      setToast({ type: "err", msg: "Squad name is required." });
      return;
    }

    try {
      setCreating(true);
      const created = await createSquad(clubId, {
        name: newSquadName.trim(),
        code: newSquadCode.trim() || undefined,
      });

      setNewSquadName("");
      setNewSquadCode("");
      await loadBase();
      setSelectedSquadId(created.id);
      setToast({ type: "ok", msg: `Squad "${created.name}" created.` });
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to create squad.") });
    } finally {
      setCreating(false);
    }
  };

  const onAddPlayer = async () => {
    if (!canManage) {
      setToast({ type: "err", msg: "Only ADMIN or MANAGER can add squad members." });
      return;
    }
    if (!selectedSquadId || !inviteUserId) {
      setToast({ type: "err", msg: "Select squad and player first." });
      return;
    }

    try {
      setAdding(true);
      await addSquadMember(clubId, selectedSquadId, {
        userId: inviteUserId,
        jerseyNo: jerseyNo ? Number(jerseyNo) : undefined,
        position: position.trim() || undefined,
      });
      setInviteUserId("");
      setJerseyNo("");
      setPosition("");
      await loadBase();
      await loadSelected(selectedSquadId);
      setToast({ type: "ok", msg: "Player added to squad." });
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to add player.") });
    } finally {
      setAdding(false);
    }
  };

  const onRemoveMember = async (userId: string) => {
    if (!canManage || !selectedSquadId) {
      setToast({ type: "err", msg: "You do not have permission for this action." });
      return;
    }

    try {
      setRemovingUserId(userId);
      await removeSquadMember(clubId, selectedSquadId, userId);
      await loadBase();
      await loadSelected(selectedSquadId);
      setToast({ type: "ok", msg: "Player removed from squad." });
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to remove player.") });
    } finally {
      setRemovingUserId(null);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading squad workspace...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Squad Builder"
        subtitle="Create squads, assign player rosters, and keep each lineup healthy."
        right={<DotTag tone={canManage ? "warn" : "default"}>{canManage ? "CAN MANAGE" : "VIEW ONLY"}</DotTag>}
      />

      {toast ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          <span className={toast.type === "ok" ? "text-emerald-700" : "text-rose-700"}>{toast.msg}</span>
        </div>
      ) : null}

      {err ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Squads" value={squads.length} />
        <Stat label="Club Players" value={players.length} />
        <Stat label="In Selected Squad" value={selectedSquad?.members?.length || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Create Squad"
          subtitle="Start a new competition or training group."
          className="xl:col-span-5"
          right={<DotTag tone="warn">Action</DotTag>}
        >
          <div className="grid gap-2">
            <input
              value={newSquadName}
              onChange={(event) => setNewSquadName(event.target.value)}
              placeholder="Squad name"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={newSquadCode}
              onChange={(event) => setNewSquadCode(event.target.value)}
              placeholder="Code (optional)"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <button
              type="button"
              onClick={onCreateSquad}
              disabled={!canManage || creating}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {creating ? "Creating..." : "Create squad"}
            </button>
          </div>
        </Section>

        <Section
          title="Selected Squad"
          subtitle="Current roster and squad metadata."
          className="xl:col-span-7"
          dark
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-white/60">Name</p>
              <p className="text-sm font-semibold text-white">{selectedSquad?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Code</p>
              <p className="text-sm font-semibold text-white">{selectedSquad?.code || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Created</p>
              <p className="text-sm font-semibold text-white">{formatDateTime(selectedSquad?.createdAt)}</p>
            </div>
          </div>
        </Section>
      </div>

      <Section
        title="Roster Operations"
        subtitle="Assign and remove squad members."
        right={
          <div className="flex items-center gap-2">
            <select
              value={selectedSquadId}
              onChange={(event) => setSelectedSquadId(event.target.value)}
              className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold outline-none"
              style={{ borderColor: adminCardBorder }}
            >
              {!squads.length ? <option value="">No squads</option> : null}
              {squads.map((squad) => (
                <option key={squad.id} value={squad.id}>
                  {squad.name} ({squad._count?.members ?? 0})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadBase}
              className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold"
              style={{ borderColor: adminCardBorder }}
            >
              Refresh
            </button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5 space-y-2">
            <select
              value={inviteUserId}
              onChange={(event) => setInviteUserId(event.target.value)}
              disabled={!canManage || !selectedSquadId}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              <option value="">Select player</option>
              {unassignedPlayers.map((player) => {
                const fitness = playerFitnessMap.get(player.user.id) ?? UNKNOWN_FITNESS;
                const label = fitness.bmi
                  ? `${fitness.label} - BMI ${fitness.bmi.toFixed(1)}`
                  : fitness.label;
                return (
                  <option key={player.user.id} value={player.user.id}>
                    {player.user.fullName || player.user.email} ({player.user.email}) — {label}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-[rgb(var(--muted))]">
              {selectedInviteFitness
                ? `Fitness level: ${selectedInviteFitness.label}${
                    typeof selectedInviteFitness.bmi === "number"
                      ? ` - BMI ${selectedInviteFitness.bmi.toFixed(1)}`
                      : ""
                  }`
                : "Select a player to view fitness readiness."}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={jerseyNo}
                onChange={(event) => setJerseyNo(event.target.value.replace(/[^\d]/g, ""))}
                placeholder="Jersey number"
                disabled={!canManage || !selectedSquadId}
                className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              />
              <input
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Position"
                disabled={!canManage || !selectedSquadId}
                className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              />
            </div>
            <button
              type="button"
              onClick={onAddPlayer}
              disabled={!canManage || !selectedSquadId || !inviteUserId || adding}
              className="w-full rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {adding ? "Adding..." : "Add to squad"}
            </button>
          </div>

          <div className="xl:col-span-7 space-y-2">
            {!selectedSquad?.members?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No members in the selected squad.</p>
            ) : (
              selectedSquad.members.map((member) => {
                const memberFitness = getPlayerFitness(member.userId);
                const toneStyle = FITNESS_TONE_STYLES[memberFitness.tone];
                return (
                  <article
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/75 px-3 py-3"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                        {member.user?.fullName || member.user?.email || member.userId}
                      </p>
                      <p className="truncate text-xs text-[rgb(var(--muted))]">
                        {member.user?.email || "-"} | Jersey {member.jerseyNo ?? "-"} | {member.position || "N/A"} | Fitness{" "}
                        {memberFitness.label}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className="rounded-full px-2 py-0.5 font-semibold tracking-tight"
                          style={{
                            border: toneStyle.border,
                            background: toneStyle.background,
                            color: toneStyle.color,
                          }}
                        >
                          {memberFitness.label}
                          {typeof memberFitness.bmi === "number"
                            ? ` - BMI ${memberFitness.bmi.toFixed(1)}`
                            : ""}
                        </span>
                        <span className="text-[0.65rem] text-[rgb(var(--muted))]">
                          {typeof memberFitness.bmi === "number"
                            ? `BMI ${memberFitness.bmi.toFixed(1)}`
                            : "BMI pending"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member.userId)}
                      disabled={!canManage || removingUserId === member.userId}
                      className="rounded-full border bg-white/85 px-3 py-2 text-xs font-extrabold text-rose-700 transition disabled:opacity-60"
                      style={{ borderColor: adminCardBorder }}
                    >
                      {removingUserId === member.userId ? "Removing..." : "Remove"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </Section>
    </PageWrap>
  );
}

