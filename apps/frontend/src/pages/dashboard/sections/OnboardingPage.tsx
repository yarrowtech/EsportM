import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  acceptMyAssignment,
  createClub,
  getMyPendingAssignments,
} from "../../../api/admin.api";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  adminCardBorder,
  adminGlassShadow,
} from "../../admin/admin-ui";

const cardBorder = adminCardBorder;
const cardBg =
  "linear-gradient(145deg, rgba(255,255,255,.70), rgba(255,255,255,.44) 62%, rgba(var(--primary), .12))";
const glassShadow = adminGlassShadow;

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function membershipsFromMe(me: unknown) {
  if (!me) return [];
  if (Array.isArray((me as any)?.memberships)) {
    return (me as any).memberships;
  }
  if (Array.isArray((me as any)?.user?.memberships)) {
    return (me as any).user.memberships;
  }
  return [];
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [clubSlug, setClubSlug] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const meQuery = useMe();
  const pendingQuery = useQuery({
    queryKey: ["pending-assignments"],
    queryFn: getMyPendingAssignments,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const memberships = useMemo(() => membershipsFromMe(meQuery.data), [meQuery.data]);
  const canCreateClub = !meQuery.isLoading && memberships.length === 0;

  const pending = pendingQuery.data ?? [];
  const loading = pendingQuery.isLoading || meQuery.isLoading;
  const fetchError = pendingQuery.error
    ? messageOf(pendingQuery.error, "Unable to load assignments.")
    : null;
  const displayError = err || fetchError;

  const onAccept = async (invitationId: string) => {
    try {
      setAcceptingId(invitationId);
      const res = await acceptMyAssignment(invitationId);
      const acceptedClubId = res?.membership?.clubId;
      if (acceptedClubId) {
        localStorage.setItem("activeClubId", acceptedClubId);
      }
      await queryClient.invalidateQueries({ queryKey: ["pending-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    } catch (e: unknown) {
      setErr(messageOf(e, "Failed to accept assignment."));
    } finally {
      setAcceptingId(null);
    }
  };

  const onCreateClub = async () => {
    if (!canCreateClub) return;
    if (!clubName.trim()) {
      setErr("Club name is required.");
      return;
    }
    try {
      setErr(null);
      setCreatingClub(true);
      const club = await createClub({
        name: clubName.trim(),
        slug: clubSlug.trim() || undefined,
      });
      if (club?.id) {
        localStorage.setItem("activeClubId", club.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (club?.id) {
        setClubName("");
        setClubSlug("");
      }
      navigate("/admin", { replace: true });
    } catch (e: unknown) {
      setErr(messageOf(e, "Failed to create club."));
    } finally {
      setCreatingClub(false);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: cardBorder, background: "rgba(255,255,255,.60)" }}
        >
          Loading assignments...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="space-y-4">
        <Hero
          title="Account Onboarding"
          subtitle="Accept your club invitation to unlock the full dashboard workspace."
          right={<DotTag>MEMBER</DotTag>}
        />

        {displayError && (
          <div
            className="rounded-2xl border p-4 text-sm font-semibold text-rose-700"
            style={{ borderColor: cardBorder, background: "rgba(255,255,255,.65)", boxShadow: glassShadow }}
          >
            {displayError}
          </div>
        )}

        {!pending.length ? (
          <Section title="Invitations" subtitle="Pending invitations from clubs.">
            <div
              className="rounded-2xl border p-4 text-sm text-[rgb(var(--muted))]"
              style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
            >
              No invitation yet. Please wait for an admin to invite you.
            </div>
          </Section>
        ) : (
          <Section title="Invitations" subtitle="Accept one invitation to activate your workspace.">
            <div className="grid gap-3">
              {pending.map((p) => (
                <div
                  key={p.invitationId}
                  className="rounded-2xl border p-4 backdrop-blur-xl"
                  style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[rgb(var(--text))]">{p.club?.name || p.clubId}</div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Role: {p.primary}
                        {p.subRoles?.length ? ` | Sub roles: ${p.subRoles.join(", ")}` : ""}
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Expires: {new Date(p.expiresAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAccept(p.invitationId)}
                      disabled={acceptingId === p.invitationId}
                      className="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                      style={{
                        background: "rgb(var(--primary))",
                        color: "rgb(var(--primary-2))",
                        border: `1px solid rgb(var(--border) / .14)`,
                      }}
                    >
                      {acceptingId === p.invitationId ? "Accepting..." : "Accept Invitation"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {canCreateClub && (
          <Section title="Create Your Club" subtitle="No memberships found, create your first club workspace.">
            <div
              className="rounded-2xl border p-4 backdrop-blur-xl"
              style={{ borderColor: cardBorder, background: cardBg, boxShadow: glassShadow }}
            >
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={clubName}
                  onChange={(event) => setClubName(event.target.value)}
                  placeholder="Club name"
                  className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: cardBorder }}
                />
                <input
                  value={clubSlug}
                  onChange={(event) => setClubSlug(event.target.value)}
                  placeholder="Slug (optional)"
                  className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                  style={{ borderColor: cardBorder }}
                />
                <button
                  type="button"
                  onClick={onCreateClub}
                  disabled={creatingClub || !clubName.trim()}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                  style={{
                    background: "rgb(var(--primary))",
                    color: "rgb(var(--primary-2))",
                    border: `1px solid rgb(var(--border) / .14)`,
                  }}
                >
                  {creatingClub ? "Creating..." : "Create Club"}
                </button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </PageWrap>
  );
}
