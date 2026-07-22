import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  assignSignupToClub,
  getClubMembers,
  getPendingSignups,
  removeClubMember,
  updateClubMemberRole,
  type ClubMember,
  type PendingSignup,
  type PendingSignupsScope,
  type PrimaryRole,
  type SubRole,
} from "../../api/admin.api";
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
import {
  MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST,
  listRolePermissions,
  type RolePermission,
} from "../../utils/rolePolicy";

type Ctx = {
  clubId: string;
  role?: PrimaryRole;
  subRoles?: SubRole[];
  permissions?: RolePermission[];
};

const ALL_PRIMARY: PrimaryRole[] = ["MEMBER", "PLAYER", "MANAGER", "ADMIN"];
const ALL_SUB: SubRole[] = ["COACH", "PHYSIO", "AGENT", "NUTRITIONIST", "PITCH_MANAGER", "CAPTAIN"];
const CAPTAIN_SUB_ROLE: SubRole = "CAPTAIN";
const GLOBAL_SIGNUP_QUERY_MIN = 2;

function canUseSubRole(primary: PrimaryRole, subRole: SubRole) {
  if (subRole === CAPTAIN_SUB_ROLE) return primary === "PLAYER";
  return true;
}

function sanitizeSubRolesForPrimary(primary: PrimaryRole, subRoles: SubRole[]) {
  return (subRoles || []).filter((role) => canUseSubRole(primary, role));
}

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

