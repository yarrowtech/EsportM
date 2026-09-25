import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";

function resolveDashboardRole(explicitAs?: string) {
  const candidate = String(explicitAs || localStorage.getItem("activeDashboardRole") || "")
    .trim()
    .toUpperCase();

  if (!candidate || candidate === "MEMBER") return undefined;
  return candidate;
}

export function useDashboardOverview(as?: string) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "overview", effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.overview(effectiveAs),
  });
}

export function useDashboardCharts(range: string, as?: string) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "charts", range, effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.charts(range, effectiveAs),
  });
}

export function useDashboardRecent(limit = 10, as?: string, enabled = true) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "recent", limit, effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.recent(limit, effectiveAs),
    enabled,
  });
}

export function useDashboardAnalytics(range: string, as?: string, enabled = true) {
  const effectiveAs = resolveDashboardRole(as);
  return useQuery({
    queryKey: ["dashboard", "analytics", range, effectiveAs || "AUTO"],
    queryFn: () => dashboardApi.analytics(range, effectiveAs),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
