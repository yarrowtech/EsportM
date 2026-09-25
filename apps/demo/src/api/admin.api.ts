import { http } from "./http";

export type PrimaryRole = "MEMBER" | "PLAYER" | "ADMIN" | "MANAGER";
export type SubRole =
  | "AGENT"
  | "PHYSIO"
  | "COACH"
  | "NUTRITIONIST"
  | "PITCH_MANAGER"
  | "CAPTAIN";

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
export type LeaderboardMetric = "goals" | "assists" | "minutes";

export type Club = { id: string; name: string; slug: string };
export type ClubTheme = {
  mode?: "light" | "dark";
  primary: string;
  deep: string;
};
export type CreateClubPayload = {
  name: string;
  slug?: string;
  ownerUserId?: string;
  ownerEmail?: string;
};

export type MeUser = {
  id: string;
  email: string;
  fullName?: string | null;
  memberships: Array<{
    id: string;
    primary: PrimaryRole;
    subRoles: string[];
    club: Club;
  }>;
};

export type MeMembership = {
  clubId: string;
  primary: PrimaryRole;
  subRoles: SubRole[];
  club: Club;
};

export type MeResponse = {
  user: MeUser;
  memberships?: MeMembership[];
  activeClubId?: string | null;
  activeMembership?: MeMembership | null;
  isPlatformAdmin?: boolean;
};

export type PlatformOverview = {
  totals: {
    users: number;
    memberships: number;
    clubs: number;
    activeClubs: number;
    inactiveClubs: number;
    platformAdmins: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
    estimatedMrr: number;
  };
  membershipsByPrimary: Record<string, number>;
};

export type PlatformClub = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  aiEnabled: boolean;
  marketplaceEnabled: boolean;
  socialEnabled: boolean;
  billingPlan: "FREE" | "PRO" | "ENTERPRISE" | string;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | string;
  subscriptionMonthlyPrice: number;
  subscriptionStartAt?: string | null;
  subscriptionNextBillingAt?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  adminCount: number;
  disabledRoleCount: number;
  estimatedMrr: number;
};

export type PlatformUser = {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt: string;
  isPlatformAdmin: boolean;
};

export type PlatformRoleSetting = {
  roleKey: string;
  roleType: "PRIMARY" | "SUBROLE";
  isEnabled: boolean;
  updatedAt?: string | null;
};

export type PlatformRoleMatrixResponse = {
  club: { id: string; name: string; slug: string };
  roles: PlatformRoleSetting[];
};

export type InviteMemberPayload = {
  email: string;
  primary: PrimaryRole;
  subRoles?: string[];
};

export type InviteMemberResponse = {
  ok: boolean;
  invite: {
    email: string;
    clubId: string;
    primary: PrimaryRole;
    subRoles: SubRole[];
    expiresAt: string;
    token: string;
    link: string;
  };
};

export type ValidateInvitationResponse = {
  ok: boolean;
  invitation: {
    email: string;
    clubId: string;
    clubName: string;
    primary: PrimaryRole;
    subRoles: SubRole[];
    expiresAt: string;
  };
};

export type PlayerAvailabilityStatus =
  | "FIT"
  | "CAUTION"
  | "UNAVAILABLE"
  | "NO_DATA";

