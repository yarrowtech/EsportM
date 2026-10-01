// src/layouts/AdminShell.tsx
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import AdminSidebar, { type AdminSidebarUser } from "../components/ui/admin/AdminSidebar";
import { ThemePanel } from "../theme/ThemePanel";

import {
  getMe,
  getMyClubs,
  getClubPlayers,
  getClubSquads,
  getClubMatches,
  type MeMembership,
  type PrimaryRole,
  type SubRole,
} from "../api/admin.api";
import {
  hasRolePermission,
  listRolePermissions,
  type RolePermission,
} from "../utils/rolePolicy";

type NavKey =
  | "overview"
  | "members"
  | "squads"
  | "matches"
  | "operations"
  | "messages"
  | "analytics"
  | "settings";
type ClubItem = { id: string; name: string; slug: string };
type ScopedMembership = {
  clubId: string;
  primary: PrimaryRole;
  subRoles: SubRole[];
};

const adminTopNav: { key: NavKey; label: string; to: string; permission: RolePermission }[] = [
  { key: "overview", label: "Overview", to: "/admin", permission: "clubs.read" },
  { key: "members", label: "Members", to: "/admin/members", permission: "members.read" },
  { key: "squads", label: "Squads", to: "/admin/squads", permission: "squads.read" },
  { key: "matches", label: "Schedule", to: "/admin/matches", permission: "matches.read" },
  { key: "operations", label: "Operations", to: "/admin/operations", permission: "operations.read" },
  { key: "messages", label: "Messages", to: "/dashboard/messages", permission: "membership.self.read" },
  { key: "analytics", label: "Analytics", to: "/admin/analytics", permission: "stats.read" },
  { key: "settings", label: "Settings", to: "/admin/settings", permission: "membership.self.read" },
];

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

const GLASS_BORDER = "rgb(var(--border) / .1)";
const GLASS_BORDER_STRONG = "rgb(var(--border) / .14)";
const GLASS_SHADOW = "var(--neu-raised)";
const GLASS_BG = "rgb(var(--bg))";
const LOGO_DARK_SRC = "/logo/logo-dark.png";

function GlassBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ background: "rgb(var(--bg))" }}
    />
  );
}

const FALLBACK_ADMIN_USER: AdminSidebarUser = {
  fullName: "Admin",
  userId: "—",
  role: "MEMBER",
  subRoles: [],
  clubName: "—",
  clubId: "",
};

function getStoredToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

function isAuthError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

function hardLogout(navigate: ReturnType<typeof useNavigate>) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token"); // legacy
  localStorage.removeItem("user");
  localStorage.removeItem("activeClubId");
  navigate("/login", { replace: true });
}

function normalizeMemberships(me: any): ScopedMembership[] {
  if (Array.isArray(me?.memberships)) {
    return me.memberships
      .filter((row: MeMembership) => !!row?.clubId)
      .map((row: MeMembership) => ({
        clubId: row.clubId,
        primary: row.primary,
        subRoles: Array.isArray(row.subRoles) ? row.subRoles : [],
      }));
  }

  const legacy = Array.isArray(me?.user?.memberships) ? me.user.memberships : [];
  return legacy
    .map((row: any) => ({
      clubId: row?.club?.id,
      primary: row?.primary as PrimaryRole,
      subRoles: (Array.isArray(row?.subRoles) ? row.subRoles : []) as SubRole[],
    }))
    .filter((row: ScopedMembership) => !!row.clubId);
}

