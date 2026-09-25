import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addSquadMember,
  createSquad,
  getClubMatches,
  getClubPlayers,
  getClubSquads,
  getMatchLineupWorkspace,
  getSquad,
  removeSquadMember,
  saveHomeMatchLineup,
  updateClubMatchSquad,
  type ClubPlayer,
  type MatchItem,
  type MatchLineupPlayerPayload,
  type PlayerHealthSummary,
} from '../../../api/admin.api';
import { type RolePermission } from '../../../utils/rolePolicy';
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from '../../admin/admin-ui';

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type EditableSelectionPlayer = {
  userId: string;
  jerseyNo: string;
  position: string;
};

type SquadRosterPlayer = {
  squadMemberId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  jerseyNo?: number | null;
  position?: string | null;
  profile?: ClubPlayer['profile'];
  health: PlayerHealthSummary;
  activeInjury?: ClubPlayer['activeInjury'];
};

const DEFAULT_HEALTH_SUMMARY: PlayerHealthSummary = {
  status: 'NO_DATA',
  selectionStatus: 'NOT_FIT',
  label: 'Check-in needed',
  note: 'No fresh health check-in available from the player',
  isFitToPlay: false,
  selfReportedInjury: false,
  readinessScore: null,
  wellnessStatus: null,
  energyLevel: null,
  sorenessLevel: null,
  sleepHours: null,
  lastUpdatedAt: null,
  activeInjury: null,
};

const HEALTH_TONE: Record<string, 'ok' | 'danger' | 'default'> = {
  FIT: 'ok',
  NOT_FIT: 'danger',
  NO_DATA: 'default',
};

function selectionTone(player: { health: PlayerHealthSummary } | undefined) {
  if (!player) return 'default' as const;
  return HEALTH_TONE[player.health.selectionStatus] || 'default';
}

function selectionLabel(player: { health: PlayerHealthSummary } | undefined) {
  if (!player) return 'Not fit';
  return player.health.selectionStatus === 'FIT' ? 'Fit' : 'Not fit';
}