export type PlayerInjurySummary = {
  id?: string;
  type?: string | null;
  severity?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

export type PlayerHealthSummary = {
  status: PlayerAvailabilityStatus;
  selectionStatus: "FIT" | "NOT_FIT";
  label: string;
  note: string;
  isFitToPlay: boolean;
  selfReportedInjury: boolean;
  readinessScore?: number | null;
  wellnessStatus?: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  lastUpdatedAt?: string | null;
  activeInjury?: PlayerInjurySummary | null;
};

export type ClubPlayer = {
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  membershipId: string;
  isCaptain?: boolean;
  profile?: {
    dob?: string | null;
    nationality?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    dominantFoot?: "RIGHT" | "LEFT" | "BOTH" | null;
    positions?: string[];
    wellnessStatus?: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
    hasInjury?: boolean | null;
    readinessScore?: number | null;
    energyLevel?: number | null;
    sorenessLevel?: number | null;
    sleepHours?: number | null;
    healthNotes?: string | null;
    healthUpdatedAt?: string | null;
  } | null;
  activeInjury?: PlayerInjurySummary | null;
  health?: PlayerHealthSummary | null;
};

export type UpdateClubPlayerProfilePayload = {
  dob?: string | null;
  nationality?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  dominantFoot?: "RIGHT" | "LEFT" | "BOTH" | null;
  positions?: string[];
  wellnessStatus?: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  hasInjury?: boolean | null;
  readinessScore?: number | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  healthNotes?: string | null;
};

export type ClubInjury = {
  id: string;
  clubId: string;
  userId: string;
  type: string;
  severity?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClubPlayerTrainingLoadEntry = {
  id: string;
  clubId: string;
  userId: string;
  createdByUserId: string;
  sessionDate: string;
  sessionType?: string | null;
  durationMinutes: number;
  rpe: number;
  loadScore: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    fullName?: string | null;
  } | null;
};

export type ClubMember = {
  membershipId: string;
  clubId: string;
  userId: string;
  primary: PrimaryRole;
  subRoles: SubRole[];
  createdAt: string;
  user: { id: string; email: string; fullName?: string | null };
};

export type SquadSummary = {
  id: string;
  clubId: string;
  name: string;
  code?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members?: number };
};

export type SquadMember = {
  id: string;
  squadId: string;
  userId: string;
  jerseyNo?: number | null;
  position?: string | null;
  createdAt?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
  };
};

export type SquadDetail = SquadSummary & {
  members: SquadMember[];
};

export type CreateSquadPayload = { name: string; code?: string };

export type MatchItem = {
  id: string;
  clubId: string;
  squadId?: string | null;
  squad?: SquadSummary | null;
  title?: string | null;
  opponent?: string | null;
  venue?: string | null;
  kickoffAt?: string | null;
  status?: MatchStatus | string;
  homeScore?: number | null;
  awayScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateMatchPayload = {
  squadId?: string;
  title: string;
  opponent: string;
  venue?: string;
  kickoffAt: string;
};

export type UpdateMatchStatusPayload = {
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
};

export type MatchLineupPlayerPayload = {
  userId: string;
  jerseyNo?: number;
  position?: string;
};

export type MatchLineupPayload = {
  formation?: string;
  captainUserId?: string;
  starting: MatchLineupPlayerPayload[];
  bench: MatchLineupPlayerPayload[];
};

export type MatchLineupPlayerItem = {
  id?: string;
  lineupId?: string;
  userId: string;
  slot?: "STARTING" | "BENCH";
  jerseyNo?: number | null;
  position?: string | null;
  order?: number;
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
  };
};

export type MatchLineupWorkspacePlayer = {
  squadMemberId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  jerseyNo?: number | null;
  position?: string | null;
  profile?: ClubPlayer["profile"];
  health: PlayerHealthSummary;
  activeInjury?: PlayerInjurySummary | null;
  selectedSlot?: "STARTING" | "BENCH" | null;
};

export type MatchLineupWorkspace = {
  match: MatchItem;
  availableSquads: SquadSummary[];
  selectedSquad?: SquadSummary | null;
  availability: {
    fit: number;
    caution: number;
    unavailable: number;
    noData: number;
  };
  lineup: {
    id?: string | null;
    formation?: string | null;
    captainUserId?: string | null;
    starting: MatchLineupPlayerItem[];
    bench: MatchLineupPlayerItem[];
  };
  roster: MatchLineupWorkspacePlayer[];
};

export type LeaderboardRow = {
  rank?: number;
  user?: { id?: string; fullName?: string | null; email?: string };
  totals?: {
    goals?: number;
    assists?: number;
    minutes?: number;
    yellow?: number;
    red?: number;
  };
  value?: number;
  score?: number;
  goals?: number;
  assists?: number;
  minutes?: number;
};

