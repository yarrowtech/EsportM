import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
    Activity,
    BellRing,
    ChartNoAxesCombined,
    Home,
    Layers3,
    LogOut,
    MessageSquare,
    Settings,
    ShieldCheck,
    Sparkles,
    Users2,
} from "lucide-react";
import type { SubRole } from "../../../api/admin.api";
import { clearAuth } from "../../../utils/authStorage";
import ConfirmModal from "../ConfirmModal";

export type AdminSidebarUser = {
    fullName: string;
    userId: string;
    role: "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER";
    subRoles?: SubRole[];
    clubName: string;
    clubId?: string;
};

function cx(...s: Array<string | false | undefined>) {
    return s.filter(Boolean).join(" ");
}

function initials(name: string) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "A";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
}

const cardBorder = "rgb(var(--border) / .1)";
const logoutBorder = "rgba(220, 38, 38, .42)";

const adminNav = [
    { label: "Overview", to: "/admin" },
    { label: "Members", to: "/admin/members" },
    { label: "Squads", to: "/admin/squads" },
    { label: "Schedule", to: "/admin/matches" },
    { label: "Operations", to: "/admin/operations" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Analytics", to: "/admin/analytics" },
    { label: "Settings", to: "/admin/settings" },
];

function navGlyph(label: string, to: string): ReactNode {
    const key = `${label}:${to}`.toLowerCase();
    if (key.includes("overview") || to === "/admin") return <ShieldCheck size={14} />;
    if (key.includes("member")) return <Users2 size={14} />;
    if (key.includes("squad")) return <Layers3 size={14} />;
    if (key.includes("match")) return <Activity size={14} />;
    if (key.includes("operation")) return <Sparkles size={14} />;
    if (key.includes("message")) return <MessageSquare size={14} />;
    if (key.includes("analytic")) return <ChartNoAxesCombined size={14} />;
    if (key.includes("setting")) return <Settings size={14} />;
    return <Sparkles size={14} />;
}

export default function AdminSidebar({
    open,
    onClose,
    user,
    navItems,
    canManageClubData,
    clubs,
    clubId,
    onChangeClub,
    stats,
}: {
    open: boolean;
    onClose: () => void;
    user: AdminSidebarUser;
    navItems?: Array<{ label: string; to: string }>;
    canManageClubData?: boolean;
    clubs: Array<{ id: string; name: string; slug: string }>;
    clubId: string;
    onChangeClub: (id: string) => void;
    stats: { players: number; squads: number; matches: number };
}) {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const mobileRef = useRef<HTMLDivElement | null>(null);
    const loc = useLocation();
    const navigate = useNavigate();

    const [copied, setCopied] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    useLayoutEffect(() => {
        if (open) onClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.pathname]);

    // âœ… FIXED GSAP effect: cleanup returns void (ctx.revert)
    useLayoutEffect(() => {
        if (!overlayRef.current || !mobileRef.current) return;

        const overlayEl = overlayRef.current;
        const drawerEl = mobileRef.current;

        const ctx = gsap.context(() => {
            if (open) {
                gsap.set(overlayEl, { pointerEvents: "auto" });
                gsap.set(drawerEl, { pointerEvents: "auto" });

                gsap.fromTo(
                    overlayEl,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.18, ease: "power2.out" }
                );

                gsap.fromTo(
                    drawerEl,
                    { x: -18, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.25, ease: "power3.out" }
                );
            } else {
                gsap.to(overlayEl, {
                    opacity: 0,
                    duration: 0.14,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(overlayEl, { pointerEvents: "none" }); // âœ… no return
                    },
                });

                gsap.to(drawerEl, {
                    x: -18,
                    opacity: 0,
                    duration: 0.14,
                    ease: "power2.in",
                    onComplete: () => {
                        gsap.set(drawerEl, { pointerEvents: "none" }); // âœ… no return
                    },
                });
            }
        });

        return () => {
            ctx.revert(); //returns void
        };
    }, [open]);

    const canManage = typeof canManageClubData === "boolean"
        ? canManageClubData
        : user.role === "ADMIN" || user.role === "MANAGER";
    const effectiveNav = navItems?.length ? navItems : adminNav;

    const shortId = useMemo(() => {
        const id = String(user.userId || "");
        if (id.length <= 10) return id;
        return `${id.slice(0, 6)}â€¦${id.slice(-4)}`;
    }, [user.userId]);

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(String(user.userId || ""));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 900);
        } catch {
            // Ignore clipboard failures.
        }
    };

    const handleLogout = () => {
        setLogoutConfirmOpen(true);
    };

    const confirmLogout = () => {
        setLogoutConfirmOpen(false);
        clearAuth();
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const NavRow = ({ label, to }: { label: string; to: string }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cx(
                    "group relative flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                    "transition-[box-shadow,transform] duration-150",
                    isActive && "font-extrabold"
                )
            }
            style={({ isActive }) => ({
                borderColor: isActive ? "rgb(var(--primary) / .34)" : cardBorder,
                background: isActive
                    ? "rgb(var(--primary))"
                    : "rgb(var(--bg))",
                boxShadow: isActive
                    ? "inset 7px 7px 14px rgb(var(--primary-2) / .14), inset -7px -7px 14px rgba(255,255,255,.34), -4px -4px 14px rgba(255,255,255,.88), 5px 6px 16px rgb(var(--shadow) / .22)"
                    : "var(--neu-raised-sm)",
            })}
        >
            {({ isActive }) => (
                <>
                    <div className="relative flex items-center gap-3">
                        <span
                            className="grid h-8 w-8 place-items-center rounded-lg border transition"
                            style={{
                                borderColor: isActive ? "rgb(var(--primary-2) / .16)" : cardBorder,
                                background: isActive ? "rgba(255,255,255,.38)" : "rgb(var(--bg))",
                                color: "rgb(var(--text))",
                                boxShadow: isActive ? "var(--neu-inset)" : "var(--neu-raised-sm)",
                            }}
                        >
                            {navGlyph(label, to)}
                        </span>

                        <span
                            className="relative"
                            style={{ color: "rgb(var(--text))" }}
                        >
                            {label}
                        </span>
                    </div>

                    <span
                        className="relative text-xs"
                        style={{ color: isActive ? "rgba(var(--primary-2), .86)" : "rgb(var(--muted))" }}
                    >
                        {"->"}
                    </span>

                    {isActive ? (
                        <Sparkles
                            size={12}
                            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-85"
                            color="rgb(var(--primary-2))"
                        />
                    ) : null}
                </>
            )}
        </NavLink>
    );

    const ProfileBlock = () => (
        <div className="mb-3">
            <p className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                <BellRing size={12} />
                Club Admin
            </p>

            <div className="mt-2 flex items-center gap-3">
                <div
                    className="grid h-10 w-10 place-items-center rounded-full border bg-[rgb(var(--bg))] text-xs font-extrabold"
                    style={{ borderColor: cardBorder, boxShadow: "var(--neu-raised-sm)" }}
                    title={user.fullName}
                >
                    {initials(user.fullName)}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold leading-tight">{user.fullName}</p>

                    <div className="mt-0.5 flex items-center gap-2">
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]" title={user.userId}>
                            {shortId}
                        </p>
                        <button
                            onClick={copyId}
                            className="rounded-full border bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold"
                            style={{ borderColor: cardBorder }}
                            title="Copy user id"
                        >
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <p className="truncate text-[11px] text-[rgb(var(--muted))]">{user.clubName}</p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}>
                    Role: <span className="font-extrabold">{user.role}</span>
                </span>

                <span className="rounded-full border bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}>
                    Players: <span className="font-extrabold">{stats.players}</span>
                </span>
                <span className="rounded-full border bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}>
                    Squads: <span className="font-extrabold">{stats.squads}</span>
                </span>
                <span className="rounded-full border bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold" style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}>
                    Matches: <span className="font-extrabold">{stats.matches}</span>
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <div
                    className="flex items-center justify-center gap-1 rounded-lg border bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-semibold"
                    style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}
                >
                    <Sparkles size={11} />
                    Live
                </div>
                <div
                    className="flex items-center justify-center gap-1 rounded-lg border bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-semibold"
                    style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}
                >
                    <Activity size={11} />
                    Ops
                </div>
                <div
                    className="flex items-center justify-center gap-1 rounded-lg border bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-semibold"
                    style={{ borderColor: cardBorder, boxShadow: "var(--neu-inset)" }}
                >
                    <ChartNoAxesCombined size={11} />
                    Trends
                </div>
            </div>

            <div className="mt-3">
                <select
                    value={clubId}
                    onChange={(e) => onChangeClub(e.target.value)}
                    className="w-full rounded-xl border bg-[rgb(var(--bg))] px-3 py-2 text-sm font-semibold outline-none"
                    style={{ borderColor: cardBorder }}
                    disabled={!canManage}
                    title={!canManage ? "No permission to manage club data" : "Select club"}
                >
                    {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    const BottomActions = () => (
        <div className="mt-auto grid gap-2">
            <button
                onClick={() => navigate("/")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border bg-[rgb(var(--bg))] px-3 py-2 text-sm font-semibold"
                style={{ borderColor: cardBorder }}
            >
                <Home size={14} />
                Home
            </button>

            <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold text-white transition hover:opacity-95"
                style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,.96), rgba(185,28,28,.93))",
                    borderColor: logoutBorder,
                    boxShadow: "0 14px 30px rgba(239,68,68,.30)",
                }}
            >
                <LogOut size={14} />
                Logout
            </button>
        </div>
    );

    return (
        <>
            <aside
                className={cx(
                    "dashboard-sidebar relative hidden max-h-[calc(100vh-11rem)] flex-col shrink-0 md:flex",
                    "w-[216px] min-w-[216px] max-w-[216px]",
                    "rounded-2xl border bg-[rgb(var(--bg))] p-3"
                )}
                style={{ borderColor: cardBorder, boxShadow: "var(--neu-raised)" }}
            >
                <ProfileBlock />

                <nav className="hide-scrollbar -mx-3 mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                    {effectiveNav.map((it) => (
                        <NavRow key={it.to} label={it.label} to={it.to} />
                    ))}
                </nav>

                <BottomActions />
            </aside>

            <div
                ref={overlayRef}
                onClick={onClose}
                className="fixed inset-0 z-[80] bg-black/20 opacity-0 pointer-events-none md:hidden"
            />

            <aside
                ref={mobileRef}
                className={cx(
                    "dashboard-sidebar fixed left-0 top-0 z-[90] h-full w-[280px] border-r bg-[rgb(var(--bg))] p-4 md:hidden",
                    open ? "block" : "hidden"
                )}
                style={{ borderColor: cardBorder, boxShadow: "var(--neu-raised)" }}
            >
                <div className="flex h-full flex-col">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-extrabold">Admin Menu</p>
                        <button
                            onClick={onClose}
                            className="rounded-full border bg-[rgb(var(--bg))] px-3 py-2 text-xs font-semibold"
                            style={{ borderColor: cardBorder }}
                        >
                            Close
                        </button>
                    </div>

                    <ProfileBlock />

                    <nav className="hide-scrollbar -mx-3 mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
                        {effectiveNav.map((it) => (
                            <NavRow key={it.to} label={it.label} to={it.to} />
                        ))}
                    </nav>

                    <BottomActions />
                </div>
            </aside>

            <ConfirmModal
                open={logoutConfirmOpen}
                title="Log out?"
                message="You will need to sign in again to access the admin area."
                confirmText="Logout"
                cancelText="Cancel"
                onCancel={() => setLogoutConfirmOpen(false)}
                onConfirm={confirmLogout}
            />
        </>
    );
}

