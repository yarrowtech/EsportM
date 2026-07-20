import { http } from "./http";

export type MeResponse = {
  user?: {
    _id?: string;
    id?: string;
    fullName?: string;
    name?: string;
    userId?: string;
    playerId?: string;
    employeeId?: string;
    clubName?: string;
    club?: { name?: string } | string;
    role?: string;
    position?: string;
    avatarUrl?: string;
    avatar?: string;
  };
  memberships?: Array<{
    clubId?: string;
    primary?: string;
    subRoles?: string[];
    club?:
      | {
          name?: string;
          slug?: string;
          billingPlan?: string;
          subscriptionStatus?: string;
        }
      | string;
  }>;
  activeClubId?: string | null;
  activeMembership?: {
    clubId?: string;
    primary?: string;
    subRoles?: string[];
    club?:
      | {
          name?: string;
          slug?: string;
          billingPlan?: string;
          subscriptionStatus?: string;
        }
      | string;
  } | null;

  _id?: string;
  id?: string;

  // common shapes
  fullName?: string;
  name?: string;

  userId?: string;
  playerId?: string;
  employeeId?: string;

  clubName?: string;
  club?: { name?: string } | string;

  role?: string;
  position?: string;

  avatarUrl?: string;
  avatar?: string;
};

export async function me() {
  // ✅ change endpoint if yours differs
  const res = await http.get<MeResponse>("/auth/me");
  return res.data;
}
