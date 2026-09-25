import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

type Task = { title: string; time: string; done?: boolean };

const pill = (active: boolean) =>
  [
    "rounded-full px-4 py-2 text-xs font-semibold transition",
    active ? "text-[rgb(var(--primary-2))]" : "text-[rgb(var(--text))] hover:bg-black/5",
  ].join(" ");

export default function PlayerDashboard() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Top “tabs” like reference (Interviews / Hired / Project time)
  const [tab, setTab] = useState<"Readiness" | "Matches" | "Training">("Readiness");

  const kpis = useMemo(
    () => [
      { value: "78", label: "Sessions" },
      { value: "56", label: "Minutes" },
      { value: "203", label: "Actions" },
    ],
    []
  );

  const tasks: Task[] = [
    { title: "Video Review", time: "Today • 7:30 PM", done: true },
    { title: "Team Meeting", time: "Tomorrow • 10:00 AM", done: true },
    { title: "GPS Upload", time: "Tomorrow • 2:00 PM" },
    { title: "Set Piece Walkthrough", time: "Fri • 6:00 PM" },
    { title: "Nutrition Check-in", time: "Sat • 9:00 AM" },
  ];

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(".enter", { opacity: 0, y: 14 });

      gsap.to(".enter", {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
      });

      gsap.fromTo(
        ".ringSweep",
        { strokeDashoffset: 220 },
        { strokeDashoffset: 40, duration: 1.1, ease: "power2.out", delay: 0.2 }
      );

      gsap.fromTo(
        ".barGrow",
        { scaleY: 0.2, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.8, ease: "power3.out", stagger: 0.05, delay: 0.25 }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [tab]);

  return (
    <div ref={rootRef} className="w-full">
      {/* Title row like reference */}
      <div className="enter mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-[rgb(var(--muted))]">Welcome in,</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Player Dashboard
          </h1>

          {/* Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTab("Readiness")}
              className={pill(tab === "Readiness")}
              style={{
                background: tab === "Readiness" ? "rgba(var(--primary), .45)" : "transparent",
                border: "1px solid rgb(var(--border))",
              }}
            >
              Readiness
            </button>
            <button
              onClick={() => setTab("Matches")}
              className={pill(tab === "Matches")}
              style={{
                background: tab === "Matches" ? "rgba(var(--primary), .45)" : "transparent",
                border: "1px solid rgb(var(--border))",
              }}
            >
              Matches
            </button>
            <button
              onClick={() => setTab("Training")}
              className={pill(tab === "Training")}
              style={{
                background: tab === "Training" ? "rgba(var(--primary), .45)" : "transparent",
                border: "1px solid rgb(var(--border))",
              }}
            >
              Training
            </button>

            {/* Long “progress” track like reference */}
            <div
              className="ml-0 mt-2 h-3 w-full overflow-hidden rounded-full border bg-white/60 sm:ml-3 sm:mt-0 sm:h-3 sm:w-[420px]"
              style={{ borderColor: "rgb(var(--border))" }}
              aria-label="Weekly progress track"
            >
              <div
                className="h-full"
                style={{
                  width: tab === "Readiness" ? "65%" : tab === "Matches" ? "42%" : "78%",
                  background:
                    "repeating-linear-gradient(135deg, rgba(var(--primary-2),.25) 0 8px, rgba(var(--primary-2),.12) 8px 16px)",
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI numbers (top-right in reference) */}
        <div className="enter grid grid-cols-3 gap-4 rounded-2xl border bg-white/55 p-3 backdrop-blur sm:gap-6 sm:p-4"
             style={{ borderColor: "rgb(var(--border))" }}>
          {kpis.map((k) => (
            <div key={k.label} className="text-center">
              <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{k.value}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN GRID — matches reference layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT SIDEBAR COLUMN */}
        <div className="enter lg:col-span-3">
          <div className="grid gap-4">
            {/* Profile card */}
            <div
              className="relative overflow-hidden rounded-[26px] border bg-white/70 p-4 backdrop-blur"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(260px 180px at 30% 20%, rgba(var(--primary),.35), transparent 60%)",
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className="h-16 w-16 rounded-2xl border bg-white/70"
                     style={{ borderColor: "rgb(var(--border))" }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Arjun Sen</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Right Wing • First Team</p>
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <SmallStat label="Match Bonus" value="₹12,000" />
                <SmallStat label="Availability" value="Clear" />
              </div>
            </div>

            {/* Accordion blocks like reference */}
            <Accordion title="Recovery & Wellness">
              <Row label="Sleep" value="7h 20m" />
              <Row label="HRV" value="Good" />
              <Row label="Soreness" value="Low" />
            </Accordion>

            <Accordion title="Wearables">
              <Row label="GPS" value="Connected" />
              <Row label="Heart Rate" value="Live" />
              <Row label="Steps" value="11,240" />
            </Accordion>

            <Accordion title="Contract Summary">
              <Row label="Type" value="Pro" />
              <Row label="Expires" value="Jun 2027" />
              <Row label="Bonuses" value="Active" />
            </Accordion>
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className="lg:col-span-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Progress card (mini bars like reference) */}
            <Card title="Progress">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">6.1h</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Training time this week</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "rgba(var(--primary), .45)",
                    color: "rgb(var(--primary-2))",
                    border: "1px solid rgb(var(--border))",
                  }}
                >
                  +12%
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                {[18, 42, 26, 60, 34, 78, 52].map((h, i) => (
                  <div
                    key={i}
                    className="barGrow w-2 rounded-full"
                    style={{
                      height: `${h}px`,
                      background: i === 5 ? "rgb(var(--primary))" : "rgba(var(--primary-2), .18)",
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-[rgb(var(--muted))]">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </Card>

            {/* Time tracker card (ring like reference) */}
            <Card title="Session Timer" right={<IconBtn label="Play" />}>
              <div className="flex items-center justify-center py-2">
                <RingTimer />
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <IconBtn label="Pause" />
                <IconBtn label="Stop" />
              </div>
            </Card>

            {/* Big calendar strip (reference bottom center) */}
            <div className="enter sm:col-span-2">
              <div
                className="rounded-[26px] border bg-white/65 p-4 backdrop-blur"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">September 2024</p>
                  <div className="flex gap-2">
                    <TagPill text="Aug" />
                    <TagPill text="Sep" active />
                    <TagPill text="Oct" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] text-[rgb(var(--muted))]">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d}>{d}</div>)}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-2xl border bg-white/70"
                      style={{ borderColor: "rgb(var(--border))" }}
                    />
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  <EventChip
                    title="Weekly Team Sync"
                    sub="Discuss roles & match plan"
                    right="6:00 PM"
                  />
                  <EventChip
                    title="Matchday Walkthrough"
                    sub="Set pieces • pressing triggers"
                    right="Sat 4:00 PM"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT TASK PANEL (reference right column) */}
        <div className="enter lg:col-span-3">
          <div
            className="rounded-[26px] border bg-[rgb(var(--primary-2))]/90 p-4 text-white shadow-[0_25px_70px_rgba(20,24,32,0.25)]"
            style={{ borderColor: "rgba(255,255,255,.10)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">Weekly Tasks</p>
                <p className="text-xs opacity-80">Preparation checklist</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">
                2/8
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {tasks.map((t) => (
                <TaskRow key={t.title} task={t} />
              ))}
            </div>
          </div>

          {/* small card under like reference */}
          <div
            className="enter mt-4 rounded-[26px] border bg-white/70 p-4 backdrop-blur"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <p className="text-sm font-bold">Onboarding</p>
            <p className="text-xs text-[rgb(var(--muted))]">Player setup progress</p>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-full rounded-full bg-black/5">
                <div
                  className="h-2 rounded-full"
                  style={{ width: "58%", background: "rgb(var(--primary))" }}
                />
              </div>
              <p className="text-xs font-semibold">18%</p>
            </div>

            <div className="mt-3 grid gap-2">
              <MiniPill label="KYC Verified" ok />
              <MiniPill label="Medical Baseline" ok />
              <MiniPill label="Kit Allocation" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- small components ---------------- */

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[26px] border bg-white/70 p-4 backdrop-blur transition will-change-transform hover:-translate-y-0.5"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/60 p-3"
         style={{ borderColor: "rgb(var(--border))" }}>
      <p className="text-[10px] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[26px] border bg-white/70 p-4 backdrop-blur"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        <span className="text-xs text-[rgb(var(--muted))]">▾</span>
      </div>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white/60 px-3 py-2"
         style={{ borderColor: "rgb(var(--border))" }}>
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}

function TagPill({ text, active }: { text: string; active?: boolean }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: active ? "rgba(var(--primary), .45)" : "rgba(255,255,255,.60)",
        border: "1px solid rgb(var(--border))",
        color: "rgb(var(--primary-2))",
      }}
    >
      {text}
    </span>
  );
}

function EventChip({ title, sub, right }: { title: string; sub: string; right: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white/75 px-3 py-3"
         style={{ borderColor: "rgb(var(--border))" }}>
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-[rgb(var(--muted))]">{sub}</p>
      </div>
      <span className="text-[10px] font-semibold text-[rgb(var(--muted))]">{right}</span>
    </div>
  );
}

function IconBtn({ label }: { label: string }) {
  return (
    <button
      className="rounded-full border bg-white/70 px-3 py-2 text-[10px] font-semibold text-[rgb(var(--text))] transition hover:bg-white"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      {label}
    </button>
  );
}

function RingTimer() {
  return (
    <div className="relative grid h-[170px] w-[170px] place-items-center">
      <svg width="170" height="170" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="70" stroke="rgba(0,0,0,.06)" strokeWidth="16" fill="none" />
        <circle
          className="ringSweep"
          cx="90"
          cy="90"
          r="70"
          stroke="rgb(var(--primary))"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="440"
          strokeDashoffset="220"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold tracking-tight">02:35</p>
        <p className="text-xs text-[rgb(var(--muted))]">Work time</p>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-xs">
          {task.done ? "✓" : "•"}
        </span>
        <div>
          <p className="text-xs font-bold">{task.title}</p>
          <p className="text-[10px] opacity-80">{task.time}</p>
        </div>
      </div>
      <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,.55)]" />
    </div>
  );
}

function MiniPill({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-3 py-2"
         style={{ borderColor: "rgb(var(--border))" }}>
      <p className="text-xs font-semibold">{label}</p>
      <span
        className="text-[10px] font-bold"
        style={{
          color: ok ? "rgb(16 185 129)" : "rgb(var(--muted))",
        }}
      >
        {ok ? "Done" : "Pending"}
      </span>
    </div>
  );
}