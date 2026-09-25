import { http } from './http';

export const ScheduleEventType = {
  Training: 'TRAINING',
  Match: 'MATCH',
} as const;

export type ScheduleEventType =
  (typeof ScheduleEventType)[keyof typeof ScheduleEventType];

export type ScheduleTargetGroup =
  | 'Players'
  | 'Coaches'
  | 'Physios'
  | 'Nutritionists'
  | 'Pitch Managers'
  | 'Support Staff';

export type ScheduleEvent = {
  id: string;
  clubId: string;
  createdByUserId: string;
  type: ScheduleEventType;
  title: string;
  description?: string | null;
  eventAt: string;
  location?: string | null;
  targetGroups: ScheduleTargetGroup[];
  privateToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduleEventPayload = {
  type: ScheduleEventType;
  title: string;
  eventAt: string;
  location?: string;
  description?: string;
  targetGroups?: ScheduleTargetGroup[];
};

export async function fetchClubScheduleEvents(clubId: string) {
  const response = await http.get<ScheduleEvent[]>(`/clubs/${encodeURIComponent(clubId)}/schedule`);
  return response.data;
}

export async function createScheduleEvent(clubId: string, payload: CreateScheduleEventPayload) {
  const response = await http.post<ScheduleEvent>(`/clubs/${encodeURIComponent(clubId)}/schedule`, payload);
  return response.data;
}
