import { CLUB_ID } from "../api/mock/fixtures";

// Auto-signs the visitor into the seeded demo club so the login screen is
// skipped. Only fills in keys that are missing, so switching roles or
// logging out mid-session still behaves naturally across a page refresh.
export function bootstrapDemoSession() {
  if (!localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", "demo-session-token");
  }
  if (!localStorage.getItem("activeClubId")) {
    localStorage.setItem("activeClubId", CLUB_ID);
  }
  if (!localStorage.getItem("activeDashboardRole")) {
    localStorage.setItem("activeDashboardRole", "ADMIN");
  }
}
