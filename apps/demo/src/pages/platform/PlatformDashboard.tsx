import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createClub,
  getPlatformClubs,
  getPlatformOverview,
  getPlatformRoleMatrix,
  getPlatformUsers,
  updatePlatformClub,
  updatePlatformRoleSetting,
  updatePlatformUserAdmin,
  type PlatformClub,
  type PlatformOverview,
  type PlatformRoleSetting,
  type PlatformUser,
} from "../../api/admin.api";

const BILLING_PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;
const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED"] as const;

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export default function PlatformDashboard() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [clubs, setClubs] = useState<PlatformClub[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [roleMatrix, setRoleMatrix] = useState<PlatformRoleSetting[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubBusyKey, setClubBusyKey] = useState<string | null>(null);
  const [roleBusyKey, setRoleBusyKey] = useState<string | null>(null);
  const [userBusyId, setUserBusyId] = useState<string | null>(null);

  const [newClubName, setNewClubName] = useState("");
  const [newClubSlug, setNewClubSlug] = useState("");
  const [newClubOwnerEmail, setNewClubOwnerEmail] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] = useState("TRIAL");
  const [billingPlan, setBillingPlan] = useState("FREE");
  const [monthlyPrice, setMonthlyPrice] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [nextBillingDate, setNextBillingDate] = useState("");

  const loadData = useCallback(async (showSpinner = true) => {
    try {
      setError(null);
      if (showSpinner) setLoading(true);
      if (!showSpinner) setRefreshing(true);

      const [overviewData, clubsData, usersData] = await Promise.all([
        getPlatformOverview(),
        getPlatformClubs(),
        getPlatformUsers(),
      ]);

      setOverview(overviewData);
      setClubs(clubsData);
      setUsers(usersData);
      setSelectedClubId((prev) => {
        if (prev && clubsData.some((club) => club.id === prev)) return prev;
        return clubsData[0]?.id || "";
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load platform dashboard.");
    } finally {
      if (showSpinner) setLoading(false);
      if (!showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) || null,
    [clubs, selectedClubId]
  );

  useEffect(() => {
    if (!selectedClub) {
      setRoleMatrix([]);
      return;
    }
    setSubscriptionStatus(String(selectedClub.subscriptionStatus || "TRIAL").toUpperCase());
    setBillingPlan(String(selectedClub.billingPlan || "FREE").toUpperCase());
    setMonthlyPrice(String(selectedClub.subscriptionMonthlyPrice || 0));
    setStartDate(toDateInput(selectedClub.subscriptionStartAt));
    setNextBillingDate(toDateInput(selectedClub.subscriptionNextBillingAt));
  }, [selectedClub]);

  useEffect(() => {
    if (!selectedClubId) return;
    let alive = true;
    (async () => {
      try {
        const data = await getPlatformRoleMatrix(selectedClubId);
        if (!alive) return;
        setRoleMatrix(data.roles || []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load role matrix.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedClubId]);

  const membershipPrimaryRows = useMemo(() => {
    const map = overview?.membershipsByPrimary || {};
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [overview?.membershipsByPrimary]);

  const toggleClubFlag = async (
    key: "isActive" | "aiEnabled" | "marketplaceEnabled" | "socialEnabled",
    value: boolean
  ) => {
    if (!selectedClub) return;
    const busyKey = `${selectedClub.id}:${key}`;
    try {
      setClubBusyKey(busyKey);
      const updated = await updatePlatformClub(selectedClub.id, { [key]: value });
      if (!updated) return;
      setClubs((prev) => prev.map((club) => (club.id === updated.id ? updated : club)));
      await loadData(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Club update failed.");
    } finally {
      setClubBusyKey(null);
    }
  };

  const saveSubscription = async () => {
    if (!selectedClub) return;
    try {
      setClubBusyKey(`${selectedClub.id}:subscription`);
      const updated = await updatePlatformClub(selectedClub.id, {
        subscriptionStatus,
        billingPlan,
        subscriptionMonthlyPrice: Number(monthlyPrice || 0),
        subscriptionStartAt: startDate || undefined,
        subscriptionNextBillingAt: nextBillingDate || undefined,
      });
      if (!updated) return;
      setClubs((prev) => prev.map((club) => (club.id === updated.id ? updated : club)));
      await loadData(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Subscription update failed.");
    } finally {
      setClubBusyKey(null);
    }
  };

  const toggleRole = async (role: PlatformRoleSetting) => {
    if (!selectedClub) return;
    const busyKey = `${selectedClub.id}:${role.roleKey}`;
    try {
      setRoleBusyKey(busyKey);
      const updated = await updatePlatformRoleSetting(
        selectedClub.id,
        role.roleKey,
        !role.isEnabled
      );
      setRoleMatrix(updated.roles || []);
      await loadData(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Role toggle failed.");
    } finally {
      setRoleBusyKey(null);
    }
  };

  const togglePlatformAdmin = async (user: PlatformUser, nextValue: boolean) => {
    try {
      setUserBusyId(user.id);
      const updated = await updatePlatformUserAdmin(user.id, nextValue);
      if (!updated) return;
      setUsers((prev) => prev.map((row) => (row.id === user.id ? updated : row)));
      await loadData(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Platform admin update failed.");
    } finally {
      setUserBusyId(null);
    }
  };

  const handleCreateClub = async () => {
    const name = newClubName.trim();
    const slug = newClubSlug.trim();
    const ownerEmail = newClubOwnerEmail.trim();
    if (!name) {
      setError("Club name is required.");
      return;
    }
    if (!ownerEmail) {
      setError("Owner email is required.");
      return;
    }

    try {
      setError(null);
      setCreatingClub(true);
      const created = await createClub({
        name,
        slug: slug.length > 0 ? slug : undefined,
        ownerEmail,
      });
      setNewClubName("");
      setNewClubSlug("");
      setNewClubOwnerEmail("");
      await loadData(false);
      if (created?.id) setSelectedClubId(created.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Club creation failed.");
    } finally {
      setCreatingClub(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border bg-white/60 p-6 text-sm">Loading platform controls...</div>;
  }

  const totals = overview?.totals;
  const isSubscriptionSaving = selectedClub ? clubBusyKey === `${selectedClub.id}:subscription` : false;

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[rgb(var(--text))]">Superadmin Control Center</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Clubs, roles, module matrix, and subscription lifecycle.
            </p>
          </div>
          <button
            onClick={() => void loadData(false)}
            disabled={refreshing}
            className="rounded-full border bg-white/70 px-4 py-2 text-xs font-semibold transition hover:bg-white/90 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-10">
          <StatCard label="Users" value={totals?.users ?? 0} />
          <StatCard label="Memberships" value={totals?.memberships ?? 0} />
          <StatCard label="Clubs" value={totals?.clubs ?? 0} />
          <StatCard label="Active Clubs" value={totals?.activeClubs ?? 0} />
          <StatCard label="Inactive Clubs" value={totals?.inactiveClubs ?? 0} />
          <StatCard label="Active Subs" value={totals?.activeSubscriptions ?? 0} />
          <StatCard label="Trial Subs" value={totals?.trialSubscriptions ?? 0} />
          <StatCard label="Past Due" value={totals?.pastDueSubscriptions ?? 0} />
          <StatCard label="Canceled" value={totals?.canceledSubscriptions ?? 0} />
          <StatCard label="MRR" value={totals?.estimatedMrr ?? 0} prefix="Rs " />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[rgb(var(--text))]">Club Governance</h2>
              <select
                value={selectedClubId}
                onChange={(event) => setSelectedClubId(event.target.value)}
                className="rounded-full border bg-white/75 px-4 py-2 text-xs font-semibold outline-none"
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {!selectedClub ? (
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">No club available.</p>
            ) : (
              <>
                <div className="mt-3 rounded-2xl border bg-white/75 p-4">
                  <p className="text-sm font-semibold">{selectedClub.name}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {selectedClub.slug} • Members {selectedClub.memberCount} • Admins {selectedClub.adminCount}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <ToggleTile
                    title="Club Status"
                    on={selectedClub.isActive}
                    busy={clubBusyKey === `${selectedClub.id}:isActive`}
                    onClick={() => void toggleClubFlag("isActive", !selectedClub.isActive)}
                  />
                  <ToggleTile
                    title="AI Module"
                    on={selectedClub.aiEnabled}
                    busy={clubBusyKey === `${selectedClub.id}:aiEnabled`}
                    onClick={() => void toggleClubFlag("aiEnabled", !selectedClub.aiEnabled)}
                  />
                  <ToggleTile
                    title="Marketplace"
                    on={selectedClub.marketplaceEnabled}
                    busy={clubBusyKey === `${selectedClub.id}:marketplaceEnabled`}
                    onClick={() =>
                      void toggleClubFlag("marketplaceEnabled", !selectedClub.marketplaceEnabled)
                    }
                  />
                  <ToggleTile
                    title="Social"
                    on={selectedClub.socialEnabled}
                    busy={clubBusyKey === `${selectedClub.id}:socialEnabled`}
                    onClick={() => void toggleClubFlag("socialEnabled", !selectedClub.socialEnabled)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <h2 className="text-lg font-black text-[rgb(var(--text))]">Role Matrix Control</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Disable/activate primary roles and subroles per selected club.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {roleMatrix.map((role) => {
                const busyKey = selectedClub ? `${selectedClub.id}:${role.roleKey}` : "";
                return (
                  <button
                    key={role.roleKey}
                    onClick={() => void toggleRole(role)}
                    disabled={roleBusyKey === busyKey || !selectedClub}
                    className={cx(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition disabled:opacity-60",
                      role.isEnabled
                        ? "border-emerald-400/40 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    )}
                  >
                    <span className="font-semibold">
                      {role.roleKey}{" "}
                      <span className="text-xs font-normal text-[rgb(var(--muted))]">
                        ({role.roleType})
                      </span>
                    </span>
                    <span className="text-xs">
                      {roleBusyKey === busyKey ? "Saving..." : role.isEnabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </button>
                );
              })}
              {roleMatrix.length === 0 && (
                <p className="text-sm text-[rgb(var(--muted))]">Select a club to load role matrix.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <h2 className="text-lg font-black text-[rgb(var(--text))]">Create New Club</h2>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <input
              value={newClubName}
              onChange={(event) => setNewClubName(event.target.value)}
              className="w-full rounded-full border bg-white/75 px-4 py-2 text-sm outline-none"
              placeholder="Club name"
            />
            <input
              value={newClubSlug}
              onChange={(event) => setNewClubSlug(event.target.value)}
              className="w-full rounded-full border bg-white/75 px-4 py-2 text-sm outline-none"
              placeholder="Slug (optional)"
            />
            <input
              value={newClubOwnerEmail}
              onChange={(event) => setNewClubOwnerEmail(event.target.value)}
              className="w-full rounded-full border bg-white/75 px-4 py-2 text-sm outline-none"
              placeholder="Owner email (signup user)"
            />
            <button
              onClick={() => void handleCreateClub()}
              disabled={creatingClub || !newClubName.trim() || !newClubOwnerEmail.trim()}
              className="rounded-full border bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {creatingClub ? "Creating..." : "Create Club"}
            </button>
          </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <h2 className="text-lg font-black text-[rgb(var(--text))]">Subscription Manager</h2>
            {!selectedClub ? (
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">Select a club first.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-[rgb(var(--muted))]">Subscription Status</label>
                  <select
                    value={subscriptionStatus}
                    onChange={(event) => setSubscriptionStatus(event.target.value)}
                    className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
                  >
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-[rgb(var(--muted))]">Billing Plan</label>
                  <select
                    value={billingPlan}
                    onChange={(event) => setBillingPlan(event.target.value)}
                    className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
                  >
                    {BILLING_PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-[rgb(var(--muted))]">Monthly Fee (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyPrice}
                    onChange={(event) => setMonthlyPrice(event.target.value)}
                    className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-[rgb(var(--muted))]">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-[rgb(var(--muted))]">Next Billing</label>
                    <input
                      type="date"
                      value={nextBillingDate}
                      onChange={(event) => setNextBillingDate(event.target.value)}
                      className="rounded-xl border bg-white/75 px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => void saveSubscription()}
                  disabled={isSubscriptionSaving}
                  className="w-full rounded-full border bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isSubscriptionSaving ? "Saving..." : "Save Subscription"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <h2 className="text-lg font-black text-[rgb(var(--text))]">Platform Admins</h2>
            <div className="mt-3 space-y-2">
              {users.slice(0, 18).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl border bg-white/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.fullName || user.email}</p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">{user.email}</p>
                  </div>
                  <button
                    onClick={() => void togglePlatformAdmin(user, !user.isPlatformAdmin)}
                    disabled={userBusyId === user.id}
                    className={cx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60",
                      user.isPlatformAdmin
                        ? "border-rose-400/40 bg-rose-50 text-rose-700"
                        : "border-emerald-400/40 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {userBusyId === user.id
                      ? "Saving..."
                      : user.isPlatformAdmin
                        ? "Revoke"
                        : "Grant"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white/65 p-5 backdrop-blur-md">
            <h2 className="text-lg font-black text-[rgb(var(--text))]">Membership Breakdown</h2>
            <div className="mt-3 space-y-2">
              {membershipPrimaryRows.map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-2xl border bg-white/70 px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{role}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/75 px-3 py-3">
      <p className="text-xs font-semibold text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[rgb(var(--text))]">
        {prefix}
        {value}
      </p>
    </div>
  );
}

function ToggleTile({
  title,
  on,
  busy,
  onClick,
}: {
  title: string;
  on: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cx(
        "rounded-2xl border px-4 py-4 text-left transition disabled:opacity-60",
        on ? "border-emerald-400/40 bg-emerald-50" : "border-slate-300 bg-slate-100"
      )}
    >
      <p className="text-xs font-semibold text-[rgb(var(--muted))]">{title}</p>
      <p className="mt-1 text-sm font-black">{busy ? "Saving..." : on ? "ACTIVE" : "DISABLED"}</p>
    </button>
  );
}