export type PendingSignup = {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt: string;
  pendingAssignment?: {
    invitationId: string;
    clubId?: string;
    primary: PrimaryRole;
    subRoles: SubRole[];
    createdAt: string;
    expiresAt: string;
  } | null;
};

export type PendingSignupsScope = "CLUB" | "GLOBAL";

export type PendingSignupsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  scope?: PendingSignupsScope;
};

export type PendingSignupsPage = {
  users: PendingSignup[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    scope: PendingSignupsScope;
    q?: string;
  };
};

export type MyPendingAssignment = {
  invitationId: string;
  clubId: string;
  club: Club;
  primary: PrimaryRole;
  subRoles: SubRole[];
  createdAt: string;
  expiresAt: string;
};

export type AcceptMyAssignmentResponse = {
  ok: boolean;
  membership: {
    clubId: string;
    primary: PrimaryRole;
    subRoles: SubRole[];
    club?: Club | null;
  };
};

export async function getMe(): Promise<MeResponse> {
  const { data } = await http.get<any>("/auth/me");
  const user = data?.user ?? data;
  const memberships = Array.isArray(data?.memberships)
    ? data.memberships
    : Array.isArray(user?.memberships)
      ? user.memberships
      : [];
  const activeClubId = data?.activeClubId ?? null;
  const activeMembership =
    data?.activeMembership ??
    memberships.find((m: MeMembership) => m.clubId === activeClubId) ??
    memberships[0] ??
    null;

  return {
    user,
    memberships,
    activeClubId: activeClubId ?? activeMembership?.clubId ?? null,
    activeMembership,
    isPlatformAdmin: !!data?.isPlatformAdmin,
  };
}

export async function getMyClubs(): Promise<Club[]> {
  const { data } = await http.get<any>("/clubs/my");
  const rows = data?.clubs ?? data ?? [];

  return (Array.isArray(rows) ? rows : [])
    .map((row: any) => row?.club ?? row)
    .filter((club: any) => !!club?.id);
}

export async function createClub(payload: CreateClubPayload): Promise<Club> {
  const { data } = await http.post<any>("/clubs", payload);
  return data?.club;
}

export async function getClubTheme(clubId: string): Promise<ClubTheme> {
  const { data } = await http.get<any>(`/clubs/${clubId}/theme`);
  return data?.theme;
}

export async function updateClubTheme(
  clubId: string,
  payload: Partial<Pick<ClubTheme, "primary" | "deep">>,
): Promise<ClubTheme> {
  const { data } = await http.patch<any>(`/clubs/${clubId}/theme`, payload);
  return data?.theme;
}

export async function getClubPlayers(clubId: string): Promise<ClubPlayer[]> {
  const { data } = await http.get<any>(`/clubs/${clubId}/players`);
  return data?.players ?? data ?? [];
}

export async function updateClubPlayerProfile(
  clubId: string,
  userId: string,
  payload: UpdateClubPlayerProfilePayload,
) {
  const { data } = await http.patch<any>(
    `/clubs/${clubId}/players/${userId}/profile`,
    payload,
  );
  return data?.profile;
}

export async function getClubInjuries(
  clubId: string,
  query?: { userId?: string; active?: boolean },
): Promise<ClubInjury[]> {
  const { data } = await http.get<any>(`/clubs/${clubId}/injuries`, {
    params: query,
  });
  return data ?? [];
}

export async function createClubInjury(
  clubId: string,
  payload: {
    userId: string;
    type: string;
    severity?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  },
): Promise<ClubInjury> {
  const { data } = await http.post<any>(`/clubs/${clubId}/injuries`, payload);
  return data;
}

export async function getClubPlayerTrainingLoads(
  clubId: string,
  userId: string,
  range = "30d",
): Promise<ClubPlayerTrainingLoadEntry[]> {
  const { data } = await http.get<any>(
    `/clubs/${clubId}/players/${userId}/training-loads`,
    { params: { range } },
  );
  return data?.entries ?? data ?? [];
}

