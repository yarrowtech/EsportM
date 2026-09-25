import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/dashboard.api";

function getErrorStatus(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status;
}

function getErrorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  return typeof message === "string" ? message : "";
}

function resolveActiveClubId() {
  try {
    return localStorage.getItem("activeClubId") || "";
  } catch {
    return "";
  }
}

function persistActiveClubId(data: any) {
  const activeClubId = String(
    data?.activeClubId ||
      data?.activeMembership?.clubId ||
      data?.memberships?.[0]?.clubId ||
      ""
  ).trim();

  if (activeClubId) localStorage.setItem("activeClubId", activeClubId);
}

async function fetchMe(activeClubId: string) {
  try {
    const data = await authApi.me(activeClubId || undefined);
    persistActiveClubId(data);
    return data;
  } catch (error) {
    const isStaleClubContext =
      !!activeClubId &&
      getErrorStatus(error) === 403 &&
      getErrorMessage(error).toLowerCase().includes("no access to this club");

    if (!isStaleClubContext) throw error;

    localStorage.removeItem("activeClubId");
    const data = await authApi.me();
    persistActiveClubId(data);
    return data;
  }
}

export function useMe(options?: { enabled?: boolean }) {
  const activeClubId = resolveActiveClubId();

  return useQuery({
    queryKey: ["me", activeClubId || "NO_CLUB"],
    queryFn: () => fetchMe(activeClubId),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