export default function AdminShell() {
  const navigate = useNavigate();
  const loc = useLocation();

  const [themeOpen, setThemeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState<AdminSidebarUser>(FALLBACK_ADMIN_USER);
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [memberships, setMemberships] = useState<ScopedMembership[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const [clubStats, setClubStats] = useState({
    players: 0,
    squads: 0,
    matches: 0,
  });

  const activeNavKey: NavKey = useMemo(() => {
    const p = loc.pathname;
    if (p.startsWith("/admin/members")) return "members";
    if (p.startsWith("/admin/squads")) return "squads";
    if (p.startsWith("/admin/matches")) return "matches";
    if (p.startsWith("/admin/operations")) return "operations";
    if (p.startsWith("/admin/analytics")) return "analytics";
    if (p.startsWith("/admin/settings")) return "settings";
    return "overview";
  }, [loc.pathname]);

  const resolvedMembership = useMemo(() => {
    if (!memberships.length) return null;
    return memberships.find((row) => row.clubId === clubId) || memberships[0] || null;
  }, [memberships, clubId]);

  const permissions = useMemo<RolePermission[]>(() => {
    const primary = resolvedMembership?.primary || user.role || "MEMBER";
    const subRoles = resolvedMembership?.subRoles || user.subRoles || [];
    return listRolePermissions(primary, subRoles);
  }, [resolvedMembership?.primary, resolvedMembership?.subRoles, user.role, user.subRoles]);

  const adminNav = useMemo(() => {
    return adminTopNav.filter((item) => permissions.includes(item.permission));
  }, [permissions]);

  useEffect(() => {
    if (adminNav.some((item) => item.key === activeNavKey)) return;
    const fallback = adminNav[0]?.to;
    if (fallback) {
      navigate(fallback, { replace: true });
      return;
    }
    navigate("/dashboard", { replace: true });
  }, [activeNavKey, adminNav, navigate]);

  // ✅ Boot: ensure token exists, load me + clubs, set activeClubId
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setLoading(true);

        const token = getStoredToken();
        if (!token) {
          hardLogout(navigate);
          return;
        }

        const me = await getMe();
        const scopedMemberships = normalizeMemberships(me);
        setIsPlatformAdmin(!!me?.isPlatformAdmin);

        const myClubs = (await getMyClubs()) || [];
        const storedClubId = localStorage.getItem("activeClubId") || "";
        const firstClub =
          storedClubId ||
          me?.activeClubId ||
          myClubs?.[0]?.id ||
          scopedMemberships?.[0]?.clubId ||
          "";

        // sync active club
        if (firstClub) localStorage.setItem("activeClubId", firstClub);

        if (!alive) return;

        setClubs(myClubs);
        setClubId(firstClub);
        setMemberships(scopedMemberships);

        const activeMembership =
          scopedMemberships.find((row) => row.clubId === firstClub) ||
          scopedMemberships[0] ||
          null;
        const role = activeMembership?.primary || "MEMBER";
        const subRoles = activeMembership?.subRoles || [];

        const clubName =
          myClubs.find((c) => c.id === firstClub)?.name ||
          me?.user?.memberships?.[0]?.club?.name ||
          "—";

        setUser({
          fullName: me?.user?.fullName || me?.user?.email || "Admin",
          userId: me?.user?.id || "—",
          role,
          subRoles,
          clubName,
          clubId: firstClub,
        });

        localStorage.setItem("user", JSON.stringify(me?.user ?? {}));
      } catch (error) {
        if (!alive) return;
        if (isAuthError(error)) {
          hardLogout(navigate);
          return;
        }
        console.error("Admin boot failed (non-auth):", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    boot();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // ✅ Keep localStorage activeClubId in sync when switching clubs
  useEffect(() => {
    if (clubId) localStorage.setItem("activeClubId", clubId);
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    const scoped = memberships.find((row) => row.clubId === clubId);
    if (!scoped) return;
    setUser((prev) => ({
      ...prev,
      role: scoped.primary,
      subRoles: scoped.subRoles || [],
    }));
  }, [clubId, memberships]);

  // ✅ Load club stats when clubId changes
  useEffect(() => {
    let alive = true;

    async function loadStats() {
      if (!clubId) return;

      try {
        const [p, s, m] = await Promise.all([
          getClubPlayers(clubId),
          getClubSquads(clubId),
          getClubMatches(clubId),
        ]);

        if (!alive) return;

        setClubStats({
          players: Array.isArray(p) ? p.length : 0,
          squads: Array.isArray(s) ? s.length : 0,
          matches: Array.isArray(m) ? m.length : 0,
        });

        const clubName = clubs.find((c) => c.id === clubId)?.name || user.clubName;
        const scoped = memberships.find((row) => row.clubId === clubId);
        setUser((prev) => ({
          ...prev,
          role: scoped?.primary || prev.role,
          subRoles: scoped?.subRoles || prev.subRoles || [],
          clubId,
          clubName,
        }));
      } catch {
        // keep silent (no logout on stats failure)
      }
    }

    loadStats();
    return () => {
      alive = false;
    };
  }, [clubId, clubs, memberships, user.clubName]);

  const HEADER_H = 68;

  const onClubCreated = (club: ClubItem) => {
    // Provisioning may target another owner; refresh memberships and switch only when allowed.
    void (async () => {
      try {
        const [me, myClubs] = await Promise.all([getMe(), getMyClubs()]);
        const scopedMemberships = normalizeMemberships(me);
        setClubs(myClubs || []);
        setMemberships(scopedMemberships);

        const hasMembership = scopedMemberships.some((row) => row.clubId === club.id);
        if (hasMembership) {
          setClubId(club.id);
          localStorage.setItem("activeClubId", club.id);
        }
      } catch {
        // ignore create-club follow-up refresh failures
      }
    })();
  };

  return (
    <div className="dashboard-readable min-h-screen w-full bg-[rgb(var(--bg))]">
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

      <div className="relative">
        <GlassBackdrop />

        <div className="mx-auto max-w-[1440px] md:px-4 md:py-4 lg:px-8 lg:py-8">
          <div
            className={cx(
              "app-canvas relative bg-[rgb(var(--bg))] md:rounded-[18px] lg:rounded-[24px]"
            )}
            style={{
              background: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              boxShadow: GLASS_SHADOW,
            }}
          >
            <div className="relative z-10 flex h-[100dvh] min-h-0 flex-col md:h-[calc(100dvh-2rem)] lg:h-[calc(100vh-4rem)]">
              {/* HEADER */}
              <header
                className="app-canvas-header sticky top-0 z-20 shrink-0 md:rounded-t-[18px] lg:rounded-t-[24px]"
                style={{
                  minHeight: HEADER_H,
                  background: "rgb(var(--bg))",
                  borderBottom: `1px solid ${GLASS_BORDER}`,
                  boxShadow: "var(--neu-raised-sm)",
                }}
              >
                <div className="px-2 py-2 sm:px-3 lg:px-5">
                  <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70 lg:hidden"
                        style={{
                          background: "rgb(var(--bg))",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Menu
                      </button>

                      <div
                        className="flex h-10 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
                        style={{
                          background: "rgb(var(--bg))",
                          boxShadow: "var(--neu-raised-sm)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        <img
                          src={LOGO_DARK_SRC}
                          alt="EsportM"
                          className="h-7 w-auto max-w-[132px] object-contain"
                        />
                        <span className="text-xs font-extrabold text-[rgb(var(--muted))]">Admin</span>
                      </div>

                      {/* top pills */}
                      <nav
                        className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full p-1 sm:flex"
                        style={{
                          background: "rgb(var(--bg))",
                          border: `1px solid ${GLASS_BORDER}`,
                          boxShadow: "var(--neu-inset)",
                        }}
                      >
                        {adminNav.map((item) => {
                          const on = item.key === activeNavKey;
                          return (
                            <button
                              key={item.key}
                              onClick={() => navigate(item.to)}
                              className="shrink-0 rounded-full px-2.5 py-2 text-xs font-semibold transition xl:px-3"
                              style={{
                                background: on ? "rgb(var(--primary))" : "transparent",
                                color: on ? "rgb(var(--primary-2))" : "rgb(var(--text))",
                                border: on
                                  ? `1px solid ${GLASS_BORDER_STRONG}`
                                  : "1px solid transparent",
                                boxShadow: on ? "0 10px 24px rgba(var(--primary), .32)" : undefined,
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="flex min-w-0 shrink-0 items-center gap-2">
                      <div className="hidden max-w-[190px] text-right xl:block">
                        <p className="truncate text-xs font-semibold text-[rgb(var(--text))]">
                          {loading ? "Loading…" : `${user.clubName} • ${user.role}`}
                        </p>
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                          Players {clubStats.players} • Squads {clubStats.squads} • Matches{" "}
                          {clubStats.matches}
                        </p>
                      </div>

                      {/* Club switch */}
                      <select
                        value={clubId}
                        onChange={(e) => setClubId(e.target.value)}
                        className="hidden max-w-[160px] rounded-full border bg-white/70 px-3 py-2 text-xs font-semibold outline-none sm:block"
                        style={{ borderColor: GLASS_BORDER }}
                        title="Select club"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {isPlatformAdmin && (
                        <button
                          onClick={() => navigate("/platform")}
                          className="hidden rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70 sm:inline-flex"
                          style={{
                            background: "rgb(var(--bg))",
                            color: "rgb(var(--text))",
                            border: `1px solid ${GLASS_BORDER}`,
                          }}
                        >
                          Platform
                        </button>
                      )}

                      <button
                        onClick={() => setThemeOpen(true)}
                        className="rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                        style={{
                          background: "rgb(var(--bg))",
                          color: "rgb(var(--text))",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Theme
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* BODY */}
              <div className="flex min-h-0 flex-1 lg:gap-4 lg:px-4 lg:py-4">
                {/* Desktop sidebar */}
                <div className="hidden shrink-0 p-2 lg:block" style={{ width: 232 }}>
                  <div className="sticky top-[96px]">
                    <AdminSidebar
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      user={user}
                      navItems={adminNav}
                      canManageClubData={hasRolePermission(user.role, user.subRoles || [], "clubs.read")}
                      clubId={clubId}
                      clubs={clubs}
                      onChangeClub={setClubId}
                      stats={clubStats}
                    />
                  </div>
                </div>

                {/* Mobile drawer */}
                <div className="lg:hidden">
                  <AdminSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={user}
                    navItems={adminNav}
                    canManageClubData={hasRolePermission(user.role, user.subRoles || [], "clubs.read")}
                    clubId={clubId}
                    clubs={clubs}
                    onChangeClub={setClubId}
                    stats={clubStats}
                  />
                </div>

                <main className="dashboard-scroll min-w-0 flex-1 overflow-y-auto">
                  <Outlet
                    context={{
                      clubId,
                      user,
                      clubs,
                      role: user.role,
                      subRoles: user.subRoles || [],
                      permissions,
                      canManageClubData: hasRolePermission(user.role, user.subRoles || [], "clubs.read"),
                      isPlatformAdmin,
                      onClubCreated,
                    }}
                  />
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