export default function AdminMembers() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const effectivePermissions =
    ctx.permissions && ctx.permissions.length
      ? ctx.permissions
      : listRolePermissions(ctx.role || "MEMBER", ctx.subRoles || []);
  const permissionSet = new Set<RolePermission>(effectivePermissions);
  const canReadMembers = permissionSet.has("members.read");
  const canAssignSignup = permissionSet.has("members.assign.signup");
  const canEditPrimary = permissionSet.has("members.update.primary");
  const canEditSubRoles = permissionSet.has("members.update.subroles");
  const canRemove = permissionSet.has("members.remove");
  const canEditAny = canEditPrimary || canEditSubRoles || canRemove;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignPrimaryByUserId, setAssignPrimaryByUserId] = useState<Record<string, PrimaryRole>>({});
  const [assignSubRolesByUserId, setAssignSubRolesByUserId] = useState<Record<string, SubRole[]>>({});
  const [query, setQuery] = useState("");
  const [signupScope, setSignupScope] = useState<PendingSignupsScope>("CLUB");
  const [signupSearchInput, setSignupSearchInput] = useState("");
  const [signupSearch, setSignupSearch] = useState("");
  const [signupPage, setSignupPage] = useState(1);
  const [signupPageSize, setSignupPageSize] = useState(25);
  const [signupTotal, setSignupTotal] = useState(0);
  const [signupTotalPages, setSignupTotalPages] = useState(0);
  const [signupHasNext, setSignupHasNext] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) {
      setErr("No club selected. Please choose a club from the header.");
      setLoading(false);
      return;
    }

    const effectiveSignupQuery = signupSearch.trim();
    const canRunGlobalLookup =
      signupScope === "CLUB" || effectiveSignupQuery.length >= GLOBAL_SIGNUP_QUERY_MIN;
    const emptySignupResult = {
      users: [] as PendingSignup[],
      pagination: {
        page: signupPage,
        pageSize: signupPageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        scope: signupScope,
        q: effectiveSignupQuery,
      },
    };

    setLoading(true);
    setErr(null);
    try {
      const [memberRows, signupRows] = await Promise.all([
        canReadMembers ? getClubMembers(clubId) : Promise.resolve([]),
        canAssignSignup
          ? canRunGlobalLookup
            ? getPendingSignups(clubId, {
                scope: signupScope,
                q: effectiveSignupQuery || undefined,
                page: signupPage,
                pageSize: signupPageSize,
              })
            : Promise.resolve(emptySignupResult)
          : Promise.resolve(emptySignupResult),
      ]);
      setMembers(memberRows || []);
      setPendingSignups(signupRows?.users || []);
      setSignupTotal(Number(signupRows?.pagination?.total || 0));
      setSignupTotalPages(Number(signupRows?.pagination?.totalPages || 0));
      setSignupHasNext(Boolean(signupRows?.pagination?.hasNext));
      if (
        signupPage > 1 &&
        Number(signupRows?.pagination?.totalPages || 0) > 0 &&
        signupPage > Number(signupRows?.pagination?.totalPages || 0)
      ) {
        setSignupPage(Number(signupRows?.pagination?.totalPages || 1));
      }
    } catch (e: unknown) {
      setErr(messageOf(e, "Failed to load member data."));
    } finally {
      setLoading(false);
    }
  }, [
    canAssignSignup,
    canReadMembers,
    clubId,
    signupPage,
    signupPageSize,
    signupScope,
    signupSearch,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const admins = members.filter((member) => member.primary === "ADMIN").length;
    const managers = members.filter((member) => member.primary === "MANAGER").length;
    const membersOnly = members.filter((member) => member.primary === "MEMBER").length;
    const players = members.filter((member) => member.primary === "PLAYER").length;
    const captains = members.filter((member) => member.subRoles.includes("CAPTAIN")).length;
    const coaches = members.filter((member) => member.subRoles.includes("COACH")).length;
    const physios = members.filter((member) => member.subRoles.includes("PHYSIO")).length;
    return {
      total: members.length,
      admins,
      managers,
      membersOnly,
      players,
      captains,
      coaches,
      physios,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      const name = member.user.fullName || "";
      return (
        name.toLowerCase().includes(q) ||
        member.user.email.toLowerCase().includes(q) ||
        member.userId.toLowerCase().includes(q)
      );
    });
  }, [members, query]);

  const roleForSignup = (signup: PendingSignup): PrimaryRole =>
    assignPrimaryByUserId[signup.id] ?? signup.pendingAssignment?.primary ?? "MEMBER";

  const subRolesForSignup = (signup: PendingSignup): SubRole[] =>
    assignSubRolesByUserId[signup.id] ?? signup.pendingAssignment?.subRoles ?? [];

  const toggleSignupSubRole = (
    signupId: string,
    role: SubRole,
    fallback: SubRole[],
    primary: PrimaryRole
  ) => {
    if (!canUseSubRole(primary, role)) return;
    setAssignSubRolesByUserId((prev) => {
      const current = prev[signupId] ?? fallback;
      const next = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role];
      return { ...prev, [signupId]: sanitizeSubRolesForPrimary(primary, next) };
    });
  };

  const onAssignSignup = async (signup: PendingSignup) => {
    if (!canAssignSignup) {
      setToast({ type: "err", msg: "You do not have permission to invite signups." });
      return;
    }

    try {
      setAssigningId(signup.id);
      await assignSignupToClub(clubId, {
        userId: signup.id,
        primary: roleForSignup(signup),
        subRoles: sanitizeSubRolesForPrimary(roleForSignup(signup), subRolesForSignup(signup)),
      });
      setToast({
        type: "ok",
        msg: `Invitation sent for user ID ${signup.id}. Member can now accept from onboarding.`,
      });
      await load();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to send invitation.") });
    } finally {
      setAssigningId(null);
    }
  };

  const applySignupSearch = () => {
    setSignupPage(1);
    setSignupSearch(signupSearchInput.trim());
  };

  const clearSignupSearch = () => {
    setSignupSearchInput("");
    setSignupSearch("");
    setSignupPage(1);
  };

  const onSave = async (userId: string, primary: PrimaryRole, subRoles: SubRole[]) => {
    if (!canEditAny) {
      setToast({ type: "err", msg: "You do not have permission to change member roles." });
      return;
    }

    try {
      setSavingId(userId);
      const payload: { primary?: PrimaryRole; subRoles?: SubRole[] } = {};
      if (canEditPrimary) payload.primary = primary;
      if (canEditSubRoles) payload.subRoles = subRoles;
      if (!Object.keys(payload).length) {
        setToast({ type: "err", msg: "No editable role fields for your access level." });
        return;
      }
      await updateClubMemberRole(clubId, userId, payload);
      setToast({ type: "ok", msg: "Member role updated." });
      await load();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to update member role.") });
    } finally {
      setSavingId(null);
    }
  };

  const onRemove = async (userId: string) => {
    if (!canRemove) {
      setToast({ type: "err", msg: "You do not have permission to remove members." });
      return;
    }

    const proceed = confirm("Remove this member from the club?");
    if (!proceed) return;

    try {
      setRemovingId(userId);
      await removeClubMember(clubId, userId);
      setToast({ type: "ok", msg: "Member removed." });
      await load();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to remove member.") });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading members...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Member Command"
        subtitle="Review club members, send signup invitations by user ID, and maintain role structure."
        right={<DotTag tone={canEditAny ? "warn" : "default"}>{canEditAny ? "EDIT ENABLED" : "READ ONLY"}</DotTag>}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Stat label="Members" value={counts.total} />
        <Stat label="Players" value={counts.players} />
        <Stat label="Captains" value={counts.captains} />
        <Stat label="Role: MEMBER" value={counts.membersOnly} />
        <Stat label="Managers" value={counts.managers} />
        <Stat label="Admins" value={counts.admins} />
        <Stat label="Coaches" value={counts.coaches} />
        <Stat label="Physios" value={counts.physios} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Signup Intake Queue"
          subtitle="Send invitation with role selection. Member must accept in onboarding."
          className="xl:col-span-8"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <DotTag tone={pendingSignups.length > 0 ? "warn" : "ok"}>{signupTotal}</DotTag>
              <select
                value={signupScope}
                onChange={(event) => {
                  const nextScope = event.target.value as PendingSignupsScope;
                  setSignupScope(nextScope);
                  setSignupPage(1);
                  if (nextScope === "CLUB") {
                    setSignupSearch("");
                    setSignupSearchInput("");
                  }
                }}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="CLUB">Club Queue</option>
                <option value="GLOBAL">Global Lookup</option>
              </select>
              <input
                value={signupSearchInput}
                onChange={(event) => setSignupSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySignupSearch();
                }}
                placeholder={signupScope === "GLOBAL" ? "Search name, email, ID" : "Switch to Global Lookup to search"}
                disabled={signupScope !== "GLOBAL"}
                className={cx(
                  "rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none",
                  signupScope !== "GLOBAL" && "cursor-not-allowed opacity-60"
                )}
                style={{ borderColor: adminCardBorder }}
              />
              <button
                type="button"
                onClick={applySignupSearch}
                disabled={signupScope !== "GLOBAL"}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                Search
              </button>
              {signupScope === "GLOBAL" && signupSearch ? (
                <button
                  type="button"
                  onClick={clearSignupSearch}
                  className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: adminCardBorder }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          }
        >
          {signupScope === "GLOBAL" && signupSearch.length < GLOBAL_SIGNUP_QUERY_MIN ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              Enter at least {GLOBAL_SIGNUP_QUERY_MIN} characters to search global signups.
            </p>
          ) : !pendingSignups.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No new signups waiting for assignment.</p>
          ) : (
            <div className="space-y-2">
              {pendingSignups.map((signup) => {
                const assigned = signup.pendingAssignment;
                const selectedSubRoles = subRolesForSignup(signup);
                return (
                  <article
                    key={signup.id}
                    className="grid gap-2 rounded-2xl border bg-white/75 px-3 py-3 md:grid-cols-[1.15fr_.9fr_1.25fr_auto]"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                        {signup.fullName || "Unnamed"}
                      </p>
                      <p className="truncate text-xs text-[rgb(var(--muted))]">{signup.email}</p>
                      <p className="truncate text-xs text-[rgb(var(--muted))]">ID: {signup.id}</p>
                    </div>

                    <div className="text-xs text-[rgb(var(--muted))]">
                      <p>Signed up</p>
                      <p className="font-semibold text-[rgb(var(--text))]">{formatDateTime(signup.createdAt)}</p>
                    </div>

                    <div className="space-y-1">
                      <select
                        value={roleForSignup(signup)}
                        onChange={(event) => {
                          const nextPrimary = event.target.value as PrimaryRole;
                          setAssignPrimaryByUserId((prev) => ({
                            ...prev,
                            [signup.id]: nextPrimary,
                          }));
                          setAssignSubRolesByUserId((prev) => ({
                            ...prev,
                            [signup.id]: sanitizeSubRolesForPrimary(
                              nextPrimary,
                              prev[signup.id] ?? signup.pendingAssignment?.subRoles ?? []
                            ),
                          }));
                        }}
                        disabled={!canAssignSignup || !canEditPrimary}
                        className={cx(
                          "w-full rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold outline-none",
                          (!canAssignSignup || !canEditPrimary) && "cursor-not-allowed opacity-60"
                        )}
                        style={{ borderColor: adminCardBorder }}
                      >
                        {ALL_PRIMARY.map((roleName) => (
                          <option key={roleName} value={roleName}>
                            {roleName}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-1">
                        {ALL_SUB.map((subRole) => {
                          const active = selectedSubRoles.includes(subRole);
                          const roleAllowed = canUseSubRole(roleForSignup(signup), subRole);
                          return (
                            <button
                              key={subRole}
                              type="button"
                              onClick={() =>
                                toggleSignupSubRole(
                                  signup.id,
                                  subRole,
                                  signup.pendingAssignment?.subRoles || [],
                                  roleForSignup(signup)
                                )
                              }
                              disabled={!canAssignSignup || !canEditSubRoles || !roleAllowed}
                              className={cx(
                                "rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition",
                                active ? "bg-[rgba(var(--primary),.24)] text-[rgb(var(--text))]" : "bg-white/70 text-[rgb(var(--muted))]",
                                (!canAssignSignup || !canEditSubRoles || !roleAllowed) && "cursor-not-allowed opacity-60"
                              )}
                              style={{
                                borderColor: active ? "rgb(var(--primary) / .34)" : adminCardBorder,
                              }}
                              title={
                                !roleAllowed
                                  ? "Captain can be assigned only when primary role is PLAYER"
                                  : undefined
                              }
                            >
                              {subRole}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {assigned
                          ? `Invitation pending: ${assigned.primary}${assigned.subRoles?.length ? ` + ${assigned.subRoles.join(", ")}` : ""} till ${formatDateTime(assigned.expiresAt)}`
                          : "No invitation yet"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAssignSignup(signup)}
                      disabled={!canAssignSignup || assigningId === signup.id}
                      className="rounded-xl px-3 py-2 text-xs font-extrabold transition disabled:opacity-60"
                      style={{
                        background: "rgb(var(--primary))",
                        color: "rgb(var(--primary-2))",
                        border: `1px solid ${adminCardBorder}`,
                      }}
                    >
                      {assigningId === signup.id ? "Sending..." : assigned ? "Re-invite" : "Invite"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: adminCardBorder }}>
            <p className="text-xs text-[rgb(var(--muted))]">
              Showing {pendingSignups.length} of {signupTotal}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={signupPageSize}
                onChange={(event) => {
                  setSignupPageSize(Number(event.target.value));
                  setSignupPage(1);
                }}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold outline-none"
                style={{ borderColor: adminCardBorder }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <button
                type="button"
                onClick={() => setSignupPage((prev) => Math.max(1, prev - 1))}
                disabled={signupPage <= 1}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-[rgb(var(--muted))]">
                Page {signupPage} / {Math.max(1, signupTotalPages || 1)}
              </span>
              <button
                type="button"
                onClick={() => setSignupPage((prev) => prev + 1)}
                disabled={!signupHasNext}
                className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                Next
              </button>
            </div>
          </div>
        </Section>

        <Section title="Role Rules" subtitle="Primary role + sub role guardrails." className="xl:col-span-4" dark>
          <div className="space-y-2 text-sm text-white/80">
            <p>
              1. Only <span className="font-bold text-white">ADMIN</span> can change primary roles.
            </p>
            <p>
              2. Keep at least one <span className="font-bold text-white">ADMIN</span> in each club.
            </p>
            <p>
              3. Use sub roles for specialist access (coach, physio, nutrition).
            </p>
            <p>
              4. Captain tag can only be assigned when primary role is{" "}
              <span className="font-bold text-white">PLAYER</span>.
            </p>
            <p>
              5. Prefer assigning pending users from this queue before manual edits.
            </p>
            <p>
              6. Multi-role dashboard switching is allowed only for{" "}
              <span className="font-bold text-white">{MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST.join(" / ")}</span>.
            </p>
          </div>
        </Section>
      </div>

      <Section
        title="Membership Matrix"
        subtitle="Search and manage members in the active club."
        right={
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, ID"
              className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <button
              type="button"
              onClick={load}
              className="rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold"
              style={{ borderColor: adminCardBorder }}
            >
              Refresh
            </button>
          </div>
        }
      >
        {!filteredMembers.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No members found for this filter.</p>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                canEditPrimary={canEditPrimary}
                canEditSubRoles={canEditSubRoles}
                canRemove={canRemove}
                saving={savingId === member.userId}
                removing={removingId === member.userId}
                onSave={onSave}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

function MemberCard({
  member,
  canEditPrimary,
  canEditSubRoles,
  canRemove,
  saving,
  removing,
  onSave,
  onRemove,
}: {
  member: ClubMember;
  canEditPrimary: boolean;
  canEditSubRoles: boolean;
  canRemove: boolean;
  saving: boolean;
  removing: boolean;
  onSave: (userId: string, primary: PrimaryRole, subRoles: SubRole[]) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [primary, setPrimary] = useState<PrimaryRole>(member.primary);
  const [subRoles, setSubRoles] = useState<SubRole[]>(
    sanitizeSubRolesForPrimary(member.primary, member.subRoles || [])
  );

  const primaryDirty = primary !== member.primary;
  const subRolesDirty =
    JSON.stringify(subRoles.slice().sort()) !== JSON.stringify((member.subRoles || []).slice().sort());
  const dirty = (canEditPrimary && primaryDirty) || (canEditSubRoles && subRolesDirty);

  const toggleSubRole = (subRole: SubRole) => {
    if (!canEditSubRoles) return;
    if (!canUseSubRole(primary, subRole)) return;
    setSubRoles((prev) => {
      const next = prev.includes(subRole)
        ? prev.filter((item) => item !== subRole)
        : [...prev, subRole];
      return sanitizeSubRolesForPrimary(primary, next);
    });
  };

  return (
    <article className="rounded-2xl border bg-white/76 p-3" style={{ borderColor: adminCardBorder }}>
      <div className="grid gap-3 xl:grid-cols-[1.1fr_.9fr_1.5fr_auto]">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">{member.user.fullName || "Unnamed"}</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">{member.user.email}</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">ID: {member.userId}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {subRoles.includes("CAPTAIN") ? <DotTag tone="warn">CAPTAIN</DotTag> : null}
          </div>
        </div>

        <div>
          <select
            value={primary}
            onChange={(event) => {
              const nextPrimary = event.target.value as PrimaryRole;
              setPrimary(nextPrimary);
              setSubRoles((prev) => sanitizeSubRolesForPrimary(nextPrimary, prev));
            }}
            disabled={!canEditPrimary}
            className={cx(
              "w-full rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold outline-none",
              !canEditPrimary && "cursor-not-allowed opacity-60"
            )}
            style={{ borderColor: adminCardBorder }}
          >
            {ALL_PRIMARY.map((roleName) => (
              <option key={roleName} value={roleName}>
                {roleName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
            {ALL_SUB.map((subRole) => {
              const active = subRoles.includes(subRole);
              const roleAllowed = canUseSubRole(primary, subRole);
              return (
                <button
                  key={subRole}
                  type="button"
                  onClick={() => toggleSubRole(subRole)}
                  disabled={!canEditSubRoles || !roleAllowed}
                  className={cx(
                    "rounded-full border px-3 py-1 text-[11px] font-extrabold transition",
                    active ? "bg-[rgba(var(--primary),.24)] text-[rgb(var(--text))]" : "bg-white/70 text-[rgb(var(--muted))]",
                    (!canEditSubRoles || !roleAllowed) && "cursor-not-allowed opacity-60"
                  )}
                  style={{
                    borderColor: active ? "rgb(var(--primary) / .34)" : adminCardBorder,
                  }}
                  title={
                    !roleAllowed
                      ? "Captain can be assigned only when primary role is PLAYER"
                      : undefined
                  }
                >
                  {subRole}
                </button>
              );
            })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onSave(member.userId, primary, sanitizeSubRolesForPrimary(primary, subRoles))
            }
            disabled={!(canEditPrimary || canEditSubRoles) || !dirty || saving}
            className="rounded-full px-3 py-2 text-xs font-extrabold transition disabled:opacity-60"
            style={{
              background: "rgb(var(--primary))",
              color: "rgb(var(--primary-2))",
              border: `1px solid ${adminCardBorder}`,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(member.userId)}
            disabled={!canRemove || removing}
            className="rounded-full border bg-white/85 px-3 py-2 text-xs font-extrabold text-rose-700 transition disabled:opacity-60"
            style={{ borderColor: adminCardBorder }}
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}

