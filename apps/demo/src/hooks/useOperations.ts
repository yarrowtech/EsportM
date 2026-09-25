import { useQuery } from "@tanstack/react-query";
import { operationsApi } from "../api/operations.api";

function resolveClubId(clubId?: string) {
  if (typeof clubId === "string") return clubId;
  return localStorage.getItem("activeClubId") || "";
}

export function useOperationsTraining(range = "30d", clubId?: string, enabled = true) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "training", effectiveClubId || "NO_CLUB", range],
    enabled: enabled && !!effectiveClubId,
    queryFn: () => operationsApi.training(effectiveClubId, range),
  });
}

export function useOperationsTasks(limit = 20, clubId?: string, enabled = true) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "tasks", effectiveClubId || "NO_CLUB", limit],
    enabled: enabled && !!effectiveClubId,
    queryFn: () => operationsApi.tasks(effectiveClubId, limit),
  });
}

export function useOperationsFeed(limit = 30, clubId?: string, enabled = true) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: ["operations", "feed", effectiveClubId || "NO_CLUB", limit],
    enabled: enabled && !!effectiveClubId,
    queryFn: () => operationsApi.feed(effectiveClubId, limit),
  });
}

export function useOperationsMessages(
  limit = 30,
  clubId?: string,
  enabled = true,
  includeArchived = false
) {
  const effectiveClubId = resolveClubId(clubId);
  return useQuery({
    queryKey: [
      "operations",
      "messages",
      effectiveClubId || "NO_CLUB",
      limit,
      includeArchived,
    ],
    enabled: enabled && !!effectiveClubId,
    queryFn: () => operationsApi.messages(effectiveClubId, limit, includeArchived),
  });
}
