// src/components/ui/Sidebar.tsx
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  BellRing,
  CalendarClock,
  Home,
  LogOut,
  Target,
  Trophy,
} from "lucide-react";
import { clearAuth } from "../../utils/authStorage";
import { useDashboardRecent } from "../../hooks/useDashboard";
import ConfirmModal from "./ConfirmModal";

export type SidebarItem = {
  label: string;
  to: string;
  icon?: React.ReactNode;
};

export type SidebarUser = {
  fullName: string;
  userId: string;
  clubName: string;
  role?: string;
  position?: string;
  avatarUrl?: string;
  isCaptain?: boolean;
};

type MatchItem = {
  id: string;
  title?: string | null;
  opponent?: string | null;
  kickoffAt?: string | null;
  venue?: string | null;
};

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

function initials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "P";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export default function Sidebar({
  open,
  onClose,
  items,
  user,
}: {
  open: boolean;
  onClose: () => void;
  items: SidebarItem[];
  user: SidebarUser;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const loc = useLocation();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const hasActiveClub = Boolean(localStorage.getItem("activeClubId"));
  const recentQuery = useDashboardRecent(20, undefined, hasActiveClub);

  // Close drawer when route changes (mobile UX)
  useLayoutEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  // Mobile open/close animation
  useLayoutEffect(() => {
    if (!overlayRef.current || !mobileRef.current) return;

    if (open) {
      gsap.set(overlayRef.current, { pointerEvents: "auto" });
      gsap.set(mobileRef.current, { pointerEvents: "auto" });

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: "power2.out" }
      );

      gsap.fromTo(
        mobileRef.current,
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          if (!overlayRef.current) return;
          gsap.set(overlayRef.current, { pointerEvents: "none" });
        },
      });

      gsap.to(mobileRef.current, {
        x: -18,
        opacity: 0,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          if (!mobileRef.current) return;
          gsap.set(mobileRef.current, { pointerEvents: "none" });
        },
      });
    }
  }, [open]);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    clearAuth();
    navigate("/login", { replace: true });
  };

  const badge = useMemo(() => {
    const left = user.role ? user.role : "Player";
    const right = user.position ? `| ${user.position}` : "";
    return `${left} ${right}`.trim();
  }, [user.role, user.position]);

  const nextMatch = useMemo(() => {
    const data = (recentQuery.data || {}) as { matches?: MatchItem[] };
    const matches = data.matches ?? [];
    const now = Date.now();

    return (
      matches
        .filter((m) => {
          if (!m.kickoffAt) return false;
          const t = new Date(m.kickoffAt).getTime();
          return Number.isFinite(t) && t >= now;
        })
        .sort((a, b) => {
          const ta = new Date(a.kickoffAt || "").getTime();
          const tb = new Date(b.kickoffAt || "").getTime();
          return ta - tb;
        })[0] || null
    );
  }, [recentQuery.data]);

  const cardBorder = "rgba(15,23,42,.09)";
  const logoutBorder = "rgba(220, 38, 38, .42)";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(user.userId || ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback (older browsers)
      try {
        const el = document.createElement("textarea");
        el.value = String(user.userId || "");
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // ignore
      }
    }
  };

  const NavRow = ({ it }: { it: SidebarItem }) => (
    <NavLink
      key={it.to}
      to={it.to}
      className={({ isActive }) =>
        cx(
          "group relative flex items-center rounded-2xl px-3 py-2.5 text-sm",
          "transition-all duration-300 active:translate-y-[1px]",
          isActive ? "hover:-translate-y-[1px]" : "hover:-translate-y-[2px]",
          isActive ? "font-semibold" : "font-medium"
        )
      }
      style={({ isActive }) => ({
        background: isActive
          ? "linear-gradient(145deg, #3157ff, #7c5cff)"
          : "transparent",
        boxShadow: isActive
          ? "0 18px 34px rgba(49,87,255,.34), 0 8px 18px rgba(124,92,255,.22), inset 3px 3px 8px rgba(255,255,255,.18), inset -5px -5px 12px rgba(18,29,120,.24)"
          : undefined,
      })}
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              "absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all",
              isActive ? "h-8 w-1" : "h-0 w-1"
            )}
            style={{
              background: isActive ? "rgba(255,255,255,.82)" : "transparent",
            }}
          />

          <div className="relative flex min-w-0 items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl transition"
              style={{
                background: isActive
                  ? "rgba(255,255,255,.22)"
                  : "rgba(255,255,255,.46)",
                color: isActive ? "rgb(255 255 255)" : "rgb(var(--text))",
                boxShadow: isActive
                  ? "inset 3px 3px 7px rgba(18,29,120,.18), inset -3px -3px 7px rgba(255,255,255,.18)"
                  : "5px 5px 12px rgba(120,132,158,.13), -5px -5px 12px rgba(255,255,255,.86)",
              }}
            >
              {it.icon ?? (
                <Target size={15} strokeWidth={1.9} />
              )}
            </span>

            <span
              className="relative truncate"
              style={{
                color: isActive ? "rgb(255 255 255)" : "rgb(var(--text))",
              }}
            >
              {it.label}
            </span>
          </div>

        </>
      )}
    </NavLink>
  );

  const ProfileBlock = () => (
    <div className="mb-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--muted))]">
        <BellRing size={12} />
        EsportM
      </p>

      <div className="mt-2 flex items-center gap-2.5">
        <div
          className="grid h-10 w-10 place-items-center rounded-2xl text-xs font-extrabold text-[rgb(var(--text))]"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,.96), rgba(255,255,255,.68))",
            boxShadow: "5px 5px 14px rgba(15,23,42,.08), -5px -5px 14px rgba(255,255,255,.86)",
          }}
          title={user.fullName}
        >
          {initials(user.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold leading-tight text-[rgb(var(--text))]">
            {user.fullName}
          </p>

          {/* ID line with hover tooltip + copy button */}
          <div className="group/id mt-0.5 flex min-w-0 items-center gap-2">
            <p
              className="min-w-0 truncate text-[11px] text-[rgb(var(--muted))]"
              title={`${user.userId} | ${user.clubName}`}
            >
              <span className="font-semibold text-[rgb(var(--text))]">
                {user.userId}
              </span>{" "}
              | {user.clubName}
            </p>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={copyId}
                className={cx(
                  "opacity-0 group-hover/id:opacity-100 transition",
                  "rounded-full border px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text))]",
                  "hover:bg-white/70"
                )}
                style={{ borderColor: cardBorder }}
                aria-label="Copy user id"
              >
                {copied ? "Copied" : "Copy"}
              </button>

              {/* small tooltip on hover (optional) */}
              <div
                className={cx(
                  "pointer-events-none absolute right-0 top-full mt-2 w-max max-w-[260px]",
                  "opacity-0 group-hover/id:opacity-100 transition"
                )}
              >
                <div
                  className="rounded-xl border bg-white px-3 py-2 text-[11px] text-[rgb(var(--text))] shadow-lg"
                  style={{ borderColor: cardBorder }}
                >
                  <div className="font-semibold text-[rgb(var(--text))]">
                    Full ID
                  </div>
                  <div className="mt-0.5 break-all text-[rgb(var(--muted))]">
                    {user.userId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--text))]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
        >
          {badge}
        </span>
        <span
          className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--text))]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
        >
          Season: 24/25
        </span>
        {user.isCaptain ? (
          <span
            className="rounded-full border bg-[rgba(var(--primary),.30)] px-2.5 py-1 text-[10px] font-extrabold text-[rgb(var(--text))]"
            style={{ borderColor: "rgba(var(--primary), .55)" }}
          >
            Captain
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <div
          className="flex items-center justify-center gap-1 rounded-xl bg-white/45 px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text))]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
        >
          <BellRing size={11} />
          Live
        </div>
        <div
          className="flex items-center justify-center gap-1 rounded-xl bg-white/45 px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text))]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
        >
          <Target size={11} />
          Focus
        </div>
        <div
          className="flex items-center justify-center gap-1 rounded-xl bg-white/45 px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text))]"
          style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
        >
          <Trophy size={11} />
          Squad
        </div>
      </div>
    </div>
  );

  const NextMatchBlock = () => (
    <div className="mb-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--muted))]">
        <CalendarClock size={12} />
        Next Match
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-black/5">
        <div
          className="h-2 rounded-full"
          style={{ width: "62%", background: "rgb(var(--primary))" }}
        />
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {!hasActiveClub
          ? "No club assignment yet"
          : recentQuery.isLoading
          ? "Loading..."
          : recentQuery.isError
            ? "Unable to load"
            : nextMatch
              ? `${nextMatch.title || `vs ${nextMatch.opponent || "Opponent"}`} | ${
                  nextMatch.kickoffAt
                    ? new Date(nextMatch.kickoffAt).toLocaleString([], {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "TBD"
                }${nextMatch.venue ? ` | ${nextMatch.venue}` : ""}`
              : "No upcoming match"}
      </p>
    </div>
  );

  const BottomActions = () => (
    <div className="mt-auto grid gap-2">
      <button
        onClick={() => navigate("/")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/60 px-3 py-2 text-sm font-semibold text-[rgb(var(--text))] transition hover:bg-white/80"
        style={{
          boxShadow: "5px 5px 12px rgba(15,23,42,.08), -5px -5px 12px rgba(255,255,255,.82)",
        }}
        aria-label="Go home"
      >
        <Home size={14} />
        Home
      </button>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,.96), rgba(185,28,28,.93))",
          borderColor: logoutBorder,
          boxShadow: "0 14px 30px rgba(239,68,68,.30)",
        }}
        aria-label="Logout"
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* ===================== DESKTOP (inside canvas) ===================== */}
      <aside
        className={cx(
          "dashboard-sidebar relative hidden md:flex flex-col shrink-0",
          "w-[218px] min-w-[218px] max-w-[218px]",
          "max-h-[calc(100vh-11.5rem)]",
          "rounded-[24px] p-3.5"
        )}
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,.96), rgba(246,248,255,.78))",
          boxShadow:
            "14px 14px 34px rgba(15,23,42,.08), -14px -14px 34px rgba(255,255,255,.82)",
        }}
        aria-label="Sidebar"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-4 h-20 w-20 -translate-x-1/2 rounded-full bg-[rgba(var(--primary),.14)] blur-2xl" />
        </div>

        <ProfileBlock />
        <NextMatchBlock />

        <div className="hide-scrollbar -mx-4 min-h-0 flex-1 overflow-y-auto overflow-x-visible px-4 py-2">
          <nav className="flex flex-col gap-3 pb-2">
            {items.map((it) => (
              <NavRow key={it.to} it={it} />
            ))}
          </nav>
        </div>

        <BottomActions />
      </aside>

      {/* ===================== MOBILE overlay for drawer ===================== */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/20 opacity-0 pointer-events-none md:hidden"
      />

      {/* ===================== MOBILE drawer (GSAP) ===================== */}
      <aside
        ref={mobileRef}
        className={cx(
          "dashboard-sidebar fixed left-0 top-0 z-[90] h-full w-[260px] p-3.5 md:hidden",
          open ? "block" : "hidden"
        )}
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,.94), rgba(255,255,255,.78))",
          boxShadow: "16px 0 34px rgba(15,23,42,.12)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[rgba(var(--primary),.20)] blur-2xl" />
          <div className="absolute -left-12 bottom-14 h-28 w-28 rounded-full bg-[rgba(var(--primary),.16)] blur-2xl" />
        </div>

        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">{user.fullName}</p>

              {/* Mobile: show full id with copy button always */}
              <div className="mt-1 flex items-center gap-2">
                <p
                  className="min-w-0 truncate text-xs text-[rgb(var(--muted))]"
                  title={`${user.userId} | ${user.clubName}`}
                >
                  <span className="font-semibold text-[rgb(var(--text))]">
                    {user.userId}
                  </span>{" "}
                  | {user.clubName}
                </p>

                <button
                  type="button"
                  onClick={copyId}
                  className="shrink-0 rounded-full bg-white/60 px-2 py-1 text-[10px] font-semibold text-[rgb(var(--text))] hover:bg-white/80"
                  style={{ boxShadow: "inset 2px 2px 5px rgba(15,23,42,.05), inset -2px -2px 5px rgba(255,255,255,.8)" }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/60 px-3 py-2 text-xs font-semibold text-[rgb(var(--text))] hover:bg-white/80"
              style={{ boxShadow: "4px 4px 10px rgba(15,23,42,.07), -4px -4px 10px rgba(255,255,255,.8)" }}
            >
              Close
            </button>
          </div>

          <NextMatchBlock />

          <div className="hide-scrollbar -mx-4 min-h-0 flex-1 overflow-y-auto overflow-x-visible px-4 py-2">
            <nav className="flex flex-col gap-3 pb-2">
              {items.map((it) => (
                <NavRow key={it.to} it={it} />
              ))}
            </nav>
          </div>

          <BottomActions />
        </div>
      </aside>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
