import type { SidebarUser } from "../components/ui/Sidebar";
import type { MeResponse } from "../api/auth.api";

function resolveUser(d: MeResponse) {
  return d.user ?? d;
}

function toRoleLabel(value?: string) {
  const s = String(value || "").trim().toUpperCase();
  if (!s) return "Player";
  if (s === "PLAYER") return "Player";
  if (s === "MANAGER") return "Manager";
  if (s === "ADMIN") return "Admin";
  return s
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickFullName(d: MeResponse) {
  const u = resolveUser(d);
  return u.fullName || u.name || "Player";
}

function pickUserId(d: MeResponse) {
  const u = resolveUser(d);
  return u.userId || u.playerId || u.employeeId || u._id || u.id || "-";
}

function pickClubName(d: MeResponse) {
  const activeClub = d.activeMembership?.club;
  if (typeof activeClub === "string") return activeClub;
  if (typeof activeClub === "object" && activeClub?.name) return activeClub.name;

  const u = resolveUser(d);
  if (typeof u.club === "string") return u.club;
  if (typeof u.club === "object" && u.club?.name) return u.club.name;

  const fromMemberships = d.memberships?.find((m) => m.clubId === d.activeClubId)?.club;
  if (typeof fromMemberships === "string") return fromMemberships;
  if (typeof fromMemberships === "object" && fromMemberships?.name) return fromMemberships.name;

  return u.clubName || "-";
}

function pickRole(d: MeResponse) {
  const role =
    d.activeMembership?.primary ||
    d.memberships?.find((m) => m.clubId === d.activeClubId)?.primary ||
    resolveUser(d).role;
  return toRoleLabel(role);
}

function hasCaptainTag(d: MeResponse) {
  const activeSubRoles =
    d.activeMembership?.subRoles ||
    d.memberships?.find((m) => m.clubId === d.activeClubId)?.subRoles ||
    [];
  return Array.isArray(activeSubRoles) && activeSubRoles.includes("CAPTAIN");
}

export function mapToSidebarUser(d: MeResponse): SidebarUser {
  const u = resolveUser(d);
  return {
    fullName: pickFullName(d),
    userId: pickUserId(d),
    clubName: pickClubName(d),
    role: pickRole(d),
    position: u.position,
    avatarUrl: u.avatarUrl || u.avatar,
    isCaptain: hasCaptainTag(d),
  };
}