function messageOf(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function toEditablePlayer(player: {
  userId: string;
  jerseyNo?: number | null;
  position?: string | null;
}): EditableSelectionPlayer {
  return {
    userId: player.userId,
    jerseyNo: typeof player.jerseyNo === 'number' ? String(player.jerseyNo) : '',
    position: player.position || '',
  };
}

function toPayloadPlayer(player: EditableSelectionPlayer): MatchLineupPlayerPayload {
  const jerseyNo = player.jerseyNo ? Number(player.jerseyNo) : undefined;
  return {
    userId: player.userId,
    jerseyNo: Number.isFinite(jerseyNo as number) ? jerseyNo : undefined,
    position: player.position.trim() || undefined,
  };
}

function displayName(player: { user?: { fullName?: string | null; email?: string | null } }) {
  return player.user?.fullName || player.user?.email || 'Unnamed player';
}

function byRosterOrder(a: SquadRosterPlayer, b: SquadRosterPlayer) {
  const aJersey = typeof a.jerseyNo === 'number' ? a.jerseyNo : Number.MAX_SAFE_INTEGER;
  const bJersey = typeof b.jerseyNo === 'number' ? b.jerseyNo : Number.MAX_SAFE_INTEGER;
  if (aJersey !== bJersey) return aJersey - bJersey;
  return displayName(a).localeCompare(displayName(b));
}

export default function SquadManagementPage() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = String(ctx.clubId || '').trim();
  const permissionSet = useMemo(() => new Set<RolePermission>(ctx.permissions || []), [ctx.permissions]);
  const canReadSquads = permissionSet.has('squads.read');
  const canManageSquads = permissionSet.has('squads.write');
  const canReadSelection = permissionSet.has('lineups.read');
  const canManageSelection = permissionSet.has('lineups.write');
  const canReadPlayers = permissionSet.has('players.read');
  const canViewPage = canReadSquads || canReadSelection;
  const location = useLocation();
  const requestedMatchId = String((location.state as { matchId?: string } | null)?.matchId || '').trim();

  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadCode, setNewSquadCode] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [jerseyNo, setJerseyNo] = useState('');
  const [position, setPosition] = useState('');
  const [selectionNote, setSelectionNote] = useState('');
  const [leadUserId, setLeadUserId] = useState('');
  const [activeParticipants, setActiveParticipants] = useState<EditableSelectionPlayer[]>([]);
  const [reserveParticipants, setReserveParticipants] = useState<EditableSelectionPlayer[]>([]);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const matchesQuery = useQuery({
    queryKey: ['club-matches', clubId],
    queryFn: () => getClubMatches(clubId),
    enabled: !!clubId && canReadSelection,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const squadsQuery = useQuery({
    queryKey: ['club-squads', clubId],
    queryFn: () => getClubSquads(clubId),
    enabled: !!clubId && canReadSquads,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const playersQuery = useQuery({
    queryKey: ['club-players', clubId],
    queryFn: () => getClubPlayers(clubId),
    enabled: !!clubId && canReadPlayers,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const squadDetailQuery = useQuery({
    queryKey: ['squad-detail', clubId, selectedSquadId],
    queryFn: () => getSquad(clubId, selectedSquadId),
    enabled: !!clubId && !!selectedSquadId && canReadSquads,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const workspaceQuery = useQuery({
    queryKey: ['match-lineup-workspace', clubId, selectedMatchId],
    queryFn: () => getMatchLineupWorkspace(clubId, selectedMatchId),
    enabled: !!clubId && !!selectedMatchId && canReadSelection,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!matchesQuery.data?.length) {
      setSelectedMatchId('');
      return;
    }

    const availableMatches = matchesQuery.data;
    if (requestedMatchId && availableMatches.some((match) => match.id === requestedMatchId)) {
      setSelectedMatchId((current) => current || requestedMatchId);
      return;
    }

    setSelectedMatchId((current) => {
      if (current && availableMatches.some((match) => match.id === current)) return current;
      const upcoming = availableMatches
        .filter((match) => new Date(match.kickoffAt || 0).getTime() >= Date.now())
        .sort((a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime())[0];
      return upcoming?.id || availableMatches[0]?.id || '';
    });
  }, [matchesQuery.data, requestedMatchId]);

  useEffect(() => {
    const availableSquads = squadsQuery.data || [];
    if (!availableSquads.length) {
      setSelectedSquadId('');
      return;
    }

    const matchSquadId = String(workspaceQuery.data?.match.squadId || '');
    setSelectedSquadId((current) => {
      if (current && availableSquads.some((squad) => squad.id === current)) return current;
      if (matchSquadId && availableSquads.some((squad) => squad.id === matchSquadId)) return matchSquadId;
      return availableSquads[0]?.id || '';
    });
  }, [squadsQuery.data, workspaceQuery.data?.match.squadId]);

  useEffect(() => {
    const workspace = workspaceQuery.data;
    if (!workspace) return;

    setSelectionNote(workspace.lineup.formation || '');
    setLeadUserId(workspace.lineup.captainUserId || '');
    setActiveParticipants(workspace.lineup.starting.map(toEditablePlayer));
    setReserveParticipants(workspace.lineup.bench.map(toEditablePlayer));
  }, [workspaceQuery.data]);

  const createSquadMutation = useMutation({
    mutationFn: () =>
      createSquad(clubId, {
        name: newSquadName.trim(),
        code: newSquadCode.trim() || undefined,
      }),
    onSuccess: async (createdSquad) => {
      setNewSquadName('');
      setNewSquadCode('');
      setSelectedSquadId(createdSquad.id);
      setToast({ type: 'ok', msg: `Squad "${createdSquad.name}" created.` });
      await squadsQuery.refetch();
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to create the squad.') });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      addSquadMember(clubId, selectedSquadId, {
        userId: inviteUserId,
        jerseyNo: jerseyNo ? Number(jerseyNo) : undefined,
        position: position.trim() || undefined,
      }),
    onSuccess: async () => {
      setInviteUserId('');
      setJerseyNo('');
      setPosition('');
      setToast({ type: 'ok', msg: 'Athlete saved to the squad roster.' });
      await Promise.all([squadsQuery.refetch(), squadDetailQuery.refetch()]);
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to update the squad roster.') });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeSquadMember(clubId, selectedSquadId, userId),
    onSuccess: async () => {
      setToast({ type: 'ok', msg: 'Athlete removed from the squad roster.' });
      await Promise.all([squadsQuery.refetch(), squadDetailQuery.refetch()]);
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to remove the athlete from the squad.') });
    },
  });

  const assignSquadMutation = useMutation({
    mutationFn: () => updateClubMatchSquad(clubId, selectedMatchId, { squadId: selectedSquadId || null }),
    onSuccess: async () => {
      setToast({ type: 'ok', msg: 'Selected squad assigned to the event. Saved selection data has been reset for the new roster.' });
      await Promise.all([matchesQuery.refetch(), workspaceQuery.refetch()]);
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to assign the squad to the event.') });
    },
  });

  const saveSelectionMutation = useMutation({
    mutationFn: () =>
      saveHomeMatchLineup(clubId, selectedMatchId, {
        formation: selectionNote.trim() || undefined,
        captainUserId: leadUserId || activeParticipants[0]?.userId || undefined,
        starting: activeParticipants.map(toPayloadPlayer),
        bench: reserveParticipants.map(toPayloadPlayer),
      }),
    onSuccess: async () => {
      setToast({ type: 'ok', msg: 'Participant selection saved.' });
      await workspaceQuery.refetch();
    },
    onError: (error: unknown) => {
      setToast({ type: 'err', msg: messageOf(error, 'Failed to save participant selection.') });
    },
  });

  const playersByUserId = useMemo(
    () => new Map((playersQuery.data || []).map((player) => [player.user.id, player])),
    [playersQuery.data]
  );

  const selectedSquadRoster = useMemo<SquadRosterPlayer[]>(() => {
    const members = squadDetailQuery.data?.members || [];
    return members
      .map((member) => {
        const clubPlayer = playersByUserId.get(member.userId);
        return {
          squadMemberId: member.id,
          userId: member.userId,
          user: clubPlayer?.user || member.user || { id: member.userId, email: '', fullName: null },
          jerseyNo: member.jerseyNo ?? null,
          position: member.position ?? clubPlayer?.profile?.positions?.[0] ?? null,
          profile: clubPlayer?.profile ?? null,
          health: clubPlayer?.health || DEFAULT_HEALTH_SUMMARY,
          activeInjury: clubPlayer?.activeInjury ?? null,
        };
      })
      .sort(byRosterOrder);
  }, [playersByUserId, squadDetailQuery.data]);

  useEffect(() => {
    if (!selectedSquadId || !squadDetailQuery.data) return;

    const allowedUserIds = new Set(selectedSquadRoster.map((player) => player.userId));
    setActiveParticipants((current) => current.filter((player) => allowedUserIds.has(player.userId)));
    setReserveParticipants((current) => current.filter((player) => allowedUserIds.has(player.userId)));
    setLeadUserId((current) => (current && !allowedUserIds.has(current) ? '' : current));
  }, [selectedSquadId, selectedSquadRoster, squadDetailQuery.data]);

  const rosterByUserId = useMemo(
    () => new Map(selectedSquadRoster.map((player) => [player.userId, player])),
    [selectedSquadRoster]
  );

  const selectedAthletes = useMemo(
    () =>
      [...activeParticipants, ...reserveParticipants]
        .map((player) => rosterByUserId.get(player.userId))
        .filter(Boolean) as SquadRosterPlayer[],
    [activeParticipants, reserveParticipants, rosterByUserId]
  );

  const unassignedPlayers = useMemo(() => {
    const assignedUserIds = new Set((squadDetailQuery.data?.members || []).map((member) => member.userId));
    return (playersQuery.data || [])
      .filter((player) => !assignedUserIds.has(player.user.id))
      .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [playersQuery.data, squadDetailQuery.data]);

  const selectedMatch = workspaceQuery.data?.match || null;
  const eventAssignedSquadId = String(selectedMatch?.squadId || '');
  const eventUsesSelectedSquad = !!selectedMatchId && !!selectedSquadId && eventAssignedSquadId === selectedSquadId;

  const counters = useMemo(() => {
    const matches = matchesQuery.data || [];
    const fitCount = selectedSquadRoster.filter((player) => player.health.selectionStatus === 'FIT').length;
    return {
      squads: (squadsQuery.data || []).length,
      matches: matches.length,
      roster: selectedSquadRoster.length,
      fit: fitCount,
      notFit: selectedSquadRoster.length - fitCount,
      active: activeParticipants.length,
      reserve: reserveParticipants.length,
    };
  }, [activeParticipants.length, matchesQuery.data, reserveParticipants.length, selectedSquadRoster, squadsQuery.data]);

  const addOrMovePlayer = (player: SquadRosterPlayer, slot: 'ACTIVE' | 'RESERVE') => {
    const existingPlayer =
      activeParticipants.find((item) => item.userId === player.userId) ||
      reserveParticipants.find((item) => item.userId === player.userId);
    const nextPlayer = existingPlayer || {
      userId: player.userId,
      jerseyNo: typeof player.jerseyNo === 'number' ? String(player.jerseyNo) : '',
      position: player.position || '',
    };

    setActiveParticipants((current) => {
      const withoutPlayer = current.filter((item) => item.userId !== player.userId);
      return slot === 'ACTIVE' ? [...withoutPlayer, nextPlayer] : withoutPlayer;
    });
    setReserveParticipants((current) => {
      const withoutPlayer = current.filter((item) => item.userId !== player.userId);
      return slot === 'RESERVE' ? [...withoutPlayer, nextPlayer] : withoutPlayer;
    });
  };

  const removeFromSelection = (userId: string) => {
    setActiveParticipants((current) => current.filter((item) => item.userId !== userId));
    setReserveParticipants((current) => current.filter((item) => item.userId !== userId));
    if (leadUserId === userId) {
      setLeadUserId('');
    }
  };

  const updatePlayerField = (
    setter: Dispatch<SetStateAction<EditableSelectionPlayer[]>>,
    userId: string,
    field: 'jerseyNo' | 'position',
    value: string
  ) => {
    setter((current) =>
      current.map((player) =>
        player.userId === userId ? { ...player, [field]: field === 'jerseyNo' ? value.replace(/[^\d]/g, '') : value } : player
      )
    );
  };
  const saveSelection = () => {
    if (!selectedMatchId) {
      setToast({ type: 'err', msg: 'Select an event first.' });
      return;
    }
    if (!selectedSquadId) {
      setToast({ type: 'err', msg: 'Create or select a squad before saving participant selection.' });
      return;
    }
    if (!eventUsesSelectedSquad) {
      setToast({ type: 'err', msg: 'Assign the selected squad to the event before saving participant selection.' });
      return;
    }
    if (!activeParticipants.length) {
      setToast({ type: 'err', msg: 'Select at least one active participant.' });
      return;
    }

    saveSelectionMutation.mutate();
  };

  const saveNewSquad = () => {
    if (!canManageSquads) {
      setToast({ type: 'err', msg: 'You do not have permission to create squads.' });
      return;
    }
    if (!newSquadName.trim()) {
      setToast({ type: 'err', msg: 'Squad name is required.' });
      return;
    }
    createSquadMutation.mutate();
  };

  const saveRosterMember = () => {
    if (!canManageSquads) {
      setToast({ type: 'err', msg: 'You do not have permission to manage squad rosters.' });
      return;
    }
    if (!selectedSquadId || !inviteUserId) {
      setToast({ type: 'err', msg: 'Select a squad and player first.' });
      return;
    }
    addMemberMutation.mutate();
  };

  if (!clubId || !canViewPage) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder }}
        >
          You do not have access to squad operations for this club.
        </div>
      </PageWrap>
    );
  }

  const isInitialLoading =
    (canReadSquads && squadsQuery.isLoading) ||
    (canReadPlayers && playersQuery.isLoading) ||
    (canReadSelection && matchesQuery.isLoading);

  if (isInitialLoading) {
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
        title="Squad Operations"
        subtitle="Create squads, manage athlete rosters, and prepare event participation with live fit / not fit health tags."
        right={<DotTag tone={canManageSelection || canManageSquads ? 'warn' : 'default'}>{canManageSelection || canManageSquads ? 'CAN MANAGE' : 'VIEW ONLY'}</DotTag>}
      />

      {toast ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: adminCardBorder, background: 'rgba(255,255,255,.65)' }}
        >
          <span className={toast.type === 'ok' ? 'text-emerald-700' : 'text-rose-700'}>{toast.msg}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <Stat label="Squads" value={counters.squads} />
        <Stat label="Events" value={counters.matches} />
        <Stat label="Roster" value={counters.roster} />
        <Stat label="Fit" value={counters.fit} />
        <Stat label="Not Fit" value={counters.notFit} />
        <Stat label="Active" value={counters.active} />
        <Stat label="Reserve" value={counters.reserve} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Squad Workspace"
          subtitle="Create a squad, then keep one working squad selected for roster and event setup."
          className="xl:col-span-5"
        >
          <div className="grid gap-3">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Selected squad</label>
              <select
                value={selectedSquadId}
                onChange={(event) => setSelectedSquadId(event.target.value)}
                disabled={!canReadSquads || !(squadsQuery.data || []).length}
                className="rounded-xl border bg-white/85 px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                {!(squadsQuery.data || []).length ? <option value="">No squads available</option> : null}
                {(squadsQuery.data || []).map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name} ({squad._count?.members ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 rounded-2xl border bg-white/65 p-3" style={{ borderColor: adminCardBorder }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Create squad</p>
              <input
                value={newSquadName}
                onChange={(event) => setNewSquadName(event.target.value)}
                placeholder="Squad name"
                disabled={!canManageSquads}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              />
              <input
                value={newSquadCode}
                onChange={(event) => setNewSquadCode(event.target.value)}
                placeholder="Code or short label"
                disabled={!canManageSquads}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              />
              <button
                type="button"
                onClick={saveNewSquad}
                disabled={!canManageSquads || createSquadMutation.isPending}
                className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-60"
                style={{
                  borderColor: adminCardBorder,
                  background: 'rgb(var(--primary))',
                  color: 'rgb(var(--primary-2))',
                }}
              >
                {createSquadMutation.isPending ? 'Creating...' : 'Create squad'}
              </button>
            </div>
          </div>
        </Section>

        <Section
          title="Selected Squad"
          subtitle="All downstream work uses the selected squad. Coaches, managers, and admins see live health status beside each player."
          className="xl:col-span-7"
          dark
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="text-xs text-white/60">Name</p>
              <p className="text-sm font-semibold text-white">{squadDetailQuery.data?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Code</p>
              <p className="text-sm font-semibold text-white">{squadDetailQuery.data?.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Members</p>
              <p className="text-sm font-semibold text-white">{selectedSquadRoster.length}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Created</p>
              <p className="text-sm font-semibold text-white">{formatDateTime(squadDetailQuery.data?.createdAt)}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/65">
            This page is sport-agnostic. The squad roster is managed first, then the same squad is attached to the event and used for participant selection.
          </p>
        </Section>
      </div>

      <Section
        title="Roster Management"
        subtitle="Add or remove squad members. Health tags come from each player's latest submitted health check-in."
        right={
          <button
            type="button"
            onClick={() => {
              void Promise.all([squadsQuery.refetch(), squadDetailQuery.refetch(), playersQuery.refetch()]);
            }}
            className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold"
            style={{ borderColor: adminCardBorder }}
          >
            Refresh
          </button>
        }
      >
        {!selectedSquadId ? (
          <p className="text-sm text-[rgb(var(--muted))]">Create or select a squad to unlock roster operations.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-4 space-y-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Add player</label>
                <select
                  value={inviteUserId}
                  onChange={(event) => setInviteUserId(event.target.value)}
                  disabled={!canManageSquads}
                  className="rounded-xl border bg-white/85 px-3 py-2 text-sm outline-none disabled:opacity-60"
                  style={{ borderColor: adminCardBorder }}
                >
                  <option value="">Select player</option>
                  {unassignedPlayers.map((player) => (
                    <option key={player.user.id} value={player.user.id}>
                      {displayName(player)} ({player.user.email})
                    </option>
                  ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={jerseyNo}
                    onChange={(event) => setJerseyNo(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Jersey no."
                    disabled={!canManageSquads}
                    className="rounded-xl border bg-white/85 px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <input
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    placeholder="Role or position"
                    disabled={!canManageSquads}
                    className="rounded-xl border bg-white/85 px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                </div>
                <button
                  type="button"
                  onClick={saveRosterMember}
                  disabled={!canManageSquads || !inviteUserId || addMemberMutation.isPending}
                  className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-60"
                  style={{
                    borderColor: adminCardBorder,
                    background: 'rgb(var(--primary))',
                    color: 'rgb(var(--primary-2))',
                  }}
                >
                  {addMemberMutation.isPending ? 'Saving...' : 'Save roster member'}
                </button>
              </div>
              <p className="text-xs text-[rgb(var(--muted))]">
                Saving an existing roster member again updates jersey and position details instead of creating duplicates.
              </p>
            </div>

            <div className="xl:col-span-8 space-y-3">
              {!selectedSquadRoster.length ? (
                <p className="text-sm text-[rgb(var(--muted))]">No players are assigned to this squad yet.</p>
              ) : (
                selectedSquadRoster.map((player) => {
                  const isRemoving =
                    removeMemberMutation.isPending &&
                    removeMemberMutation.variables === player.userId;
                  return (
                    <article
                      key={player.squadMemberId}
                      className="rounded-2xl border bg-white/75 px-3 py-3"
                      style={{ borderColor: adminCardBorder }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                            {displayName(player)}
                          </p>
                          <p className="truncate text-xs text-[rgb(var(--muted))]">
                            {player.user.email} | Jersey {player.jerseyNo ?? '-'} | {player.position || 'No role set'}
                          </p>
                          <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                            {player.health.note}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <DotTag tone={selectionTone(player)}>{selectionLabel(player)}</DotTag>
                          {player.health.selfReportedInjury ? (
                            <DotTag tone="warn">INJURY REPORTED</DotTag>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeMemberMutation.mutate(player.userId)}
                            disabled={!canManageSquads || isRemoving}
                            className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                            style={{ borderColor: adminCardBorder }}
                          >
                            {isRemoving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Section>
      <Section
        title="Event Assignment"
        subtitle="Choose the scheduled event, then bind the selected squad before saving participant selection."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMatchId}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              disabled={!canReadSelection || !(matchesQuery.data || []).length}
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              {!(matchesQuery.data || []).length ? <option value="">No events available</option> : null}
              {(matchesQuery.data || []).map((match: MatchItem) => (
                <option key={match.id} value={match.id}>
                  {(match.title || match.opponent || 'Event').trim()} - {formatDateTime(match.kickoffAt)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => assignSquadMutation.mutate()}
              disabled={!canManageSelection || !selectedMatchId || !selectedSquadId || assignSquadMutation.isPending}
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              {assignSquadMutation.isPending ? 'Assigning...' : 'Assign selected squad'}
            </button>
          </div>
        }
      >
        {!selectedMatchId ? (
          <p className="text-sm text-[rgb(var(--muted))]">Select an event to continue.</p>
        ) : workspaceQuery.isLoading ? (
          <p className="text-sm text-[rgb(var(--muted))]">Loading event workspace...</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7 rounded-3xl border bg-white/70 p-4" style={{ borderColor: adminCardBorder }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-[rgb(var(--text))]">
                    {selectedMatch?.title || `vs ${selectedMatch?.opponent || 'Opponent'}`}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {formatDateTime(selectedMatch?.kickoffAt)} | {selectedMatch?.venue || 'Venue TBA'}
                  </p>
                </div>
                <DotTag tone={String(selectedMatch?.status || '') === 'LIVE' ? 'warn' : 'default'}>
                  {selectedMatch?.status || 'SCHEDULED'}
                </DotTag>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">Event squad</p>
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {selectedMatch?.squad?.name || 'No squad assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">Working squad</p>
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {squadDetailQuery.data?.name || 'No squad selected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 rounded-3xl border bg-white/70 p-4" style={{ borderColor: adminCardBorder }}>
              <p className="text-sm font-extrabold text-[rgb(var(--text))]">Assignment status</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                {eventUsesSelectedSquad
                  ? 'The event is already using the selected squad. You can save participant selection now.'
                  : 'Assign the selected squad to this event before saving participant selection.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DotTag tone={eventUsesSelectedSquad ? 'ok' : 'warn'}>
                  {eventUsesSelectedSquad ? 'READY' : 'ASSIGN REQUIRED'}
                </DotTag>
                <DotTag tone="default">{selectedSquadRoster.length} PLAYERS</DotTag>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Participant Selection"
        subtitle="Choose active and reserve participants from the selected squad. Fit tags stay visible during selection."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={selectionNote}
              onChange={(event) => setSelectionNote(event.target.value)}
              disabled={!canManageSelection || !selectedSquadId}
              placeholder="Setup note / unit / shape"
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <select
              value={leadUserId}
              onChange={(event) => setLeadUserId(event.target.value)}
              disabled={!canManageSelection || !selectedAthletes.length}
              className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              <option value="">Captain / team lead</option>
              {selectedAthletes.map((player) => (
                <option key={player.userId} value={player.userId}>
                  {displayName(player)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveSelection}
              disabled={!canManageSelection || saveSelectionMutation.isPending || !selectedSquadId}
              className="rounded-full border bg-[rgb(var(--primary))] px-4 py-2 text-xs font-extrabold text-[rgb(var(--primary-2))] disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            >
              {saveSelectionMutation.isPending ? 'Saving...' : 'Save selection'}
            </button>
          </div>
        }
      >
        {!selectedSquadId ? (
          <p className="text-sm text-[rgb(var(--muted))]">Create or select a squad to begin participant selection.</p>
        ) : !selectedSquadRoster.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">Add players to the selected squad to unlock participant selection.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Player List</p>
              {selectedSquadRoster.map((player) => {
                const isActive = activeParticipants.some((item) => item.userId === player.userId);
                const isReserve = reserveParticipants.some((item) => item.userId === player.userId);
                return (
                  <article
                    key={player.squadMemberId}
                    className="rounded-2xl border bg-white/75 px-3 py-3"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                          {displayName(player)}
                        </p>
                        <p className="truncate text-xs text-[rgb(var(--muted))]">
                          Jersey {player.jerseyNo ?? '-'} | {player.position || player.profile?.positions?.join(', ') || 'No role set'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <DotTag tone={selectionTone(player)}>{selectionLabel(player)}</DotTag>
                        {player.health.selfReportedInjury ? (
                          <DotTag tone="warn">INJURY REPORTED</DotTag>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">{player.health.note}</p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                      Self report: {player.health.label} | Readiness {player.health.readinessScore ?? '-'} | Energy {player.health.energyLevel ?? '-'} | Soreness {player.health.sorenessLevel ?? '-'} | Sleep {player.health.sleepHours ?? '-'}
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                      Last check-in: {formatDateTime(player.health.lastUpdatedAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addOrMovePlayer(player, 'ACTIVE')}
                        disabled={!canManageSelection}
                        className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold disabled:opacity-60"
                        style={{ borderColor: adminCardBorder }}
                      >
                        {isActive ? 'In active group' : 'Add active'}
                      </button>
                      <button
                        type="button"
                        onClick={() => addOrMovePlayer(player, 'RESERVE')}
                        disabled={!canManageSelection}
                        className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold disabled:opacity-60"
                        style={{ borderColor: adminCardBorder }}
                      >
                        {isReserve ? 'In reserve' : 'Add reserve'}
                      </button>
                      {(isActive || isReserve) ? (
                        <button
                          type="button"
                          onClick={() => removeFromSelection(player.userId)}
                          disabled={!canManageSelection}
                          className="rounded-full border bg-white px-3 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                          style={{ borderColor: adminCardBorder }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="xl:col-span-7 grid gap-4 lg:grid-cols-2">
              <SelectionColumn
                title="Active Participants"
                subtitle="Athletes expected to take part from the start."
                players={activeParticipants}
                rosterByUserId={rosterByUserId}
                onRemove={removeFromSelection}
                onUpdateField={(userId, field, value) => updatePlayerField(setActiveParticipants, userId, field, value)}
                disabled={!canManageSelection}
              />
              <SelectionColumn
                title="Reserve Participants"
                subtitle="Athletes held ready as backup or later rotation."
                players={reserveParticipants}
                rosterByUserId={rosterByUserId}
                onRemove={removeFromSelection}
                onUpdateField={(userId, field, value) => updatePlayerField(setReserveParticipants, userId, field, value)}
                disabled={!canManageSelection}
              />
            </div>
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

type SelectionColumnProps = {
  title: string;
  subtitle: string;
  players: EditableSelectionPlayer[];
  rosterByUserId: Map<string, SquadRosterPlayer>;
  onRemove: (userId: string) => void;
  onUpdateField: (userId: string, field: 'jerseyNo' | 'position', value: string) => void;
  disabled: boolean;
};

function SelectionColumn({
  title,
  subtitle,
  players,
  rosterByUserId,
  onRemove,
  onUpdateField,
  disabled,
}: SelectionColumnProps) {
  return (
    <div className="rounded-3xl border bg-white/55 p-4" style={{ borderColor: adminCardBorder }}>
      <div className="mb-3">
        <p className="text-sm font-extrabold text-[rgb(var(--text))]">{title}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p>
      </div>

      {!players.length ? (
        <p className="text-sm text-[rgb(var(--muted))]">No players selected.</p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => {
            const rosterPlayer = rosterByUserId.get(player.userId);
            return (
              <article
                key={player.userId}
                className="rounded-2xl border bg-white/85 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[rgb(var(--text))]">
                      {rosterPlayer ? displayName(rosterPlayer) : player.userId}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {rosterPlayer?.health.label || 'No status'} | {rosterPlayer?.health.note || 'No health details yet'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DotTag tone={selectionTone(rosterPlayer)}>
                      {selectionLabel(rosterPlayer)}
                    </DotTag>
                    {rosterPlayer?.health.selfReportedInjury ? (
                      <DotTag tone="warn">INJURY REPORTED</DotTag>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    value={player.jerseyNo}
                    onChange={(event) => onUpdateField(player.userId, 'jerseyNo', event.target.value)}
                    disabled={disabled}
                    placeholder="Jersey"
                    className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <input
                    value={player.position}
                    onChange={(event) => onUpdateField(player.userId, 'position', event.target.value)}
                    disabled={disabled}
                    placeholder="Role or position"
                    className="rounded-xl border bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove(player.userId)}
                    disabled={disabled}
                    className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
