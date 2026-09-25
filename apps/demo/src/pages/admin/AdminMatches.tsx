import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  createClubMatch,
  getClubMatches,
  updateClubMatchStatus,
  type MatchItem,
  type MatchStatus,
} from "../../api/admin.api";
import { type RolePermission } from "../../utils/rolePolicy";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  cx,
  formatDateTime,
} from "./admin-ui";

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type Filter = "ALL" | "UPCOMING" | "LIVE" | "FINISHED" | "CANCELLED";

const ALL_STATUSES: MatchStatus[] = ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"];

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function filterMatch(match: MatchItem, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "UPCOMING") {
    const kickoff = match.kickoffAt ? new Date(match.kickoffAt).getTime() : NaN;
    return Number.isFinite(kickoff) && kickoff >= Date.now();
  }
  return (match.status || "SCHEDULED") === filter;
}

function statusTone(status?: string) {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

function toLocalInputValue(input?: string | null) {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminMatches() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const permissionSet = new Set<RolePermission>(ctx.permissions || []);
  const canRead = permissionSet.has("matches.read");
  const canManage = permissionSet.has("matches.write");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [kickoffAt, setKickoffAt] = useState(toLocalInputValue(new Date(Date.now() + 86400000).toISOString()));

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clubId) {
      setErr("No club selected. Please choose a club from the header.");
      setLoading(false);
      return;
    }
    if (!canRead) {
      setErr("You do not have permission to view matches for this club.");
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const rows = await getClubMatches(clubId);
      setMatches(rows || []);
    } catch (e: unknown) {
      setErr(messageOf(e, "Failed to load matches."));
    } finally {
      setLoading(false);
    }
  }, [canRead, clubId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const ta = new Date(a.kickoffAt || 0).getTime();
      const tb = new Date(b.kickoffAt || 0).getTime();
      return tb - ta;
    });
  }, [matches]);

  const filteredMatches = useMemo(
    () => sortedMatches.filter((match) => filterMatch(match, filter)),
    [sortedMatches, filter]
  );

  const counters = useMemo(() => {
    const now = Date.now();
    const upcoming = matches.filter((match) => {
      const kickoff = match.kickoffAt ? new Date(match.kickoffAt).getTime() : NaN;
      return Number.isFinite(kickoff) && kickoff >= now;
    }).length;

    return {
      all: matches.length,
      upcoming,
      live: matches.filter((match) => match.status === "LIVE").length,
      finished: matches.filter((match) => match.status === "FINISHED").length,
      cancelled: matches.filter((match) => match.status === "CANCELLED").length,
    };
  }, [matches]);

  const onCreateMatch = async () => {
    if (!canManage) {
      setToast({ type: "err", msg: "Only ADMIN or MANAGER can create matches." });
      return;
    }
    if (!title.trim() || !opponent.trim() || !kickoffAt) {
      setToast({ type: "err", msg: "Title, opponent, and kickoff are required." });
      return;
    }

    try {
      setCreating(true);
      await createClubMatch(clubId, {
        title: title.trim(),
        opponent: opponent.trim(),
        venue: venue.trim() || undefined,
        kickoffAt: new Date(kickoffAt).toISOString(),
      });
      setTitle("");
      setOpponent("");
      setVenue("");
      setToast({ type: "ok", msg: "Match created." });
      await load();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to create match.") });
    } finally {
      setCreating(false);
    }
  };

  const onUpdateStatus = async (match: MatchItem, status: MatchStatus) => {
    if (!canManage) {
      setToast({ type: "err", msg: "Only ADMIN or MANAGER can update status." });
      return;
    }

    try {
      setUpdatingId(match.id);
      await updateClubMatchStatus(clubId, match.id, {
        status,
        homeScore: typeof match.homeScore === "number" ? match.homeScore : undefined,
        awayScore: typeof match.awayScore === "number" ? match.awayScore : undefined,
      });
      await load();
      setToast({ type: "ok", msg: "Match status updated." });
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to update status.") });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading matches...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Match Control"
        subtitle="Schedule fixtures and update live match lifecycle with real backend data."
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="All Matches" value={counters.all} />
        <Stat label="Upcoming" value={counters.upcoming} />
        <Stat label="Live" value={counters.live} />
        <Stat label="Finished" value={counters.finished} />
        <Stat label="Cancelled" value={counters.cancelled} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Create Match"
          subtitle="Add a new fixture to club schedule."
          className="xl:col-span-5"
          right={<DotTag tone="warn">Action</DotTag>}
        >
          <div className="grid gap-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Match title"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
              placeholder="Opponent"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Venue (optional)"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(event) => setKickoffAt(event.target.value)}
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <button
              type="button"
              onClick={onCreateMatch}
              disabled={!canManage || creating}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {creating ? "Creating..." : "Create match"}
            </button>
          </div>
        </Section>

        <Section
          title="Status Filters"
          subtitle="Quickly inspect fixture state."
          className="xl:col-span-7"
          dark
          right={<DotTag>{filter}</DotTag>}
        >
          <div className="flex flex-wrap gap-2">
            {(["ALL", "UPCOMING", "LIVE", "FINISHED", "CANCELLED"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cx(
                  "rounded-full border px-3 py-1 text-xs font-extrabold transition",
                  filter === item ? "bg-white text-[rgb(var(--primary-2))]" : "bg-white/10 text-white hover:bg-white/20"
                )}
                style={{ borderColor: "rgba(255,255,255,.25)" }}
              >
                {item}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Section
        title="Fixture List"
        subtitle="Matches ordered by kickoff time (latest first)."
        right={
          <button
            type="button"
            onClick={load}
            className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold"
            style={{ borderColor: adminCardBorder }}
          >
            Refresh
          </button>
        }
      >
        {!filteredMatches.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No matches found for this filter.</p>
        ) : (
          <div className="space-y-2">
            {filteredMatches.map((match) => (
              <article
                key={match.id}
                className="grid gap-2 rounded-2xl border bg-white/75 px-3 py-3 md:grid-cols-[1.3fr_.7fr_.7fr_auto]"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                    {match.title || `vs ${match.opponent || "Opponent"}`}
                  </p>
                  <p className="truncate text-xs text-[rgb(var(--muted))]">
                    {formatDateTime(match.kickoffAt)} | {match.venue || "No venue"}
                  </p>
                </div>

                <div className="text-xs text-[rgb(var(--muted))]">
                  <p>Status</p>
                  <DotTag tone={statusTone(match.status)}>{match.status || "SCHEDULED"}</DotTag>
                </div>

                <div className="text-xs text-[rgb(var(--muted))]">
                  <p>Score</p>
                  <p className="font-extrabold text-[rgb(var(--text))]">
                    {typeof match.homeScore === "number" && typeof match.awayScore === "number"
                      ? `${match.homeScore} - ${match.awayScore}`
                      : "Pending"}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <select
                    value={(match.status as MatchStatus) || "SCHEDULED"}
                    onChange={(event) => onUpdateStatus(match, event.target.value as MatchStatus)}
                    disabled={!canManage || updatingId === match.id}
                    className="rounded-full border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                    style={{ borderColor: adminCardBorder }}
                  >
                    {ALL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

