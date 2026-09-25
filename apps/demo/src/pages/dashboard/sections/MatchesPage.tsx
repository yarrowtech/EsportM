import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  createClubMatch,
  getClubMatches,
  getClubSquads,
  type MatchItem,
  type SquadSummary,
} from '../../../api/admin.api';
import { useMe } from '../../../hooks/useMe';
import { hasRolePermission } from '../../../utils/rolePolicy';
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from '../../admin/admin-ui';

type Filter = 'ALL' | 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';

const PRIMARY_ROLES = ['ADMIN', 'MANAGER', 'PLAYER', 'MEMBER'] as const;
const SUB_ROLES = ['COACH', 'PHYSIO', 'AGENT', 'NUTRITIONIST', 'PITCH_MANAGER', 'CAPTAIN'] as const;
type PrimaryRole = (typeof PRIMARY_ROLES)[number];
type SubRole = (typeof SUB_ROLES)[number];

function normalizePrimaryRole(value: unknown): PrimaryRole {
  const role = String(value || '').toUpperCase();
  if (PRIMARY_ROLES.includes(role as PrimaryRole)) return role as PrimaryRole;
  return 'MEMBER';
}

function normalizeSubRoles(value: unknown): SubRole[] {
  if (!Array.isArray(value)) return [];
  const picked: SubRole[] = [];
  for (const role of SUB_ROLES) {
    if (value.includes(role)) picked.push(role);
  }
  return picked;
}

