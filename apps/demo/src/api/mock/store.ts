// Mutable in-memory copy of the fixtures so demo actions (create match, mark
// notification read, save analytics, ...) visibly persist for the session.
import * as fx from "./fixtures";

export const state = {
  notifications: fx.notifications.map((n) => ({ ...n })),
  matches: fx.matches.map((m) => ({ ...m })),
  squads: fx.squads.map((s) => ({ ...s })),
  squadDetails: Object.fromEntries(
    Object.entries(fx.squadDetails).map(([id, squad]) => [id, { ...squad, members: [...squad.members] }])
  ) as Record<string, any>,
  members: fx.members.map((m) => ({ ...m })),
  players: fx.players.map((p) => ({ ...p, profile: { ...p.profile } })),
  injuries: fx.clubInjuries.map((i) => ({ ...i })),
  scheduleEvents: fx.scheduleEvents.map((e) => ({ ...e })),
  tasks: fx.operationsTasks.map((t) => ({ ...t })),
  messages: fx.operationsMessages.map((m) => ({ ...m })),
  analyticsLatest: fx.buildAnalyticsPayload().latest,
  marketplaceListing: null as any,
};

let counter = 1000;
export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}
