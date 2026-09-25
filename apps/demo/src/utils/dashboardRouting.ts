import type { PrimaryRole, SubRole } from "../api/admin.api";
import { MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST } from "./rolePolicy";

export type DashboardRole = PrimaryRole | SubRole;

type MembershipLike = {
  clubId?: string | null;
  primary?: string | null;
  subRoles?: string[] | null;
};

const SUBROLE_PRIORITY: SubRole[] = [
  "COACH",
  "PHYSIO",
  "AGENT",
  "NUTRITIONIST",
  "PITCH_MANAGER",
];

const PRIMARY_PRIORITY: PrimaryRole[] = ["ADMIN", "MANAGER", "PLAYER", "MEMBER"];

const DASHBOARD_ROLE_TO_PATH: Record<DashboardRole, string> = {
  ADMIN: "/dashboard/admin",
  MANAGER: "/dashboard/manager",
  PLAYER: "/dashboard/player",
  MEMBER: "/dashboard/onboarding",
  COACH: "/dashboard/coach",
  PHYSIO: "/dashboard/physio",
  AGENT: "/dashboard/agent",
  NUTRITIONIST: "/dashboard/nutrition",
  PITCH_MANAGER: "/dashboard/pitch",
  CAPTAIN: "/dashboard/player",
};

function normalizePrimaryRole(value: unknown): PrimaryRole {
  const role = String(value || "").toUpperCase();
  if (PRIMARY_PRIORITY.includes(role as PrimaryRole)) {
    return role as PrimaryRole;
  }
  return "PLAYER";
}

function normalizeSubRoles(input: unknown): SubRole[] {
  if (!Array.isArray(input)) return [];
  const picked: SubRole[] = [];
  for (const role of SUBROLE_PRIORITY) {
    if (input.includes(role)) picked.push(role);
  }
  return picked;
}

function pickMembership(meData: any): MembershipLike | null {
  const memberships = meData?.memberships ?? meData?.user?.memberships ?? [];
  const activeClubId = meData?.activeClubId;
  return (
    meData?.activeMembership ??
    memberships.find((membership: any) => membership?.clubId === activeClubId) ??
    memberships[0] ??
    null
  );
}

function dedupeRoles(roles: DashboardRole[]) {
  return Array.from(new Set(roles));
}

export function formatDashboardRole(role: DashboardRole): string {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDashboardRoleAccess(meData: any): {
  primaryRole: PrimaryRole;
  availableRoles: DashboardRole[];
  canUseMultiRole: boolean;
} {
  const membership = pickMembership(meData);
  if (!membership) {
    return {
      primaryRole: "MEMBER",
      availableRoles: ["MEMBER"],
      canUseMultiRole: false,
    };
  }

  const primary = normalizePrimaryRole(membership?.primary);
  const subRoles = normalizeSubRoles(membership?.subRoles);
  const multiroleAuthorized = MULTI_ROLE_SWITCH_PRIMARY_ALLOWLIST.includes(primary);

  if (primary === "MEMBER") {
    const available: DashboardRole[] = subRoles.length > 0 ? [...subRoles] : ["MEMBER"];
    return {
      primaryRole: primary,
      availableRoles: multiroleAuthorized ? dedupeRoles(available) : [available[0]],
      canUseMultiRole: multiroleAuthorized && available.length > 1,
    };
  }

  const available = dedupeRoles(subRoles.length > 0 ? [primary, ...subRoles] : [primary]);
  return {
    primaryRole: primary,
    availableRoles: multiroleAuthorized ? available : [primary],
    canUseMultiRole: multiroleAuthorized && available.length > 1,
  };
}

export function listAvailableDashboardRoles(meData: any): DashboardRole[] {
  return getDashboardRoleAccess(meData).availableRoles;
}

function normalizeDashboardRole(value: unknown): DashboardRole | null {
  const role = String(value || "").toUpperCase();
  if (SUBROLE_PRIORITY.includes(role as SubRole)) return role as SubRole;
  if (PRIMARY_PRIORITY.includes(role as PrimaryRole)) return role as PrimaryRole;
  return null;
}

export function pathForDashboardRole(role: DashboardRole): string {
  return DASHBOARD_ROLE_TO_PATH[role] || "/dashboard";
}

export function resolveDashboardLanding(
  meData: any,
  preferredRole?: string | null
): { dashboardRole: DashboardRole; path: string } {
  const membership = pickMembership(meData);
  const isPlatformAdmin = !!meData?.isPlatformAdmin;
  if (!membership && isPlatformAdmin) {
    return { dashboardRole: "MEMBER", path: "/platform" };
  }

  const access = getDashboardRoleAccess(meData);
  const available = access.availableRoles;
  const preferred = normalizeDashboardRole(preferredRole);
  const dashboardRole =
    (preferred && available.includes(preferred) ? preferred : available[0]) || "MEMBER";
  return { dashboardRole, path: pathForDashboardRole(dashboardRole) };
}
