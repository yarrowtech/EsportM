import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  createClub,
  getClubMatches,
  getClubMembers,
  getClubPlayers,
  getClubSquads,
  getLeaderboard,
  getPendingSignups,
  type Club,
  type LeaderboardMetric,
  type LeaderboardRow,
  type MatchItem,
  type PrimaryRole,
} from "../../api/admin.api";
import { dashboardApi } from "../../api/dashboard.api";
import { type RolePermission } from "../../utils/rolePolicy";
import {
  Divider,
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  cx,
  formatCountdown,
  formatDateTime,
} from "./admin-ui";

type Ctx = {
  clubId: string;
  user?: { fullName?: string; role?: "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER" };
  clubs?: Club[];
  role?: "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER";
  permissions?: RolePermission[];
  isPlatformAdmin?: boolean;
  onClubCreated?: (club: Club) => void;
};

type RecentPayload = {
  matches?: MatchItem[];
  injuries?: Array<{
    id: string;
    type?: string;
    severity?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }>;
};

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

function memberDisplayName(row: LeaderboardRow) {
  return row?.user?.fullName || row?.user?.email || row?.user?.id || "Player";
}

function matchTone(status?: string) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

export default function AdminDashboard() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const role = ctx.role || ctx.user?.role || "PLAYER";
  const permissions = ctx.permissions || [];
  const isPlatformAdmin = !!ctx.isPlatformAdmin;
  const clubName = ctx.clubs?.find((club) => club.id === clubId)?.name || "Club";
  const fullName = ctx.user?.fullName || "Admin";
  const firstName = fullName.split(" ")[0] || "Admin";
  const canReadSignups = permissions.includes("members.assign.signup");
  const canCreateClub = permissions.includes("clubs.create") && isPlatformAdmin;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [metric, setMetric] = useState<LeaderboardMetric>("goals");

  const [players, setPlayers] = useState<Array<{ user: { id: string } }>>([]);
  const [members, setMembers] = useState<Array<{ userId: string }>>([]);
  const [squads, setSquads] = useState<Array<{ id: string; name: string; _count?: { members?: number } }>>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [pendingSignups, setPendingSignups] = useState<Array<{ id: string; fullName?: string | null; email: string; pendingAssignment?: { primary: PrimaryRole; expiresAt: string } | null }>>([]);
  const [pendingSignupsTotal, setPendingSignupsTotal] = useState(0);
  const [recent, setRecent] = useState<RecentPayload>({});

  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createOwnerEmail, setCreateOwnerEmail] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!clubId) {
        setErr("No club selected. Please choose a club from the header.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        const pendingPromise = canReadSignups
          ? getPendingSignups(clubId, {
              scope: "CLUB",
              page: 1,
              pageSize: 5,
            }).catch(() => ({
                users: [],
                pagination: {
                  page: 1,
                  pageSize: 5,
                  total: 0,
                  totalPages: 0,
                  hasNext: false,
                  scope: "CLUB" as const,
                  q: "",
                },
              }))
          : Promise.resolve({
              users: [],
              pagination: {
                page: 1,
                pageSize: 5,
                total: 0,
                totalPages: 0,
                hasNext: false,
                scope: "CLUB" as const,
                q: "",
              },
            });
        const [clubPlayers, clubMembers, clubSquads, clubMatches, board, recents] = await Promise.all([
          getClubPlayers(clubId),
          getClubMembers(clubId),
          getClubSquads(clubId),
          getClubMatches(clubId),
          getLeaderboard(clubId, metric, 8),
          dashboardApi.recent(8),
        ]);

        const signups = await pendingPromise;

        if (!alive) return;
        setPlayers(clubPlayers || []);
        setMembers(clubMembers || []);
        setSquads(clubSquads || []);
        setMatches(clubMatches || []);
        setLeaderboard(board || []);
        setRecent((recents || {}) as RecentPayload);
        setPendingSignups(signups?.users || []);
        setPendingSignupsTotal(Number(signups?.pagination?.total || 0));
      } catch (e: unknown) {
        if (!alive) return;
        setErr(messageOf(e, "Failed to load admin dashboard."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [clubId, metric, canReadSignups]);

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    return [...matches]
      .filter((row) => {
        const timestamp = row.kickoffAt ? new Date(row.kickoffAt).getTime() : NaN;
        return Number.isFinite(timestamp) && timestamp >= now;
      })
      .sort((a, b) => new Date(a.kickoffAt || 0).getTime() - new Date(b.kickoffAt || 0).getTime());
  }, [matches]);

  const recentMatches = useMemo(() => (recent.matches || []).slice(0, 5), [recent.matches]);
  const injuries = useMemo(() => (recent.injuries || []).slice(0, 5), [recent.injuries]);
  const statusCount = useMemo(() => {
    return matches.reduce(
      (acc, match) => {
        const status = match.status || "SCHEDULED";
        if (status === "LIVE") acc.live += 1;
        if (status === "FINISHED") acc.finished += 1;
        if (status === "CANCELLED") acc.cancelled += 1;
        if (status === "SCHEDULED") acc.scheduled += 1;
        return acc;
      },
      { live: 0, finished: 0, cancelled: 0, scheduled: 0 }
    );
  }, [matches]);

  const rosterCoverage = members.length ? Math.min(100, Math.round((players.length / members.length) * 100)) : 0;
  const squadUtilization = squads.length
    ? Math.round(
        (squads.filter((squad) => (squad?._count?.members || 0) > 0).length / squads.length) * 100
      )
    : 0;
  const queueLoad = Math.min(100, pendingSignupsTotal * 10);

  const topPerformer = leaderboard[0];
  const topValue = topPerformer ? metricValue(topPerformer, metric) : 0;
  const nextKickoff = upcomingMatches[0];

  const onCreateClub = async () => {
    if (!canCreateClub) {
      setToast({ type: "err", msg: "You do not have permission to create clubs." });
      return;
    }
    if (!createName.trim()) {
      setToast({ type: "err", msg: "Club name is required." });
      return;
    }
    if (!createOwnerEmail.trim()) {
      setToast({ type: "err", msg: "Owner email is required." });
      return;
    }

    try {
      setCreatingClub(true);
      const club = await createClub({
        name: createName.trim(),
        slug: createSlug.trim() || undefined,
        ownerEmail: createOwnerEmail.trim(),
      });

      ctx.onClubCreated?.(club);
      setCreateName("");
      setCreateSlug("");
      setCreateOwnerEmail("");
      setToast({ type: "ok", msg: `Club "${club.name}" created and assigned to owner.` });
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to create club.") });
    } finally {
      setCreatingClub(false);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading admin dashboard data...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title={`Welcome back, ${firstName}`}
        subtitle={`${clubName} command center with live members, squads, matches, and onboarding signals.`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <DotTag>{role}</DotTag>
            <DotTag tone={pendingSignupsTotal > 0 ? "warn" : "ok"}>
              Queue {pendingSignupsTotal}
            </DotTag>
            <DotTag tone={statusCount.live > 0 ? "warn" : "default"}>Live {statusCount.live}</DotTag>
          </div>
        }
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={members.length} hint="All roles in active club" />
        <Stat label="Players" value={players.length} hint={`${rosterCoverage}% of memberships`} />
        <Stat label="Upcoming Matches" value={upcomingMatches.length} hint="Future kickoffs" />
        <Stat label="Top Performer" value={topValue} hint={topPerformer ? memberDisplayName(topPerformer) : "No stats yet"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Section title="Operations Progress" subtitle="Live progress across roster, squads, and onboarding." className="xl:col-span-3">
          <div className="space-y-4">
            <ProgressRow label="Roster coverage" value={rosterCoverage} />
            <ProgressRow label="Squad utilization" value={squadUtilization} />
            <ProgressRow label="Onboarding load" value={queueLoad} />
          </div>
          <Divider />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Scheduled" value={statusCount.scheduled} />
            <Stat label="Finished" value={statusCount.finished} />
          </div>
        </Section>

        <Section
          title="Create Club"
          subtitle="Provision a club and assign ADMIN to owner user."
          className="xl:col-span-2"
          right={<DotTag tone="warn">Action</DotTag>}
        >
          <div className="grid gap-2">
            <input
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Club name"
              className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={createSlug}
              onChange={(event) => setCreateSlug(event.target.value)}
              placeholder="Slug (optional)"
              className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={createOwnerEmail}
              onChange={(event) => setCreateOwnerEmail(event.target.value)}
              placeholder="Owner email (signup user)"
              className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <button
              type="button"
              onClick={onCreateClub}
              disabled={!canCreateClub || creatingClub || !createOwnerEmail.trim()}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {!canCreateClub ? "Not Allowed" : creatingClub ? "Creating..." : "Create club"}
            </button>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Performance Pulse" subtitle="Leaderboard by selected metric." className="xl:col-span-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <DotTag>{clubName}</DotTag>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as LeaderboardMetric)}
              className="rounded-full border bg-white/75 px-3 py-1 text-xs font-semibold outline-none"
              style={{ borderColor: adminCardBorder }}
            >
              <option value="goals">Goals</option>
              <option value="assists">Assists</option>
              <option value="minutes">Minutes</option>
            </select>
          </div>
          {!leaderboard.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No leaderboard data for this club yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 6).map((row, index) => {
                const value = metricValue(row, metric);
                const maxValue = Math.max(...leaderboard.slice(0, 6).map((item) => metricValue(item, metric)), 1);
                const width = `${Math.max(8, Math.round((value / maxValue) * 100))}%`;

                return (
                  <div key={`${row.user?.id || index}`} className="rounded-xl border bg-white/72 p-2" style={{ borderColor: adminCardBorder }}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-[rgb(var(--text))]">
                        #{index + 1} {memberDisplayName(row)}
                      </p>
                      <p className="text-xs font-extrabold text-[rgb(var(--text))]">{value}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/5">
                      <div className="h-full rounded-full" style={{ width, background: "rgba(var(--primary), .78)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Match Clock" subtitle="Next kickoff and status split." className="xl:col-span-4">
          <div className="grid gap-3">
            <div className="rounded-2xl border bg-white/70 p-3" style={{ borderColor: adminCardBorder }}>
              <p className="text-xs text-[rgb(var(--muted))]">Next kickoff in</p>
              <p className="mt-1 text-3xl font-extrabold text-[rgb(var(--text))]">
                {formatCountdown(nextKickoff?.kickoffAt)}
              </p>
              <p className="mt-1 truncate text-xs text-[rgb(var(--muted))]">
                {nextKickoff?.title || nextKickoff?.opponent || "No upcoming match"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DotTag tone={statusCount.live > 0 ? "warn" : "default"}>Live {statusCount.live}</DotTag>
              <DotTag tone="ok">Finished {statusCount.finished}</DotTag>
              <DotTag>Scheduled {statusCount.scheduled}</DotTag>
              <DotTag tone={statusCount.cancelled > 0 ? "danger" : "default"}>
                Cancelled {statusCount.cancelled}
              </DotTag>
            </div>
          </div>
        </Section>

        <Section
          title="Onboarding Queue"
          subtitle="Invitation pipeline: admin invites, member accepts."
          className="xl:col-span-4"
          dark
          right={<DotTag tone={pendingSignupsTotal > 0 ? "warn" : "ok"}>{pendingSignupsTotal}</DotTag>}
        >
          {!pendingSignups.length ? (
            <p className="text-sm text-white/75">No pending signups right now.</p>
          ) : (
            <div className="space-y-2">
              {pendingSignups.slice(0, 5).map((signup) => (
                <div key={signup.id} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {signup.fullName || signup.email}
                  </p>
                  <p className="truncate text-xs text-white/60">{signup.id}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {signup.pendingAssignment
                      ? `Invitation pending: ${signup.pendingAssignment.primary} until ${formatDateTime(signup.pendingAssignment.expiresAt)}`
                      : "No invitation yet"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Upcoming Schedule" subtitle="Ordered by closest kickoff." className="xl:col-span-7">
          {!upcomingMatches.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No upcoming matches found.</p>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.slice(0, 6).map((match) => (
                <article
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/75 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                      {match.title || `vs ${match.opponent || "Opponent"}`}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {formatDateTime(match.kickoffAt)} | {match.venue || "Venue TBA"}
                    </p>
                  </div>
                  <DotTag tone={matchTone(match.status)}>{match.status || "SCHEDULED"}</DotTag>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Recent Activity" subtitle="Latest matches and injury feed." className="xl:col-span-5">
          <div className="grid gap-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--muted))]">
                Recent matches
              </p>
              {!recentMatches.length ? (
                <p className="text-sm text-[rgb(var(--muted))]">No recent matches.</p>
              ) : (
                <div className="space-y-2">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="rounded-xl border bg-white/72 px-3 py-2" style={{ borderColor: adminCardBorder }}>
                      <p className="truncate text-sm font-bold text-[rgb(var(--text))]">
                        {match.title || `vs ${match.opponent || "Opponent"}`}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {formatDateTime(match.kickoffAt)} | {match.status || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--muted))]">
                Injury feed
              </p>
              {!injuries.length ? (
                <p className="text-sm text-[rgb(var(--muted))]">No recent injuries.</p>
              ) : (
                <div className="space-y-2">
                  {injuries.map((injury) => (
                    <div
                      key={injury.id}
                      className={cx(
                        "rounded-xl border px-3 py-2",
                        injury.isActive ? "bg-rose-50/65" : "bg-white/72"
                      )}
                      style={{ borderColor: adminCardBorder }}
                    >
                      <p className="text-sm font-bold text-[rgb(var(--text))]">
                        {injury.type || "Injury"} ({injury.severity || "N/A"})
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Start {formatDateTime(injury.startDate)} | End {formatDateTime(injury.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </PageWrap>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[rgb(var(--muted))]">{label}</p>
        <p className="text-xs font-extrabold text-[rgb(var(--text))]">{value}%</p>
      </div>
      <div className="h-2 rounded-full bg-black/5">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(3, Math.min(100, value))}%`,
            background:
              "linear-gradient(90deg, rgba(var(--primary),.85), rgba(var(--primary-2),.65))",
          }}
        />
      </div>
    </div>
  );
}

