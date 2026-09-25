import { useQuery } from '@tanstack/react-query';
import { fetchNotifications, type NotificationListResponse } from '../api/notifications.api';

const NO_CLUB = 'NO_CLUB';

export function useNotifications(clubId?: string) {
  const normalizedClubId = (clubId || '').trim();

  return useQuery<NotificationListResponse>({
    queryKey: ['notifications', normalizedClubId || NO_CLUB],
    queryFn: () => fetchNotifications(normalizedClubId || undefined),
    enabled: Boolean(normalizedClubId),
    staleTime: 30_000,
  });
}
