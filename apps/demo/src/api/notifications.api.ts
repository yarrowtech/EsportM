import { http } from './http';

export type Notification = {
  id: string;
  clubId: string;
  userId: string;
  scheduleEventId?: string | null;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: Notification[];
  unreadCount: number;
};

export async function fetchNotifications(clubId?: string) {
  const response = await http.get<NotificationListResponse>('/notifications', {
    params: clubId ? { clubId } : undefined,
  });
  return response.data;
}

export async function markNotificationRead(id: string) {
  await http.patch(`/notifications/${id}/read`);
}
