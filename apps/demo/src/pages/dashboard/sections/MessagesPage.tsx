import { useMemo, useState } from "react";
import { operationsApi } from "../../../api/operations.api";
import {
  useOperationsFeed,
  useOperationsMessages,
  useOperationsTasks,
} from "../../../hooks/useOperations";
import { useMe } from "../../../hooks/useMe";
import { hasRolePermission } from "../../../utils/rolePolicy";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type FeedFilter = "ALL" | "MATCH" | "INJURY" | "SIGNUP" | "MESSAGE";
type Task = {
  id: string;
  type: "MATCH_PREP" | "INJURY_FOLLOWUP" | "SIGNUP_ASSIGNMENT" | "MANUAL_TASK";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "PENDING" | "DONE";
  dueAt?: string | null;
  source?: "SYSTEM" | "MANUAL";
  mutable?: boolean;
  assignedToName?: string | null;
  createdByName?: string | null;
};
type FeedItem = {
  id: string;
  kind: "MATCH" | "INJURY" | "SIGNUP" | "MESSAGE";
  tone: "default" | "warn" | "ok" | "danger";
  title: string;
  subtitle: string;
  ts: string;
  mutable?: boolean;
  isPinned?: boolean;
  audience?: string;
};
type TasksPayload = {
  counts?: {
    total?: number;
    high?: number;
    open?: number;
    dueSoon?: number;
  };
  tasks?: Task[];
};
type FeedPayload = {
  feed?: FeedItem[];
};

type OperationsMessage = {
  id: string;
  title: string;
  body: string;
  tone: "default" | "warn" | "ok" | "danger";
  audience: string;
  isPinned: boolean;
  isActive: boolean;
  mutable?: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
};

type MessagesPayload = {
  messages?: OperationsMessage[];
};

type LegacyFeedItem = {
  id: string;
  kind: "MATCH" | "INJURY";
  ts: number;
  title: string;
  subtitle: string;
  tone: "default" | "warn" | "ok" | "danger";
};

type LegacyRecentData = {
  matches?: Array<{
    id: string;
    title?: string | null;
    opponent?: string | null;
    kickoffAt?: string | null;
    status?: string | null;
    venue?: string | null;
  }>;
  injuries?: Array<{
    id: string;
    type?: string | null;
    severity?: string | null;
    isActive?: boolean;
    startDate?: string | null;
    userId?: string;
  }>;
};

const PRIMARY_ROLES = ["ADMIN", "MANAGER", "PLAYER", "MEMBER"] as const;
const SUB_ROLES = ["COACH", "PHYSIO", "AGENT", "NUTRITIONIST", "PITCH_MANAGER", "CAPTAIN"] as const;
type PrimaryRole = (typeof PRIMARY_ROLES)[number];
type SubRole = (typeof SUB_ROLES)[number];

function normalizePrimaryRole(value: unknown): PrimaryRole {
  const role = String(value || "").toUpperCase();
  if (PRIMARY_ROLES.includes(role as PrimaryRole)) return role as PrimaryRole;
  return "MEMBER";
}

function normalizeSubRoles(value: unknown): SubRole[] {
  if (!Array.isArray(value)) return [];
  const picked: SubRole[] = [];
  for (const role of SUB_ROLES) {
    if (value.includes(role)) picked.push(role);
  }
  return picked;
}

