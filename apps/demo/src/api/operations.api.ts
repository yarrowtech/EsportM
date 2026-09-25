import { http } from "./http";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "OPEN" | "PENDING" | "DONE";

export type CreateTaskPayload = {
  title: string;
  description?: string;
  assignedToUserId?: string;
  priority?: TaskPriority;
  dueAt?: string;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string;
  assignedToUserId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: string;
};

export type CreateMessagePayload = {
  title: string;
  body: string;
  tone?: "default" | "warn" | "ok" | "danger";
  audience?: "ALL" | "STAFF" | "PLAYERS";
  isPinned?: boolean;
};

export type UpdateMessagePayload = {
  title?: string;
  body?: string;
  tone?: "default" | "warn" | "ok" | "danger";
  audience?: "ALL" | "STAFF" | "PLAYERS";
  isPinned?: boolean;
  isActive?: boolean;
};

export const operationsApi = {
  training: (clubId: string, range = "30d") =>
    http
      .get(`/clubs/${encodeURIComponent(clubId)}/operations/training`, { params: { range } })
      .then((r) => r.data),

  tasks: (clubId: string, limit = 20) =>
    http
      .get(`/clubs/${encodeURIComponent(clubId)}/operations/tasks`, { params: { limit } })
      .then((r) => r.data),

  feed: (clubId: string, limit = 30) =>
    http
      .get(`/clubs/${encodeURIComponent(clubId)}/operations/feed`, { params: { limit } })
      .then((r) => r.data),

  messages: (clubId: string, limit = 30, includeArchived = false) =>
    http
      .get(`/clubs/${encodeURIComponent(clubId)}/operations/messages`, {
        params: { limit, includeArchived },
      })
      .then((r) => r.data),

  createTask: (clubId: string, payload: CreateTaskPayload) =>
    http
      .post(`/clubs/${encodeURIComponent(clubId)}/operations/tasks`, payload)
      .then((r) => r.data),

  updateTask: (clubId: string, taskId: string, payload: UpdateTaskPayload) =>
    http
      .patch(`/clubs/${encodeURIComponent(clubId)}/operations/tasks/${encodeURIComponent(taskId)}`, payload)
      .then((r) => r.data),

  createMessage: (clubId: string, payload: CreateMessagePayload) =>
    http
      .post(`/clubs/${encodeURIComponent(clubId)}/operations/messages`, payload)
      .then((r) => r.data),

  updateMessage: (clubId: string, messageId: string, payload: UpdateMessagePayload) =>
    http
      .patch(
        `/clubs/${encodeURIComponent(clubId)}/operations/messages/${encodeURIComponent(messageId)}`,
        payload
      )
      .then((r) => r.data),
};
