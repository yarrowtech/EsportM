// The demo can be viewed as the club admin or as one of the seeded players.
// The choice lives in localStorage so it survives a refresh, and the mock
// adapter reads it to decide who "/auth/me" is.
export type DemoPersona = "admin" | "player";

const PERSONA_KEY = "demoPersona";

export function getDemoPersona(): DemoPersona {
  return localStorage.getItem(PERSONA_KEY) === "player" ? "player" : "admin";
}

export function dashboardRoleForPersona(persona: DemoPersona) {
  return persona === "player" ? "PLAYER" : "ADMIN";
}

// Full reload on switch: every cached query belongs to the previous persona.
export function switchDemoPersona(next: DemoPersona) {
  localStorage.setItem(PERSONA_KEY, next);
  localStorage.setItem("activeDashboardRole", dashboardRoleForPersona(next));
  window.location.assign("/dashboard");
}
