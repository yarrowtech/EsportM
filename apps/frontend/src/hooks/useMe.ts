import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/dashboard.api";

function resolveActiveClubId() {
  try {
    return localStorage.getItem("activeClubId") || "";
  } catch {
    return "";
  }
}

export function useMe(options?: { enabled?: boolean }) {
  const activeClubId = resolveActiveClubId();

  return useQuery({
    queryKey: ["me", activeClubId || "NO_CLUB"],
    queryFn: () => authApi.me(activeClubId || undefined),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
