import { useQuery } from "@tanstack/react-query";
import { fetchClubScheduleEvents, type ScheduleEvent } from "../api/schedule.api";

const NO_CLUB_KEY = "NO_CLUB";

export function useScheduleEvents(clubId?: string) {
  const normalizedClubId = (clubId || "").trim();

  return useQuery<ScheduleEvent[]>({
    queryKey: ["clubSchedule", normalizedClubId || NO_CLUB_KEY],
    queryFn: () => fetchClubScheduleEvents(normalizedClubId),
    enabled: Boolean(normalizedClubId),
    staleTime: 60_000,
  });
}
