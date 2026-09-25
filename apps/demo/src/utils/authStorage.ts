const TOKEN_KEY = "accessToken";
const CLUB_KEY = "activeClubId";
const DASHBOARD_ROLE_KEY = "activeDashboardRole";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // optional: remove legacy key if you used it earlier
  localStorage.removeItem("token");
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token"); // legacy cleanup
  localStorage.removeItem(CLUB_KEY);
  localStorage.removeItem(DASHBOARD_ROLE_KEY);
}