function statusTone(status?: string | null) {
  if (status === 'LIVE') return 'warn';
  if (status === 'FINISHED') return 'ok';
  if (status === 'CANCELLED') return 'danger';
  return 'default';
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [now] = useState(() => Date.now());
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [opponent, setOpponent] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedSquadId, setSelectedSquadId] = useState('');
  const [kickoffAt, setKickoffAt] = useState(() => {
    const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}T${pad(nextDay.getHours())}:${pad(nextDay.getMinutes())}`;
  });

  const meQuery = useMe();
  const meData = (meQuery.data || {}) as {
    activeClubId?: string | null;
    activeMembership?: { primary?: string; subRoles?: string[] } | null;
  };
  const primaryRole = normalizePrimaryRole(meData.activeMembership?.primary);
  const subRoles = normalizeSubRoles(meData.activeMembership?.subRoles);
  const canManageMatches = hasRolePermission(primaryRole, subRoles, 'matches.write');
  const canReadLineups = hasRolePermission(primaryRole, subRoles, 'lineups.read');
  const activeClubId = String(meData.activeClubId || localStorage.getItem('activeClubId') || '').trim();

  const matchesQuery = useQuery({
    queryKey: ['club-matches', activeClubId],
    queryFn: () => getClubMatches(activeClubId),
    enabled: !!activeClubId,
  });

  const squadsQuery = useQuery({
    queryKey: ['club-squads', activeClubId],
    queryFn: () => getClubSquads(activeClubId),
    enabled: !!activeClubId,
  });

  const matches = useMemo(() => {
    return [...(matchesQuery.data || [])].sort(
      (a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime()
    );
  }, [matchesQuery.data]);

  const counters = useMemo(() => {
    const upcoming = matches.filter((match) => {
      const kickoff = new Date(match.kickoffAt || 0).getTime();
      return Number.isFinite(kickoff) && kickoff >= now;
    }).length;
    return {
      total: matches.length,
      upcoming,
      scheduled: matches.filter((match) => String(match.status || '').toUpperCase() === 'SCHEDULED').length,
      live: matches.filter((match) => String(match.status || '').toUpperCase() === 'LIVE').length,
      finished: matches.filter((match) => String(match.status || '').toUpperCase() === 'FINISHED').length,
      cancelled: matches.filter((match) => String(match.status || '').toUpperCase() === 'CANCELLED').length,
    };
  }, [matches, now]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return matches;
    return matches.filter((match) => String(match.status || '').toUpperCase() === filter);
  }, [matches, filter]);

  const selectedSquad = useMemo(
    () => (squadsQuery.data || []).find((squad) => squad.id === selectedSquadId) || null,
    [selectedSquadId, squadsQuery.data]
  );

  const onCreateMatch = async () => {
    if (!canManageMatches) return;
    if (!activeClubId) {
      setCreateError('No active club selected.');
      return;
    }
    if (!title.trim() || !opponent.trim() || !kickoffAt) {
      setCreateError('Title, opponent, and kickoff are required.');
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      await createClubMatch(activeClubId, {
        title: title.trim(),
        opponent: opponent.trim(),
        venue: venue.trim() || undefined,
        kickoffAt: new Date(kickoffAt).toISOString(),
        squadId: selectedSquadId || undefined,
      });
      setShowCreate(false);
      setTitle('');
      setOpponent('');
      setVenue('');
      setSelectedSquadId('');
      await matchesQuery.refetch();
    } catch (error: any) {
      setCreateError(error?.response?.data?.message || error?.message || 'Failed to create match.');
    } finally {
      setCreating(false);
    }
  };

  if (matchesQuery.isLoading || meQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading fixture board...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Matches Hub"
        subtitle="Fixtures, squad assignment, and quick access into lineup management."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <DotTag>MATCHES</DotTag>
            {canReadLineups && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/squad-management')}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
                style={{ borderColor: adminCardBorder }}
              >
                Squad Management
              </button>
            )}
            {canManageMatches && (
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setShowCreate((prev) => !prev);
                }}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold transition hover:bg-white"
                style={{ borderColor: adminCardBorder }}
              >
                Create Match
              </button>
            )}
          </div>
        }
      />

      {(matchesQuery.isError || squadsQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: 'rgba(255,255,255,.65)' }}
        >
          Unable to fetch the latest fixture data right now.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="All Matches" value={counters.total} />
        <Stat label="Upcoming" value={counters.upcoming} />
        <Stat label="Scheduled" value={counters.scheduled} />
        <Stat label="Live" value={counters.live} />
        <Stat label="Finished" value={counters.finished} />
        <Stat label="Cancelled" value={counters.cancelled} />
      </div>

      {canManageMatches && showCreate && (
        <Section title="Create Match" subtitle="Create the fixture and optionally bind a squad upfront.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Match title"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
              placeholder="Opponent"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Venue (optional)"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(event) => setKickoffAt(event.target.value)}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <select
              value={selectedSquadId}
              onChange={(event) => setSelectedSquadId(event.target.value)}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            >
              <option value="">No squad yet</option>
              {(squadsQuery.data || []).map((squad: SquadSummary) => (
                <option key={squad.id} value={squad.id}>
                  {squad.name} ({squad._count?.members ?? 0})
                </option>
              ))}
            </select>
          </div>
          {selectedSquad ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              New lineup will start from squad <span className="font-semibold text-[rgb(var(--text))]">{selectedSquad.name}</span>.
            </p>
          ) : null}
          {createError && <p className="mt-2 text-sm font-semibold text-rose-700">{createError}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onCreateMatch}
              disabled={creating}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: 'rgb(var(--primary))',
                color: 'rgb(var(--primary-2))',
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {creating ? 'Creating...' : 'Create Match'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm font-semibold"
              style={{ borderColor: adminCardBorder }}
            >
              Cancel
            </button>
          </div>
        </Section>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Fixture Stream"
          subtitle="Filter the calendar and jump into lineup prep when the squad is assigned."
          className="xl:col-span-8"
          right={
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED'] as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    filter === option ? 'bg-[rgba(var(--primary),.24)]' : 'bg-white/70 hover:bg-white/90'
                  }`}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          {!filtered.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No matches for this filter.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((match: MatchItem) => (
                <article
                  key={match.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[rgb(var(--text))]">
                        {match.title || `vs ${match.opponent || 'Opponent'}`}
                      </p>
                      <p className="truncate text-xs text-[rgb(var(--muted))]">
                        {formatDateTime(match.kickoffAt)} | {match.venue || 'Venue TBA'}
                      </p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Squad: {match.squad?.name || 'Not assigned'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DotTag tone={statusTone(match.status)}>{match.status || 'SCHEDULED'}</DotTag>
                      <span className="text-xs font-bold text-[rgb(var(--text))]">
                        {match.homeScore != null && match.awayScore != null
                          ? `${match.homeScore} - ${match.awayScore}`
                          : 'Pending'}
                      </span>
                      {canReadLineups ? (
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard/squad-management', { state: { matchId: match.id } })}
                          className="rounded-full border bg-white/85 px-3 py-1 text-[11px] font-semibold"
                          style={{ borderColor: adminCardBorder }}
                        >
                          Manage lineup
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Result Snapshot" subtitle="Live distribution for this club calendar." className="xl:col-span-4" dark>
          <div className="space-y-3">
            <LineItem label="Upcoming" value={counters.upcoming} />
            <LineItem label="Scheduled" value={counters.scheduled} />
            <LineItem label="Live" value={counters.live} />
            <LineItem label="Finished" value={counters.finished} />
            <LineItem label="Cancelled" value={counters.cancelled} />
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}

function LineItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
      <p className="text-xs text-white/70">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
