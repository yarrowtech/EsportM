import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { resolveDashboardLanding } from "../../utils/dashboardRouting";

export default function DashboardRouter() {
  const { data, isLoading, isError, error } = useMe();

  useEffect(() => {
    const activeClubId = data?.activeClubId;
    if (activeClubId) localStorage.setItem("activeClubId", activeClubId);
  }, [data?.activeClubId]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div
          className="rounded-3xl border px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{
            borderColor: "rgb(var(--border) / .14)",
            background:
              "linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,255,255,.44) 62%, rgba(var(--primary), .10))",
          }}
        >
          Loading dashboard...
        </div>
      </div>
    );
  }
  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const message =
      status === 401
        ? "Session expired. Please log in again."
        : "Unable to load your dashboard profile. Please refresh.";

    return (
      <div className="p-4 sm:p-6">
        <div
          className="rounded-3xl border px-5 py-6 text-sm font-semibold text-rose-700"
          style={{
            borderColor: "rgb(var(--border) / .14)",
            background: "rgba(255,255,255,.70)",
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  const landing = resolveDashboardLanding(data, localStorage.getItem("activeDashboardRole"));
  localStorage.setItem("activeDashboardRole", landing.dashboardRole);
  return <Navigate to={landing.path} replace />;
}
