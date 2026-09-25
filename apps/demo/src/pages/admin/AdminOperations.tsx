import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getClubMembers, type ClubMember } from "../../api/admin.api";
import {
  operationsApi,
  type TaskPriority,
  type TaskStatus,
} from "../../api/operations.api";
import { useOperationsFeed, useOperationsTasks } from "../../hooks/useOperations";
import { type RolePermission } from "../../utils/rolePolicy";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "./admin-ui";

type Ctx = {
  clubId: string;
  permissions?: RolePermission[];
};

type OpsTask = {
  id: string;
  type: "MATCH_PREP" | "INJURY_FOLLOWUP" | "SIGNUP_ASSIGNMENT" | "MANUAL_TASK";
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string | null;
  createdAt?: string | null;
  source?: "SYSTEM" | "MANUAL";
  mutable?: boolean;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  createdByName?: string | null;
};

type OpsFeedItem = {
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
  tasks?: OpsTask[];
};

type FeedPayload = {
  feed?: OpsFeedItem[];
};

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

function messageIdFromFeedId(feedId: string) {
  return feedId.startsWith("message-") ? feedId.slice("message-".length) : feedId;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export default function AdminOperations() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;
  const permissionSet = new Set<RolePermission>(ctx.permissions || []);
  const canReadOperations = permissionSet.has("operations.read");
  const canReadMembers = permissionSet.has("members.read");
  const canManage = permissionSet.has("operations.write");
  const clubIdForOps = canReadOperations ? clubId : "";

  const tasksQuery = useOperationsTasks(80, clubIdForOps);
  const feedQuery = useOperationsFeed(80, clubIdForOps);

  const tasksPayload = (tasksQuery.data || {}) as TasksPayload;
  const feedPayload = (feedQuery.data || {}) as FeedPayload;
  const tasks = useMemo(() => tasksPayload.tasks || [], [tasksPayload.tasks]);
  const feed = useMemo(() => feedPayload.feed || [], [feedPayload.feed]);
  const messages = useMemo(() => feed.filter((row) => row.kind === "MESSAGE"), [feed]);
  const counts = tasksPayload.counts || {};

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [membersErr, setMembersErr] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgTone, setMsgTone] = useState<"default" | "warn" | "ok" | "danger">("default");
  const [msgAudience, setMsgAudience] = useState<"ALL" | "STAFF" | "PLAYERS">("ALL");
  const [msgPinned, setMsgPinned] = useState(false);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadMembers() {
      if (!clubId || !canReadMembers) {
        if (alive) {
          setMembers([]);
          setMembersErr(null);
        }
        return;
      }
      try {
        setMembersErr(null);
        const rows = await getClubMembers(clubId);
        if (!alive) return;
        setMembers(rows || []);
      } catch (e: unknown) {
        if (!alive) return;
        setMembers([]);
        setMembersErr(messageOf(e, "Failed to load member directory."));
      }
    }
    loadMembers();
    return () => {
      alive = false;
    };
  }, [canReadMembers, clubId]);

  const memberOptions = useMemo(() => {
    return members.map((member) => ({
      userId: member.userId,
      label: member.user.fullName || member.user.email || member.userId,
    }));
  }, [members]);

  const completionTrend = useMemo(() => {
    const dayMap = new Map<string, { label: string; total: number; done: number }>();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 86400000);
      const key = date.toISOString().slice(0, 10);
      dayMap.set(key, {
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        total: 0,
        done: 0,
      });
    }

    for (const task of tasks) {
      const raw = task.createdAt || task.dueAt;
      if (!raw) continue;
      const key = new Date(raw).toISOString().slice(0, 10);
      if (!dayMap.has(key)) continue;
      const row = dayMap.get(key)!;
      row.total += 1;
      if (task.status === "DONE") row.done += 1;
    }

    return Array.from(dayMap.values()).map((row) => ({
      day: row.label,
      total: row.total,
      done: row.done,
      rate: row.total > 0 ? Math.round((row.done / row.total) * 100) : 0,
    }));
  }, [tasks]);

  const workloadByRole = useMemo(() => {
    const roleByUserId = new Map<string, "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER">();
    for (const member of members) roleByUserId.set(member.userId, member.primary);

    const bucket = new Map<string, { role: string; open: number; total: number; high: number }>();
    function ensure(role: string) {
      if (!bucket.has(role)) bucket.set(role, { role, open: 0, total: 0, high: 0 });
      return bucket.get(role)!;
    }

    for (const task of tasks) {
      const role = task.assignedToUserId ? roleByUserId.get(task.assignedToUserId) || "UNASSIGNED" : "UNASSIGNED";
      const row = ensure(role);
      row.total += 1;
      if (task.status !== "DONE") row.open += 1;
      if (task.priority === "HIGH") row.high += 1;
    }

    const order = ["ADMIN", "MANAGER", "PLAYER", "UNASSIGNED"];
    return Array.from(bucket.values()).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  }, [members, tasks]);

  const messageEngagement = useMemo(() => {
    const scored = messages.map((message) => {
      const ageHours = Math.max(0, (Date.now() - new Date(message.ts).getTime()) / 3600000);
      const recency = clamp(25 - ageHours / 8, 0, 25);
      const pinBoost = message.isPinned ? 30 : 0;
      const audienceBoost = message.audience === "ALL" ? 20 : 12;
      const toneBoost =
        message.tone === "danger" ? 18 : message.tone === "warn" ? 14 : message.tone === "ok" ? 10 : 6;
      const score = Math.round(clamp(15 + recency + pinBoost + audienceBoost + toneBoost));

      return {
        ...message,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }, [messages]);

  const overallCompletionRate = useMemo(() => {
    const total = tasks.length;
    if (!total) return 0;
    const done = tasks.filter((task) => task.status === "DONE").length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  const avgMessageScore = useMemo(() => {
    if (!messageEngagement.length) return 0;
    const sum = messageEngagement.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / messageEngagement.length);
  }, [messageEngagement]);

  async function refreshData() {
    await Promise.all([tasksQuery.refetch(), feedQuery.refetch()]);
  }

  async function onCreateTask() {
    if (!clubId || !canManage || !taskTitle.trim()) return;
    try {
      setBusy(true);
      setToast(null);
      await operationsApi.createTask(clubId, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        dueAt: taskDueAt ? new Date(taskDueAt).toISOString() : undefined,
        assignedToUserId: taskAssignee || undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskDueAt("");
      setTaskAssignee("");
      setToast({ type: "ok", msg: "Task created." });
      await refreshData();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to create task.") });
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateTask(taskId: string, payload: { status?: TaskStatus; assignedToUserId?: string; priority?: TaskPriority }) {
    if (!clubId || !canManage) return;
    try {
      setBusy(true);
      setToast(null);
      await operationsApi.updateTask(clubId, taskId, payload);
      setToast({ type: "ok", msg: "Task updated." });
      await refreshData();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to update task.") });
    } finally {
      setBusy(false);
    }
  }

  async function onCreateMessage() {
    if (!clubId || !canManage || !msgTitle.trim() || !msgBody.trim()) return;
    try {
      setBusy(true);
      setToast(null);
      await operationsApi.createMessage(clubId, {
        title: msgTitle.trim(),
        body: msgBody.trim(),
        tone: msgTone,
        audience: msgAudience,
        isPinned: msgPinned,
      });
      setMsgTitle("");
      setMsgBody("");
      setMsgTone("default");
      setMsgAudience("ALL");
      setMsgPinned(false);
      setToast({ type: "ok", msg: "Message published." });
      await refreshData();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to publish message.") });
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateMessage(feedId: string, payload: { isPinned?: boolean; isActive?: boolean }) {
    if (!clubId || !canManage) return;
    try {
      setBusy(true);
      setToast(null);
      await operationsApi.updateMessage(clubId, messageIdFromFeedId(feedId), payload);
      setToast({ type: "ok", msg: "Message updated." });
      await refreshData();
    } catch (e: unknown) {
      setToast({ type: "err", msg: messageOf(e, "Failed to update message.") });
    } finally {
      setBusy(false);
    }
  }

  if (tasksQuery.isLoading || feedQuery.isLoading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading operations workspace...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Operations Workspace"
        subtitle="Dedicated management for club tasks and internal communications."
        right={<DotTag tone={canManage ? "warn" : "default"}>{canManage ? "CAN MANAGE" : "READ ONLY"}</DotTag>}
      />

      {toast ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          <span className={toast.type === "ok" ? "text-emerald-700" : "text-rose-700"}>{toast.msg}</span>
        </div>
      ) : null}

      {(!canReadOperations || tasksQuery.isError || feedQuery.isError || membersErr) && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          {(!canReadOperations && "You do not have permission to view operations for this club.") ||
            membersErr ||
            "Some operations data failed to load."}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Tasks" value={counts.total || tasks.length || 0} />
        <Stat label="Open" value={counts.open || tasks.filter((item) => item.status !== "DONE").length} />
        <Stat label="High Priority" value={counts.high || tasks.filter((item) => item.priority === "HIGH").length} />
        <Stat label="Due Soon" value={counts.dueSoon || 0} />
        <Stat label="Messages" value={messages.length} />
        <Stat label="Pinned" value={messages.filter((item) => item.isPinned).length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Create Task"
          subtitle="Manual task assignment for members."
          className="xl:col-span-6"
          right={<DotTag tone="warn">Action</DotTag>}
        >
          <div className="grid gap-2">
            <input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Task title"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <input
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Task description"
              disabled={!canManage}
              className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{ borderColor: adminCardBorder }}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                disabled={!canManage}
                className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              <input
                type="datetime-local"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
                disabled={!canManage}
                className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              />
              <select
                value={taskAssignee}
                onChange={(event) => setTaskAssignee(event.target.value)}
                disabled={!canManage}
                className="rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                style={{ borderColor: adminCardBorder }}
              >
                <option value="">Unassigned</option>
                {memberOptions.map((option) => (
                  <option key={option.userId} value={option.userId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onCreateTask}
              disabled={!canManage || busy || !taskTitle.trim()}
              className="rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: `1px solid ${adminCardBorder}`,
              }}
            >
              {busy ? "Saving..." : "Create Task"}
            </button>
          </div>
        </Section>

        <Section
          title="Broadcast Message"
          subtitle="Create announcement in operations feed."
          className="xl:col-span-6"
          dark
          right={<DotTag tone="warn">Action</DotTag>}
        >
          <div className="grid gap-2">
            <input
              value={msgTitle}
              onChange={(event) => setMsgTitle(event.target.value)}
              placeholder="Message title"
              disabled={!canManage}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none disabled:opacity-60"
            />
            <textarea
              value={msgBody}
              onChange={(event) => setMsgBody(event.target.value)}
              placeholder="Message body"
              disabled={!canManage}
              rows={3}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none disabled:opacity-60"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={msgTone}
                onChange={(event) => setMsgTone(event.target.value as "default" | "warn" | "ok" | "danger")}
                disabled={!canManage}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none disabled:opacity-60"
              >
                <option value="default">default</option>
                <option value="warn">warn</option>
                <option value="ok">ok</option>
                <option value="danger">danger</option>
              </select>
              <select
                value={msgAudience}
                onChange={(event) => setMsgAudience(event.target.value as "ALL" | "STAFF" | "PLAYERS")}
                disabled={!canManage}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none disabled:opacity-60"
              >
                <option value="ALL">ALL</option>
                <option value="STAFF">STAFF</option>
                <option value="PLAYERS">PLAYERS</option>
              </select>
              <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                <input
                  type="checkbox"
                  checked={msgPinned}
                  onChange={(event) => setMsgPinned(event.target.checked)}
                  disabled={!canManage}
                />
                Pin message
              </label>
            </div>
            <button
              type="button"
              onClick={onCreateMessage}
              disabled={!canManage || busy || !msgTitle.trim() || !msgBody.trim()}
              className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-[rgb(var(--primary-2))] transition disabled:opacity-60"
            >
              {busy ? "Publishing..." : "Publish Message"}
            </button>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Task Board" subtitle="Update status, assignee, and priority for manual tasks." className="xl:col-span-7">
          {!tasks.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">No tasks available.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border bg-white/75 px-3 py-3"
                  style={{ borderColor: adminCardBorder }}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-[rgb(var(--text))]">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <DotTag tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warn" : "ok"}>
                        {task.priority}
                      </DotTag>
                      <DotTag>{task.source || "SYSTEM"}</DotTag>
                    </div>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))]">{task.description || "No description"}</p>
                  <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                    Due {formatDateTime(task.dueAt)} | Assigned {task.assignedToName || "-"} | Created {task.createdByName || "-"}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <select
                      value={task.status}
                      onChange={(event) => onUpdateTask(task.id, { status: event.target.value as TaskStatus })}
                      disabled={busy || !canManage || !task.mutable}
                      className="rounded-xl border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                      style={{ borderColor: adminCardBorder }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PENDING">PENDING</option>
                      <option value="DONE">DONE</option>
                    </select>
                    <select
                      value={task.priority}
                      onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as TaskPriority })}
                      disabled={busy || !canManage || !task.mutable}
                      className="rounded-xl border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                      style={{ borderColor: adminCardBorder }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                    <select
                      value={task.assignedToUserId || ""}
                      onChange={(event) => onUpdateTask(task.id, { assignedToUserId: event.target.value })}
                      disabled={busy || !canManage || !task.mutable}
                      className="rounded-xl border bg-white/85 px-3 py-2 text-xs font-semibold outline-none disabled:opacity-60"
                      style={{ borderColor: adminCardBorder }}
                    >
                      <option value="">Unassigned</option>
                      {memberOptions.map((option) => (
                        <option key={option.userId} value={option.userId}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Message Board" subtitle="Pin/unpin and archive announcements." className="xl:col-span-5" dark>
          {!messages.length ? (
            <p className="text-sm text-white/75">No messages in feed.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <article key={message.id} className="rounded-xl border border-white/15 bg-white/5 px-3 py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{message.title}</p>
                    <div className="flex items-center gap-2">
                      <DotTag tone={message.tone}>{message.tone}</DotTag>
                      {message.isPinned ? <DotTag tone="warn">PINNED</DotTag> : null}
                    </div>
                  </div>
                  <p className="text-xs text-white/70">{message.subtitle}</p>
                  <p className="mt-1 text-[11px] text-white/55">
                    Audience {message.audience || "ALL"} | {formatDateTime(message.ts)}
                  </p>
                  {canManage && message.mutable ? (
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateMessage(message.id, { isPinned: !message.isPinned })}
                        disabled={busy}
                        className="rounded-full border bg-white/85 px-3 py-1 text-xs font-extrabold text-[rgb(var(--primary-2))] disabled:opacity-60"
                        style={{ borderColor: "rgba(255,255,255,.45)" }}
                      >
                        {message.isPinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateMessage(message.id, { isActive: false })}
                        disabled={busy}
                        className="rounded-full border bg-white/85 px-3 py-1 text-xs font-extrabold text-rose-700 disabled:opacity-60"
                        style={{ borderColor: "rgba(255,255,255,.45)" }}
                      >
                        Archive
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Completion Trend" subtitle="Last 7 days completion activity." className="xl:col-span-7">
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <Stat label="Completion Rate" value={`${overallCompletionRate}%`} />
            <Stat label="Done Tasks" value={tasks.filter((task) => task.status === "DONE").length} />
            <Stat label="Pending Tasks" value={tasks.filter((task) => task.status !== "DONE").length} />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrend}>
                <CartesianGrid stroke="rgba(20,24,32,.12)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${adminCardBorder}`,
                    background: "rgba(255,255,255,.92)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="rgba(var(--primary-2), .82)"
                  fill="rgba(var(--primary-2), .18)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="done"
                  stroke="rgba(var(--primary), .95)"
                  fill="rgba(var(--primary), .26)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Role Workload Split" subtitle="Open task pressure by assignee role." className="xl:col-span-5" dark>
          {workloadByRole.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadByRole}>
                  <CartesianGrid stroke="rgba(255,255,255,.18)" strokeDasharray="3 3" />
                  <XAxis dataKey="role" tick={{ fontSize: 11, fill: "rgba(255,255,255,.78)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,.78)" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.25)",
                      background: "rgba(18,22,30,.88)",
                    }}
                    labelStyle={{ color: "white" }}
                  />
                  <Bar dataKey="open" fill="rgba(var(--primary), .88)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="high" fill="rgba(244,63,94,.78)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-white/70">No workload split available yet.</p>
          )}
        </Section>
      </div>

      <Section title="Message Engagement Proxy" subtitle="Estimated impact score from audience, priority tone, pin, and recency.">
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Avg Proxy Score" value={avgMessageScore} />
          <Stat label="Pinned Messages" value={messages.filter((item) => item.isPinned).length} />
          <Stat label="Audience ALL" value={messages.filter((item) => item.audience === "ALL").length} />
        </div>
        {!messageEngagement.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No message analytics available.</p>
        ) : (
          <div className="space-y-2">
            {messageEngagement.slice(0, 8).map((item) => (
              <article
                key={`eng-${item.id}`}
                className="rounded-2xl border bg-white/76 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <DotTag tone={item.tone}>{item.tone}</DotTag>
                    <DotTag>{item.score}</DotTag>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, item.score)}%`,
                      background:
                        "linear-gradient(90deg, rgba(var(--primary),.88), rgba(var(--primary-2),.68))",
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                  Audience {item.audience || "ALL"} | {formatDateTime(item.ts)}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

