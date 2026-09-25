import { http } from "./http";

export type PlayerProfile = {
  id: string;
  userId: string;
  dob: string | null;
  nationality: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dominantFoot: "RIGHT" | "LEFT" | "BOTH" | null;
  positions: string[];
  wellnessStatus: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  hasInjury: boolean | null;
  readinessScore: number | null;
  energyLevel: number | null;
  sorenessLevel: number | null;
  sleepHours: number | null;
  healthNotes: string | null;
  healthUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
};

export type PlayerProfileDto = {
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

export type PlayerHealthDto = Pick<
  PlayerProfileDto,
  | "wellnessStatus"
  | "hasInjury"
  | "readinessScore"
  | "energyLevel"
  | "sorenessLevel"
  | "sleepHours"
  | "healthNotes"
>;

export type PlayerWellnessEntry = {
  id: string;
  clubId: string;
  userId: string;
  wellnessStatus?: "FIT" | "LIMITED" | "UNAVAILABLE" | null;
  hasInjury?: boolean | null;
  readinessScore?: number | null;
  energyLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  healthNotes?: string | null;
  recordedAt: string;
  createdAt: string;
};

export type PlayerTrainingLoadEntry = {
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

export async function getMyPlayerProfile() {
  const { data } = await http.get<{ profile: PlayerProfile | null }>(
    "/players/me",
  );
  return data.profile;
}

export async function getMyPlayerHistory(range = "30d") {
  const { data } = await http.get<{
    clubId: string | null;
    wellnessEntries: PlayerWellnessEntry[];
    trainingLoads: PlayerTrainingLoadEntry[];
  }>("/players/me/history", {
    params: { range },
  });
  return data;
}

export async function updateMyPlayerProfile(payload: PlayerHealthDto) {
  const { data } = await http.patch<{ profile: PlayerProfile }>(
    "/players/me",
    payload,
  );
  return data.profile;
}
