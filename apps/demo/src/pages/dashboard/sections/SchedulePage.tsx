import { useMemo, useState, type FormEvent } from "react";
import type { PrimaryRole, SubRole } from "../../../api/admin.api";
import {
  createScheduleEvent,
  ScheduleEventType,
  type ScheduleEvent,
  type ScheduleTargetGroup,
} from "../../../api/schedule.api";
import { useScheduleEvents } from "../../../hooks/useScheduleEvents";
import { useMe } from "../../../hooks/useMe";
import { hasRolePermission } from "../../../utils/rolePolicy";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  adminCardBorder,
  cx,
  formatDateTime,
} from "../../admin/admin-ui";

const PRIMARY_ROLES = ["ADMIN", "MANAGER", "PLAYER", "MEMBER"] as const;
const SUB_ROLES = [
  "AGENT",
  "PHYSIO",
  "COACH",
  "NUTRITIONIST",
  "PITCH_MANAGER",
  "CAPTAIN",
] as const;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SCHEDULE_GROUP_OPTIONS: ScheduleTargetGroup[] = [
  "Players",
  "Coaches",
  "Physios",
  "Nutritionists",
  "Pitch Managers",
  "Support Staff",
];

function normalizePrimaryRole(value: unknown): PrimaryRole {
  const role = String(value || "").toUpperCase();
  if (PRIMARY_ROLES.includes(role as PrimaryRole)) return role as PrimaryRole;
  return "MEMBER";
}

