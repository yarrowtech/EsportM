import { type ReactNode } from "react";
import {
  BarChart3,
  Clock3,
  Goal,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

export const adminCardBorder = "rgba(255,255,255,.54)";
export const adminCardBg =
  "linear-gradient(145deg, rgba(255,255,255,.86), rgba(236,241,248,.72))";
export const adminSoftBg =
  "linear-gradient(145deg, rgba(255,255,255,.92), rgba(236,241,248,.76))";
export const adminDarkBg =
  "linear-gradient(145deg, rgba(255,255,255,.90), rgba(232,238,248,.76))";
export const adminGlassShadow =
  "20px 20px 48px rgba(120,132,158,.24), -20px -20px 48px rgba(255,255,255,.98)";
const adminInsetShadow =
  "inset 8px 8px 18px rgba(120,132,158,.16), inset -8px -8px 18px rgba(255,255,255,.90)";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDateTime(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function formatDate(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function formatCountdown(input?: string | null) {
  if (!input) return "No kickoff time";
  const target = new Date(input).getTime();
  if (!Number.isFinite(target)) return "No kickoff time";
  const diff = target - Date.now();
  if (diff <= 0) return "Live or completed";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function PageWrap({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-4 p-3 sm:space-y-5 sm:p-5">
      {children}
    </div>
  );
}

export function Hero({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="neu-surface relative mb-1 overflow-hidden rounded-[28px] px-5 py-4 sm:flex sm:items-start sm:justify-between sm:px-6"
      style={{
        background:
          "radial-gradient(520px 180px at 76% 12%, rgba(139,92,246,.20), transparent 62%), linear-gradient(145deg, rgba(255,255,255,.88), rgba(234,240,249,.76))",
        boxShadow: adminGlassShadow,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
          Dashboard
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-[1.05] tracking-normal text-[rgb(var(--text))] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-[rgb(var(--muted))] sm:text-base">{subtitle}</p>
      </div>
      {right ? <div className="relative mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:justify-end">{right}</div> : null}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  right,
  children,
  dark = false,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cx("neu-surface relative overflow-hidden rounded-[26px] p-4 sm:p-5", className)}
      style={{
        background: dark
          ? adminDarkBg
          : "linear-gradient(145deg, rgba(255,255,255,.88), rgba(235,241,249,.76))",
        boxShadow: adminGlassShadow,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className={cx(
              "text-base font-extrabold tracking-normal",
              dark ? "text-[rgb(var(--text))]" : "text-[rgb(var(--text))]"
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cx(
                "mt-1 text-xs font-medium",
                dark ? "text-[rgb(var(--muted))]" : "text-[rgb(var(--muted))]"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {right}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  const visual = statVisual(label);

  return (
    <article
      className="neu-surface group relative min-w-0 overflow-hidden rounded-[22px] px-4 py-4 transition-all duration-300 hover:-translate-y-1 active:translate-y-[1px]"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,.90), rgba(235,241,249,.78))",
        boxShadow: adminGlassShadow,
      }}
    >
      <div
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full"
        style={{ background: visual.bg, color: visual.color, boxShadow: adminInsetShadow }}
        aria-hidden="true"
      >
        {visual.icon}
      </div>
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
        style={{ background: visual.bg }}
      />
      <p className="relative pr-12 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">{label}</p>
      <p className="relative mt-3 text-3xl font-extrabold leading-none tracking-normal text-[rgb(var(--text))] [overflow-wrap:anywhere] break-words">
        {value}
      </p>
      {hint ? <p className="relative mt-1 text-xs font-medium text-[rgb(var(--muted))]">{hint}</p> : null}
      <div className="relative mt-4 flex h-7 items-end gap-1.5">
        {[34, 54, 76, 50, 88, 42, 66].map((height, index) => (
          <span
            key={index}
            className="w-1.5 rounded-full"
            style={{
              height: `${height}%`,
              background: index % 3 === 0 ? visual.color : index % 3 === 1 ? `${visual.color}99` : `${visual.color}55`,
            }}
          />
        ))}
      </div>
    </article>
  );
}

function statVisual(label: string) {
  const text = label.toLowerCase();
  if (text.includes("goal")) {
    return { icon: <Goal size={20} />, color: "#22c55e", bg: "rgba(34,197,94,.13)" };
  }
  if (text.includes("assist")) {
    return { icon: <Sparkles size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,.13)" };
  }
  if (text.includes("minute") || text.includes("time")) {
    return { icon: <Clock3 size={20} />, color: "#f97316", bg: "rgba(249,115,22,.13)" };
  }
  if (text.includes("injur") || text.includes("medical") || text.includes("readiness")) {
    return { icon: <HeartPulse size={20} />, color: "#10b981", bg: "rgba(16,185,129,.13)" };
  }
  if (text.includes("match") || text.includes("fixture")) {
    return { icon: <Trophy size={20} />, color: "#3157ff", bg: "rgba(49,87,255,.13)" };
  }
  if (text.includes("squad") || text.includes("player")) {
    return { icon: <ShieldCheck size={20} />, color: "#06b6d4", bg: "rgba(6,182,212,.13)" };
  }
  if (text.includes("rate") || text.includes("avg") || text.includes("/")) {
    return { icon: <Target size={20} />, color: "#14b8a6", bg: "rgba(20,184,166,.13)" };
  }
  return { icon: <BarChart3 size={20} />, color: "#3157ff", bg: "rgba(49,87,255,.13)" };
}

export function DotTag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const styleByTone = {
    default: {
      bg: "rgba(255,255,255,.65)",
      border: adminCardBorder,
      text: "rgb(var(--text))",
      dot: "rgba(var(--primary), .95)",
    },
    ok: {
      bg: "rgba(16,185,129,.14)",
      border: "rgba(16,185,129,.35)",
      text: "rgb(5 120 85)",
      dot: "rgb(16 185 129)",
    },
    warn: {
      bg: "rgba(var(--primary), .20)",
      border: "rgba(var(--primary), .38)",
      text: "rgb(var(--primary-2))",
      dot: "rgb(var(--primary))",
    },
    danger: {
      bg: "rgba(244,63,94,.14)",
      border: "rgba(244,63,94,.28)",
      text: "rgb(190 24 93)",
      dot: "rgb(244 63 94)",
    },
  } as const;

  const style = styleByTone[tone];

  return (
    <span
      className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold"
      style={{
        background: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      <span className="max-w-full break-words">{children}</span>
    </span>
  );
}

export function Divider() {
  return <div className="h-px w-full" style={{ background: "rgba(var(--primary-2), .11)" }} />;
}