function toDateValue(input?: string | null) {
  if (!input) return 0;
  const parsed = new Date(input).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchTone(status?: string | null): FeedItem["tone"] {
  if (status === "LIVE") return "warn";
  if (status === "FINISHED") return "ok";
  if (status === "CANCELLED") return "danger";
  return "default";
}

function injuryTone(severity?: string | null): FeedItem["tone"] {
  const value = String(severity || "").toUpperCase();
  if (value === "HIGH") return "danger";
  if (value === "MEDIUM") return "warn";
  return "ok";
}

export default function MessagesPage() {
  const [filter, setFilter] = useState<FeedFilter>("ALL");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgTone, setMsgTone] = useState<"default" | "warn" | "ok" | "danger">("default");
  const [msgAudience, setMsgAudience] = useState<"ALL" | "STAFF" | "PLAYERS">("ALL");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);

  const meQuery = useMe();
  const clubId = localStorage.getItem("activeClubId") || "";

  const meData = (meQuery.data || {}) as {
    activeMembership?: { primary?: string; subRoles?: string[] } | null;
  };

  const primaryRole = normalizePrimaryRole(meData.activeMembership?.primary);
  const subRoles = normalizeSubRoles(meData.activeMembership?.subRoles);

  const canReadMessages = hasRolePermission(primaryRole, subRoles, "membership.self.read");
  const canReadOperations = hasRolePermission(primaryRole, subRoles, "operations.read");
  const canManage = hasRolePermission(primaryRole, subRoles, "operations.write");

  const tasksQuery = useOperationsTasks(24, clubId, canReadOperations);
  const feedQuery = useOperationsFeed(40, clubId, canReadOperations);
  const messagesQuery = useOperationsMessages(60, clubId, !canReadOperations && canReadMessages);

  const tasksData = (tasksQuery.data || {}) as TasksPayload;
  const feedData = (feedQuery.data || {}) as FeedPayload;
  const messagesData = (messagesQuery.data || {}) as MessagesPayload;

  const feed = useMemo(() => {
    const rows = feedData.feed || [];
    if (rows.length) {
      return rows
        .map((item) => ({
          ...item,
          tsNum: toDateValue(item.ts),
        }))
        .sort((a, b) => b.tsNum - a.tsNum);
    }

    // Fallback if feed endpoint is unavailable but old recent-style payload is passed by any proxy.
    const recent = (feedQuery.data || {}) as LegacyRecentData;
    const matches: LegacyFeedItem[] = (recent.matches || []).map((match) => ({
      id: `match-${match.id}`,
      kind: "MATCH",
      ts: toDateValue(match.kickoffAt),
      title: match.title || `vs ${match.opponent || "Opponent"}`,
      subtitle: `${match.status || "SCHEDULED"} | ${formatDateTime(match.kickoffAt)} | ${match.venue || "Venue TBA"}`,
      tone: matchTone(match.status),
    }));

    const injuries: LegacyFeedItem[] = (recent.injuries || []).map((injury) => ({
      id: `injury-${injury.id}`,
      kind: "INJURY",
      ts: toDateValue(injury.startDate),
      title: `${injury.type || "Injury"} (${injury.severity || "LOW"})`,
      subtitle: `User ${injury.userId || "-"} | ${injury.isActive ? "Active" : "Recovered"} | ${formatDateTime(
        injury.startDate
      )}`,
      tone: injuryTone(injury.severity),
    }));

    return [...matches, ...injuries].sort((a, b) => b.ts - a.ts);
  }, [feedData.feed, feedQuery.data]);

  const messages = messagesData.messages || [];
  const tasks = tasksData.tasks || [];
  const counts = tasksData.counts || {};

  const filteredFeed = useMemo(() => {
    if (filter === "ALL") return feed;
    return feed.filter((item) => item.kind === filter || (item as LegacyFeedItem).kind === filter);
  }, [feed, filter]);

  async function refreshData() {
    await Promise.all([tasksQuery.refetch(), feedQuery.refetch()]);
  }

  async function onCreateTask() {
    if (!clubId || !taskTitle.trim()) return;
    try {
      setActionBusy(true);
      setActionError(null);
      await operationsApi.createTask(clubId, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueAt("");
      setActionInfo("Task created.");
      await refreshData();
    } catch (e: any) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to create task.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onCreateMessage() {
    if (!clubId || !msgTitle.trim() || !msgBody.trim()) return;
    try {
      setActionBusy(true);
      setActionError(null);
      await operationsApi.createMessage(clubId, {
        title: msgTitle.trim(),
        body: msgBody.trim(),
        tone: msgTone,
        audience: msgAudience,
      });
      setMsgTitle("");
      setMsgBody("");
      setMsgTone("default");
      setMsgAudience("ALL");
      setActionInfo("Message published.");
      await refreshData();
    } catch (e: any) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to publish message.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onMarkTaskDone(taskId: string) {
    if (!clubId) return;
    try {
      setActionBusy(true);
      setActionError(null);
      await operationsApi.updateTask(clubId, taskId, { status: "DONE" });
      setActionInfo("Task updated.");
      await refreshData();
    } catch (e: any) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to update task.");
    } finally {
      setActionBusy(false);
    }
  }

  async function onArchiveMessage(feedId: string) {
    if (!clubId) return;
    const messageId = feedId.startsWith("message-") ? feedId.slice("message-".length) : feedId;
    try {
      setActionBusy(true);
      setActionError(null);
      await operationsApi.updateMessage(clubId, messageId, { isActive: false });
      setActionInfo("Message archived.");
      await refreshData();
    } catch (e: any) {
      setActionError(e?.response?.data?.message || e?.message || "Failed to archive message.");
    } finally {
      setActionBusy(false);
    }
  }

  if (!canReadOperations) {
    if (messagesQuery.isLoading || meQuery.isLoading) {
      return (
        <PageWrap>
          <div
            className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
            style={{ borderColor: adminCardBorder }}
          >
            Loading messages...
          </div>
        </PageWrap>
      );
    }

    return (
      <PageWrap>
        <Hero
          title="Club Messages"
          subtitle="Internal announcements shared by management."
          right={<DotTag>INBOX</DotTag>}
        />

        {(!clubId || !canReadMessages || messagesQuery.isError) && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
            style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
          >
            {!clubId
              ? "No active club selected."
              : !canReadMessages
                ? "You do not have permission to read club messages."
                : "Unable to load messages."}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Messages" value={messages.length} />
          <Stat label="Pinned" value={messages.filter((item) => item.isPinned).length} />
          <Stat label="Audience ALL" value={messages.filter((item) => item.audience === "ALL").length} />
        </div>

        <Section title="Inbox" subtitle="Latest active announcements for your role context.">
          {!messages.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No messages available right now.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-2xl border bg-white/72 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--text))]">{message.title}</p>
                    <div className="flex items-center gap-2">
                      <DotTag tone={message.tone}>{message.tone}</DotTag>
                      {message.isPinned ? <DotTag tone="warn">PINNED</DotTag> : null}
                      <span className="text-[11px] text-[rgb(var(--muted))]">{formatDateTime(message.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]">{message.body}</p>
                  <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                    Audience {message.audience || "ALL"}
                    {message.createdByName ? ` | by ${message.createdByName}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Section>
      </PageWrap>
    );
  }

  if (tasksQuery.isLoading || feedQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading feed...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Operations Feed"
        subtitle="Unified live updates from match events and medical logs."
        right={<DotTag>MESSAGES</DotTag>}
      />

      {(tasksQuery.isError || feedQuery.isError) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load feed updates.
        </div>
      )}

      {(actionError || actionInfo) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          <span className={actionError ? "text-rose-700" : "text-emerald-700"}>{actionError || actionInfo}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Feed Items" value={feed.length || 0} />
        <Stat label="Task Queue" value={counts.total || tasks.length || 0} />
        <Stat label="High Priority" value={counts.high || tasks.filter((item) => item.priority === "HIGH").length} />
        <Stat label="Due Soon" value={counts.dueSoon || 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Live Update Stream"
          subtitle="Merged and sorted by latest timestamp."
          className="xl:col-span-7"
          right={
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "MATCH", "INJURY", "SIGNUP", "MESSAGE"] as FeedFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    filter === option ? "bg-[rgba(var(--primary),.24)]" : "bg-white/70 hover:bg-white/90"
                  }`}
                  style={{ borderColor: adminCardBorder }}
                >
                  {option}
                </button>
              ))}
            </div>
          }
        >
          {!filteredFeed.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No updates for selected filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredFeed.map((item) => {
                const tsValue = "tsNum" in item ? item.tsNum : item.ts;
                const kind = item.kind;
                const tone = item.tone;
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border bg-white/72 px-3 py-3"
                    style={{ borderColor: adminCardBorder }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[rgb(var(--text))]">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <DotTag tone={tone}>{kind}</DotTag>
                        {"isPinned" in item && item.isPinned ? <DotTag tone="warn">PINNED</DotTag> : null}
                        <span className="text-[11px] text-[rgb(var(--muted))]">
                          {tsValue
                            ? formatDateTime(typeof tsValue === "number" ? new Date(tsValue).toISOString() : tsValue)
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))]">{item.subtitle}</p>
                    {canManage && item.kind === "MESSAGE" && (item as FeedItem).mutable ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onArchiveMessage(item.id)}
                          disabled={actionBusy}
                          className="rounded-full border bg-white/85 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
                          style={{ borderColor: adminCardBorder }}
                        >
                          Archive
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Task Queue" subtitle="Operational tasks generated from live club signals." className="xl:col-span-5" dark>
          {canManage ? (
            <div className="mb-3 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white/70">Create Manual Task</p>
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Task title"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/45 outline-none"
              />
              <input
                value={taskDesc}
                onChange={(event) => setTaskDesc(event.target.value)}
                placeholder="Task description"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/45 outline-none"
              />
              <input
                type="datetime-local"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={onCreateTask}
                disabled={actionBusy || !taskTitle.trim()}
                className="w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[rgb(var(--primary-2))] disabled:opacity-60"
              >
                Create Task
              </button>
            </div>
          ) : null}

          {!tasks.length ? (
            <p className="text-sm text-white/75">No open tasks right now.</p>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 10).map((task) => (
                <article key={task.id} className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <DotTag tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warn" : "ok"}>
                        {task.priority}
                      </DotTag>
                      {task.source ? <DotTag>{task.source}</DotTag> : null}
                    </div>
                  </div>
                  <p className="text-xs text-white/70">{task.description}</p>
                  <p className="mt-1 text-[11px] text-white/60">
                    {task.status} {task.dueAt ? `| Due ${formatDateTime(task.dueAt)}` : ""}
                  </p>
                  {task.assignedToName || task.createdByName ? (
                    <p className="mt-1 text-[11px] text-white/50">
                      {task.assignedToName ? `Assigned: ${task.assignedToName}` : ""}
                      {task.assignedToName && task.createdByName ? " | " : ""}
                      {task.createdByName ? `Created by: ${task.createdByName}` : ""}
                    </p>
                  ) : null}
                  {task.mutable && task.status !== "DONE" ? (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onMarkTaskDone(task.id)}
                        disabled={actionBusy}
                        className="rounded-full border bg-white/85 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                        style={{ borderColor: "rgba(255,255,255,.45)" }}
                      >
                        Mark Done
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/60">Open</p>
              <p className="text-xl font-semibold text-white">{counts.open || tasks.filter((item) => item.status !== "DONE").length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
              <p className="text-xs text-white/60">Due Soon</p>
              <p className="text-xl font-semibold text-white">{counts.dueSoon || 0}</p>
            </div>
          </div>
        </Section>
      </div>

      {canManage ? (
        <Section title="Broadcast Composer" subtitle="Publish internal message feed items to selected audience.">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={msgTitle}
              onChange={(event) => setMsgTitle(event.target.value)}
              placeholder="Message title"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={msgBody}
              onChange={(event) => setMsgBody(event.target.value)}
              placeholder="Message body"
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminCardBorder }}
            />
            <div className="flex gap-2">
              <select
                value={msgTone}
                onChange={(event) => setMsgTone(event.target.value as "default" | "warn" | "ok" | "danger")}
                className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold outline-none"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="default">default</option>
                <option value="warn">warn</option>
                <option value="ok">ok</option>
                <option value="danger">danger</option>
              </select>
              <select
                value={msgAudience}
                onChange={(event) => setMsgAudience(event.target.value as "ALL" | "STAFF" | "PLAYERS")}
                className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold outline-none"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="ALL">ALL</option>
                <option value="STAFF">STAFF</option>
                <option value="PLAYERS">PLAYERS</option>
              </select>
              <button
                type="button"
                onClick={onCreateMessage}
                disabled={actionBusy || !msgTitle.trim() || !msgBody.trim()}
                className="rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60"
                style={{
                  background: "rgb(var(--primary))",
                  color: "rgb(var(--primary-2))",
                  border: `1px solid ${adminCardBorder}`,
                }}
              >
                Publish
              </button>
            </div>
          </div>
        </Section>
      ) : null}
    </PageWrap>
  );
}