export async function createClubPlayerTrainingLoad(
  clubId: string,
  userId: string,
  payload: {
    sessionDate: string;
    sessionType?: string | null;
    durationMinutes: number;
    rpe: number;
    notes?: string | null;
  },
): Promise<ClubPlayerTrainingLoadEntry> {
  const { data } = await http.post<any>(
    `/clubs/${clubId}/players/${userId}/training-loads`,
    payload,
  );
  return data?.entry ?? data;
}

export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data } = await http.get<any>(`/clubs/${clubId}/members`);
  return data?.members ?? [];
}

export async function updateClubMemberRole(
  clubId: string,
  userId: string,
  payload: { primary?: PrimaryRole; subRoles?: SubRole[] },
) {
  const { data } = await http.patch(
    `/clubs/${clubId}/members/${userId}`,
    payload,
  );
  return data?.member;
}

export async function removeClubMember(clubId: string, userId: string) {
  const { data } = await http.delete(`/clubs/${clubId}/members/${userId}`);
  return data;
}

export async function getClubSquads(clubId: string): Promise<SquadSummary[]> {
  const { data } = await http.get<any>(`/clubs/${clubId}/squads`);
  return data?.squads ?? data ?? [];
}

export async function getSquad(
  clubId: string,
  squadId: string,
): Promise<SquadDetail> {
  const { data } = await http.get<any>(`/clubs/${clubId}/squads/${squadId}`);
  return data?.squad ?? data;
}

export async function createSquad(
  clubId: string,
  payload: CreateSquadPayload,
): Promise<SquadSummary> {
  const { data } = await http.post<any>(`/clubs/${clubId}/squads`, payload);
  return data?.squad ?? data;
}

export async function addSquadMember(
  clubId: string,
  squadId: string,
  payload: { userId: string; jerseyNo?: number; position?: string },
): Promise<SquadMember> {
  const { data } = await http.post<any>(
    `/clubs/${clubId}/squads/${squadId}/members`,
    payload,
  );
  return data?.member ?? data;
}

export async function removeSquadMember(
  clubId: string,
  squadId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { data } = await http.delete<{ ok: boolean }>(
    `/clubs/${clubId}/squads/${squadId}/members/${userId}`,
  );
  return data;
}

export async function getClubMatches(clubId: string): Promise<MatchItem[]> {
  const { data } = await http.get<any>(`/clubs/${clubId}/matches`);
  return data?.matches ?? data ?? [];
}

export async function createClubMatch(
  clubId: string,
  payload: CreateMatchPayload,
): Promise<MatchItem> {
  const { data } = await http.post<any>(`/clubs/${clubId}/matches`, payload);
  return data?.match ?? data;
}

export async function updateClubMatchStatus(
  clubId: string,
  matchId: string,
  payload: UpdateMatchStatusPayload,
): Promise<MatchItem> {
  const { data } = await http.patch<any>(
    `/clubs/${clubId}/matches/${matchId}/status`,
    payload,
  );
  return data?.match ?? data;
}

export async function updateClubMatchSquad(
  clubId: string,
  matchId: string,
  payload: { squadId?: string | null },
): Promise<MatchItem> {
  const { data } = await http.patch<any>(
    `/clubs/${clubId}/matches/${matchId}/squad`,
    payload,
  );
  return data?.match ?? data;
}

export async function getMatchLineupWorkspace(
  clubId: string,
  matchId: string,
): Promise<MatchLineupWorkspace> {
  const { data } = await http.get<any>(
    `/clubs/${clubId}/matches/${matchId}/lineup/workspace`,
  );
  return data;
}

export async function saveHomeMatchLineup(
  clubId: string,
  matchId: string,
  payload: MatchLineupPayload,
): Promise<any[]> {
  const { data } = await http.put<any>(
    `/clubs/${clubId}/matches/${matchId}/lineup/home`,
    payload,
  );
  return data;
}

export async function getLeaderboard(
  clubId: string,
  metric: LeaderboardMetric = "goals",
  limit = 10,
): Promise<LeaderboardRow[]> {
  const { data } = await http.get<any>(
    `/clubs/${clubId}/stats/leaderboard?metric=${metric}&limit=${limit}`,
  );
  return data?.leaderboard ?? data ?? [];
}

