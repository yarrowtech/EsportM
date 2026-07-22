import { type CSSProperties, type ReactNode } from "react";
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

export const adminCardBorder = "rgb(var(--border) / .14)";
export const adminCardBg = "rgb(var(--bg))";
export const adminSoftBg = "rgb(var(--bg))";
export const adminDarkBg = "rgb(var(--bg))";
export const adminGlassShadow = "var(--neu-raised)";
const adminInsetShadow = "var(--neu-inset)";

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
    <div className="dashboard-page mx-auto w-full max-w-[1180px] space-y-3 p-2 sm:p-3">
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
      className="neu-surface relative mb-1 overflow-hidden rounded-[20px] px-4 py-3 sm:flex sm:items-start sm:justify-between sm:px-5 sm:py-4"
      style={{
        background: adminCardBg,
        boxShadow: adminGlassShadow,
      }}
    >
      <div className="relative min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
          Dashboard
        </p>
        <h1 className="mt-1.5 max-w-3xl text-2xl font-extrabold leading-tight tracking-normal text-[rgb(var(--text))] sm:text-3xl">
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
      className={cx("neu-surface relative overflow-hidden rounded-[20px] p-3 sm:p-4", className)}
      style={{
        background: dark ? adminDarkBg : adminCardBg,
        boxShadow: adminGlassShadow,
      }}
    >
      <div className="relative mb-3 flex flex-wrap items-start justify-between gap-3">
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
      className="neu-surface neu-stat-tile group relative min-w-0 overflow-hidden rounded-[18px] px-3 py-3"
      style={{
        "--stat-tile-bg": visual.tileBg,
        boxShadow: adminGlassShadow,
      } as CSSProperties}
    >
      <div
        className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full"
        style={{ color: visual.color, boxShadow: adminInsetShadow }}
        aria-hidden="true"
      >
        {visual.icon}
      </div>
      <p className="relative pr-12 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">{label}</p>
      <p className="relative mt-2.5 text-2xl font-extrabold leading-none tracking-normal text-[rgb(var(--text))] [overflow-wrap:anywhere] break-words">
        {value}
      </p>
      {hint ? <p className="relative mt-1 text-xs font-medium text-[rgb(var(--muted))]">{hint}</p> : null}
    </article>
  );
}

function statVisual(label: string) {
  const text = label.toLowerCase();
  const lavender = {
    color: "#7c5cff",
    tileBg: "linear-gradient(145deg, rgba(230,225,255,.76), rgba(211,204,246,.58))",
  };
  const red = {
    color: "#ef4444",
    tileBg: "linear-gradient(145deg, rgba(255,222,226,.78), rgba(247,190,198,.56))",
  };
  const green = {
    color: "#16a34a",
    tileBg: "linear-gradient(145deg, rgba(218,246,228,.78), rgba(187,229,203,.56))",
  };

  const isRed =
    text.includes("minute") ||
    text.includes("time") ||
    text.includes("injur") ||
    text.includes("medical") ||
    text.includes("cancel") ||
    text.includes("high") ||
    text.includes("not fit") ||
    text.includes("due");
  const isGreen =
    text.includes("goal") ||
    text.includes("readiness") ||
    text.includes("fit") ||
    text.includes("done") ||
    text.includes("complete") ||
    text.includes("rate") ||
    text.includes("avg") ||
    text.includes("/");
  const tone = isRed ? red : isGreen ? green : lavender;

  if (text.includes("goal")) return { icon: <Goal size={20} />, ...tone };
  if (text.includes("assist")) return { icon: <Sparkles size={20} />, ...tone };
  if (text.includes("minute") || text.includes("time")) return { icon: <Clock3 size={20} />, ...tone };
  if (text.includes("injur") || text.includes("medical") || text.includes("readiness")) return { icon: <HeartPulse size={20} />, ...tone };
  if (text.includes("match") || text.includes("fixture")) return { icon: <Trophy size={20} />, ...tone };
  if (text.includes("squad") || text.includes("player")) return { icon: <ShieldCheck size={20} />, ...tone };
  if (text.includes("rate") || text.includes("avg") || text.includes("/")) return { icon: <Target size={20} />, ...tone };
  return { icon: <BarChart3 size={20} />, ...tone };
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
      bg: "rgb(var(--bg))",
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
      border: "rgb(var(--primary) / .22)",
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