function normalizeSubRoles(input: unknown): SubRole[] {
  if (!Array.isArray(input)) return [];
  const picked: SubRole[] = [];
  for (const role of SUB_ROLES) {
    if (input.includes(role)) picked.push(role);
  }
  return picked;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateTimeInput(value: Date) {
  const tzOffset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
}

function eventTone(type: ScheduleEventType) {
  if (type === ScheduleEventType.Match) return "warn";
  return "ok";
}

const DAY_CELL_COUNT = 42;

export default function SchedulePage() {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(today));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventAt, setEventAt] = useState(() => toLocalDateTimeInput(today));
  const [scheduleType, setScheduleType] = useState<ScheduleEventType>(
    ScheduleEventType.Training
  );
  const [selectedGroups, setSelectedGroups] = useState<ScheduleTargetGroup[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const meQuery = useMe();
  const meData = (meQuery.data || {}) as {
    activeClubId?: string | null;
    activeMembership?: {
      primary?: string;
      subRoles?: string[];
    } | null;
  };
  const activeClubId = String(
    meData.activeClubId || localStorage.getItem("activeClubId") || ""
  ).trim();
  const primaryRole = normalizePrimaryRole(meData.activeMembership?.primary);
  const subRoles = normalizeSubRoles(meData.activeMembership?.subRoles);
  const canManageSchedule = hasRolePermission(primaryRole, subRoles, "schedule.write");

  const scheduleQuery = useScheduleEvents(activeClubId || undefined);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of scheduleQuery.data || []) {
      const key = formatDateKey(new Date(event.eventAt));
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort(
        (a, b) => new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime()
      );
    }
    return map;
  }, [scheduleQuery.data]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = monthStart.getDay();
    return Array.from({ length: DAY_CELL_COUNT }).map((_, index) => {
      const date = new Date(monthStart);
      date.setDate(1 + index - startOffset);
      return {
        date,
        key: formatDateKey(date),
        isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      };
    });
  }, [visibleMonth]);

  const selectedKey = formatDateKey(selectedDate);
  const selectedEvents = useMemo(() => {
    const events = eventsByDay.get(selectedKey);
    return events ? [...events] : [];
  }, [eventsByDay, selectedKey]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleSelectDay = (value: Date) => {
    setSelectedDate(startOfDay(value));
    setVisibleMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  };

  const changeMonth = (delta: number) => {
    setVisibleMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return next;
    });
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(startOfDay(today));
  };

  const toggleGroup = (group: ScheduleTargetGroup) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group]
    );
  };

  const handleCreateSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeClubId) {
      setFormError("Select a club to publish schedules.");
      setFormSuccess(null);
      return;
    }
    if (!title.trim()) {
      setFormError("Title is required.");
      setFormSuccess(null);
      return;
    }
    if (!eventAt) {
      setFormError("Pick a date and time.");
      setFormSuccess(null);
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      await createScheduleEvent(activeClubId, {
        type: scheduleType,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        eventAt: new Date(eventAt).toISOString(),
        targetGroups: selectedGroups.length ? [...selectedGroups] : undefined,
      });
      setFormSuccess("Schedule added successfully.");
      setTitle("");
      setDescription("");
      setLocation("");
      setEventAt(toLocalDateTimeInput(new Date()));
      setSelectedGroups([]);
      await scheduleQuery.refetch();
      const createdDate = new Date(eventAt);
      handleSelectDay(createdDate);
    } catch (error: any) {
      setFormError(error?.response?.data?.message || error?.message || "Failed to save schedule.");
      setFormSuccess(null);
    } finally {
      setCreating(false);
    }
  };

  if (meQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading scheduling workspace...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Scheduling Control"
        subtitle="Plan matches, training sessions, and key club events with clear visibility."
        right={
          <div className="flex items-center gap-2">
            <DotTag tone="ok">Calendar</DotTag>
            <DotTag tone="default">Live</DotTag>
          </div>
        }
      />

      {!activeClubId && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Select an active club to view or publish scheduling. Use the club selector in the top bar.
        </div>
      )}

      {scheduleQuery.isError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load schedule data right now.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
        <Section
          title="Month View"
          subtitle="Tap any date to see that day's audience."
          className="lg:col-span-2"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Month</p>
                <p className="text-lg font-semibold text-[rgb(var(--text))]">{monthLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: adminCardBorder }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: adminCardBorder }}
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: adminCardBorder }}
                >
                  Today
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-center">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => {
                const isSelected = cell.key === selectedKey;
                const isToday = cell.key === formatDateKey(startOfDay(today));
                const eventCount = eventsByDay.get(cell.key)?.length ?? 0;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => handleSelectDay(cell.date)}
                    aria-pressed={isSelected}
                    className={cx(
                      "flex h-20 flex-col items-center justify-between rounded-2xl border px-1 py-2 text-[12px] transition",
                      cell.isCurrentMonth
                        ? "bg-white/80 text-[rgb(var(--text))]"
                        : "bg-white/5 text-white/50",
                      isSelected
                        ? "border-[rgb(var(--primary-2))] bg-gradient-to-br from-[rgba(var(--primary),.92)] to-[rgba(var(--primary-2),.72)] text-white shadow-[0_12px_30px_rgba(var(--primary),.35)]"
                        : "border-transparent",
                      !cell.isCurrentMonth && !isSelected ? "opacity-70" : ""
                    )}
                  >
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="font-semibold">{cell.date.getDate()}</span>
                      {isToday && (
                        <span className="rounded-full bg-[rgba(var(--primary),.18)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {eventCount > 0 ? (
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(3, eventCount) }).map((_, dotIndex) => (
                            <span
                              key={dotIndex}
                              className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary))]"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[rgb(var(--muted))]">Free</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <div className="flex flex-col gap-4">
          <Section title={`Events on ${selectedDateLabel}`} subtitle="Tap an item for more context.">
            {scheduleQuery.isLoading && (
              <p className="text-sm text-[rgb(var(--muted))]">Loading events...</p>
            )}
            {!scheduleQuery.isLoading && !selectedEvents.length && (
              <p className="text-sm text-[rgb(var(--muted))]">No events scheduled for this day.</p>
            )}
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--text))]">{event.title}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {formatDateTime(event.eventAt)} · {event.location || "Location TBD"}
                      </p>
                    </div>
                    <DotTag tone={eventTone(event.type)}>{event.type}</DotTag>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">{event.description}</p>
                  )}
                  {event.targetGroups?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.targetGroups.map((group) => (
                        <span
                          key={group}
                          className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          style={{ borderColor: adminCardBorder }}
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </Section>

          {canManageSchedule && (
            <Section title="Publish an event" subtitle="Pick an audience for visibility.">
              <form className="space-y-3" onSubmit={handleCreateSchedule}>
                <div className="grid gap-3">
                  <select
                    value={scheduleType}
                    onChange={(event) =>
                      setScheduleType(event.target.value as ScheduleEventType)
                    }
                    className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  >
                  <option value={ScheduleEventType.Training}>Training</option>
                  <option value={ScheduleEventType.Match}>Match</option>
                  </select>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Event title"
                    className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Location (optional)"
                    className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  />
                  <input
                    type="datetime-local"
                    value={eventAt}
                    onChange={(event) => setEventAt(event.target.value)}
                    className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: adminCardBorder }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
                    Audience
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SCHEDULE_GROUP_OPTIONS.map((group) => {
                      const selected = selectedGroups.includes(group);
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => toggleGroup(group)}
                          className={cx(
                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                            selected
                              ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-2))]"
                              : "border bg-white/90 text-[rgb(var(--text))]"
                          )}
                          style={{
                            borderColor: selected ? "transparent" : adminCardBorder,
                          }}
                        >
                          {group}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[rgb(var(--muted))]">
                    Leave empty to broadcast to every member group.
                  </p>
                </div>

                {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}
                {formSuccess && (
                  <p className="text-sm font-semibold text-emerald-600">{formSuccess}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold transition"
                    style={{
                      background: "rgb(var(--primary))",
                      color: "rgb(var(--primary-2))",
                      border: `1px solid ${adminCardBorder}`,
                    }}
                  >
                    {creating ? "Publishing..." : "Publish Schedule"}
                  </button>
                </div>
              </form>
            </Section>
          )}
        </div>
      </div>
    </PageWrap>
  );
}