export async function inviteMember(
  clubId: string,
  payload: InviteMemberPayload,
): Promise<InviteMemberResponse> {
  const { data } = await http.post<InviteMemberResponse>(
    `/clubs/${clubId}/invite`,
    payload,
  );
  return data;
}

export async function validateInvitation(
  token: string,
): Promise<ValidateInvitationResponse> {
  const { data } = await http.get<ValidateInvitationResponse>(
    "/invitations/validate",
    {
      params: { token },
    },
  );
  return data;
}

export async function acceptInvitation(payload: {
  token: string;
  fullName: string;
  password: string;
}) {
  const { data } = await http.post("/invitations/accept", payload);
  return data;
}

export async function getPendingSignups(
  clubId: string,
  query?: PendingSignupsQuery,
): Promise<PendingSignupsPage> {
  const { data } = await http.get(`/clubs/${clubId}/signups/pending`, {
    params: query,
  });
  return {
    users: data?.users ?? [],
    pagination: {
      page: Number(data?.pagination?.page || 1),
      pageSize: Number(data?.pagination?.pageSize || query?.pageSize || 25),
      total: Number(data?.pagination?.total || 0),
      totalPages: Number(data?.pagination?.totalPages || 0),
      hasNext: Boolean(data?.pagination?.hasNext),
      scope: (data?.pagination?.scope ||
        query?.scope ||
        "CLUB") as PendingSignupsScope,
      q: String(data?.pagination?.q || query?.q || ""),
    },
  };
}

export async function assignSignupToClub(
  clubId: string,
  payload: { userId: string; primary: PrimaryRole; subRoles?: SubRole[] },
) {
  const { data } = await http.post(`/clubs/${clubId}/signups/assign`, payload);
  return data?.assignment;
}

export async function getMyPendingAssignments(): Promise<
  MyPendingAssignment[]
> {
  const { data } = await http.get("/invitations/my-pending");
  return data ?? [];
}

export async function acceptMyAssignment(
  invitationId: string,
): Promise<AcceptMyAssignmentResponse> {
  const { data } = await http.post<AcceptMyAssignmentResponse>(
    "/invitations/accept-assignment",
    {
      invitationId,
    },
  );
  return data;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const { data } = await http.get<PlatformOverview>("/platform/overview");
  return data;
}

export async function getPlatformClubs(): Promise<PlatformClub[]> {
  const { data } = await http.get<{ clubs: PlatformClub[] }>("/platform/clubs");
  return data?.clubs ?? [];
}

export async function updatePlatformClub(
  clubId: string,
  payload: Partial<
    Pick<
      PlatformClub,
      | "isActive"
      | "aiEnabled"
      | "marketplaceEnabled"
      | "socialEnabled"
      | "billingPlan"
      | "subscriptionStatus"
      | "subscriptionMonthlyPrice"
      | "subscriptionStartAt"
      | "subscriptionNextBillingAt"
    >
  >,
) {
  const { data } = await http.patch<{ club: PlatformClub }>(
    `/platform/clubs/${clubId}`,
    payload,
  );
  return data?.club;
}

export async function getPlatformRoleMatrix(
  clubId: string,
): Promise<PlatformRoleMatrixResponse> {
  const { data } = await http.get<PlatformRoleMatrixResponse>(
    `/platform/clubs/${clubId}/roles`,
  );
  return data;
}

export async function updatePlatformRoleSetting(
  clubId: string,
  roleKey: string,
  isEnabled: boolean,
): Promise<PlatformRoleMatrixResponse> {
  const { data } = await http.patch<PlatformRoleMatrixResponse>(
    `/platform/clubs/${clubId}/roles/${roleKey}`,
    { isEnabled },
  );
  return data;
}

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  const { data } = await http.get<{ users: PlatformUser[] }>("/platform/users");
  return data?.users ?? [];
}

export async function updatePlatformUserAdmin(
  userId: string,
  isPlatformAdmin: boolean,
) {
  const { data } = await http.patch<{ user: PlatformUser }>(
    `/platform/users/${userId}/platform-admin`,
    { isPlatformAdmin },
  );
  return data?.user;
}
