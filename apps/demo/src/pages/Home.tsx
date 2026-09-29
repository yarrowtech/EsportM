// import { Link, useNavigate } from "react-router-dom";
// import { useEffect, useMemo, useState } from "react";
// import NeuCard from "../components/NeuCard";
// import NeuButton from "../components/NeuButton";
// import { api } from "../api/axios";

// type User = {
//   id: string;
//   email: string;
//   fullName?: string | null;
// };

// export default function Home() {
//   const navigate = useNavigate();

//   const [user, setUser] = useState<User | null>(null);
//   const [loadingMe, setLoadingMe] = useState(false);

//   const token = useMemo(() => localStorage.getItem("token"), []);

//   useEffect(() => {
//     if (!token) return;

//     setLoadingMe(true);
//     api
//       .get("/me")
//       .then((res) => {
//         // ✅ backend returns { user: {...} }
//         const u = res?.data?.user;
//         if (!u) throw new Error("Invalid /me response");
//         setUser(u);
//       })
//       .catch(() => {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         setUser(null);
//       })
//       .finally(() => setLoadingMe(false));
//   }, [token]);

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//     navigate("/", { replace: true });
//   };

//   return (
//     <div className="min-h-screen bg-bg p-4 md:p-6">
//       <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
//         {/* Header */}
//         <NeuCard className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
//           <div>
//             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
//               Welcome to EsportM
//             </h1>
//             <p className="text-slate-600 mt-2">
//               AI-powered sports management system for clubs, players, and staff.
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center justify-end gap-3">
//             {!token ? (
//               <>
//                 <Link to="/login">
//                   <NeuButton className="min-w-[120px]">Login</NeuButton>
//                 </Link>
//                 <Link to="/register">
//                   <NeuButton className="min-w-[120px]">Register</NeuButton>
//                 </Link>
//               </>
//             ) : (
//               <>
//                 <div className="text-right">
//                   <p className="font-semibold text-slate-900">
//                     {loadingMe ? "Loading..." : user?.fullName || "User"}
//                   </p>
//                   <p className="text-sm text-slate-600">
//                     {loadingMe ? "Fetching profile" : user?.email || ""}
//                   </p>
//                 </div>

//                 <NeuButton
//                   onClick={() => navigate("/dashboard")}
//                   className="min-w-[140px]"
//                 >
//                   Open Dashboard
//                 </NeuButton>

//                 <NeuButton
//                   onClick={handleLogout}
//                   className="min-w-[120px] !text-red-600"
//                 >
//                   Logout
//                 </NeuButton>
//               </>
//             )}
//           </div>
//         </NeuCard>

//         {/* Modules */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Manage clubs, squads, matches, seasons, and member roles.
//             </p>
//             <Link to={token ? "/dashboard" : "/login"} className="mt-auto">
//               <NeuButton>{token ? "Go to Dashboard" : "Login to Access"}</NeuButton>
//             </Link>
//           </NeuCard>

//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">Stats</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Leaderboards, player summaries, match analytics and KPIs.
//             </p>
//             <Link to={token ? "/stats" : "/login"} className="mt-auto">
//               <NeuButton>{token ? "View Stats" : "Login to Access"}</NeuButton>
//             </Link>
//           </NeuCard>

//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">Marketplace</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Scouting, talent search, bids and contracts (coming next).
//             </p>
//             <Link to={token ? "/marketplace" : "/login"} className="mt-auto">
//               <NeuButton>{token ? "Explore" : "Login to Access"}</NeuButton>
//             </Link>
//           </NeuCard>

//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">Social</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Feed, posts, media uploads, and professional messaging.
//             </p>
//             <Link to={token ? "/social" : "/login"} className="mt-auto">
//               <NeuButton>{token ? "Open Social" : "Login to Access"}</NeuButton>
//             </Link>
//           </NeuCard>

//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">AI Analytics</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Strategy prediction, performance insights, and market value models.
//             </p>
//             <Link to={token ? "/ai" : "/login"} className="mt-auto">
//               <NeuButton>{token ? "View AI" : "Login to Access"}</NeuButton>
//             </Link>
//           </NeuCard>

//           {/* Optional quick actions */}
//           <NeuCard className="flex flex-col">
//             <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
//             <p className="text-sm text-slate-600 mb-5">
//               Create your first club, invite members, build squads and schedule matches.
//             </p>
//             <Link to={token ? "/dashboard" : "/register"} className="mt-auto">
//               <NeuButton>{token ? "Start Now" : "Create Account"}</NeuButton>
//             </Link>
//           </NeuCard>
//         </div>
//       </div>
//     </div>
//   );
// }


















import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import {
  BarChart2,
  BadgeIndianRupee,
  ShoppingBag,
  Users,
  Info,
  User,
  LogIn,
  LogOut,
  Search,
  Loader2,
} from "lucide-react";
import { api } from "../api/axios";
import { clearAuth, getAccessToken } from "../utils/authStorage";
import { resolveDashboardLanding } from "../utils/dashboardRouting";
import ConfirmModal from "../components/ui/ConfirmModal";
import Orb from "../components/Orb";

const LOGO_LIGHT_SRC = "/logo/logo-light.png";

// --- Types ---
type UserData = {
  id: string;
  email: string;
  fullName?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

type Membership = {
  primary?: "MEMBER" | "PLAYER" | "MANAGER" | "ADMIN";
  subRoles?: string[];
  clubId?: string;
};

type MePayload = {
  user?: UserData;
  memberships?: Membership[];
  activeMembership?: Membership | null;
  activeClubId?: string | null;
};

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function isAuthError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

export default function Home() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // reactive token
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  const [user, setUser] = useState<UserData | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [dashboardEntry, setDashboardEntry] = useState("/dashboard");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  // --- Fetch /auth/me when token exists ---
  useEffect(() => {
    if (!token) {
      setUser(null);
      setDashboardEntry("/dashboard");
      return;
    }

    setLoadingMe(true);
    api
      .get("/auth/me")
      .then((res) => {
        const payload = (res?.data || {}) as MePayload;
        const u = payload?.user as UserData | undefined;
        if (!u) throw new Error("Invalid /me response");
        setUser(u);

        const landing = resolveDashboardLanding(payload, localStorage.getItem("activeDashboardRole"));
        setDashboardEntry(landing.path);
        localStorage.setItem("activeDashboardRole", landing.dashboardRole);
        if (payload?.activeClubId) localStorage.setItem("activeClubId", payload.activeClubId);
      })
      .catch((error) => {
        if (isAuthError(error)) {
          clearAuth();
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setDashboardEntry("/dashboard");
          return;
        }
        console.error("Home /auth/me failed (non-auth):", error);
      })
      .finally(() => setLoadingMe(false));
  }, [token]);

  // --- Navigation rules ---
  const handleModuleNavigation = (path: string) => {
    if (path === "/pricing") return navigate("/pricing");
    if (!token) return navigate("/login");
    if (path === "/dashboard") return navigate(dashboardEntry);
    navigate(path);
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    clearAuth();
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/", { replace: true });
  };

  const searchCatalog = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        description: "Club workspace, roles and operations",
        keywords: ["club", "members", "admin", "operations", "home"],
      },
      {
        id: "ai",
        label: "AI Module",
        path: "/ai",
        description: "AI analytics and insights",
        keywords: ["insights", "analytics", "assistant", "model"],
      },
      {
        id: "marketplace",
        label: "Marketplace",
        path: "/marketplace",
        description: "Players, offers and hiring",
        keywords: ["transfer", "offers", "talent", "recruitment"],
      },
      {
        id: "social",
        label: "Social Feed",
        path: "/dashboard/social",
        description: "Posts, comments and reactions",
        keywords: ["feed", "posts", "media", "community"],
      },
      {
        id: "login",
        label: "Login",
        path: "/login",
        description: "Sign in to your account",
        keywords: ["signin", "auth", "access"],
      },
      {
        id: "register",
        label: "Register",
        path: "/register",
        description: "Create a new account",
        keywords: ["signup", "join", "create account"],
      },
    ],
    []
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = searchCatalog
      .map((item) => {
        const haystack = [item.label, item.description, item.path, ...item.keywords]
          .join(" ")
          .toLowerCase();

        if (!q) {
          if (!token && (item.path === "/dashboard" || item.path === "/dashboard/social")) {
            return null;
          }
          return { ...item, score: 1 };
        }

        if (!haystack.includes(q)) return null;

        let score = 1;
        if (item.label.toLowerCase().startsWith(q)) score += 6;
        if (item.path.toLowerCase().includes(q)) score += 4;
        if (item.description.toLowerCase().includes(q)) score += 2;
        if (item.keywords.some((k) => k.toLowerCase().includes(q))) score += 3;

        return { ...item, score };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .sort((a, b) => b.score - a.score);

    return base.slice(0, 6);
  }, [searchCatalog, searchQuery, token]);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchFocused) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchFocused]);

  const resolveSearchPath = (path: string) => {
    if (path === "/dashboard") return dashboardEntry;
    return path;
  };

  const handleSearchSelect = (path: string) => {
    const resolved = resolveSearchPath(path);
    if (resolved === "/login" || resolved === "/register") {
      navigate(resolved);
      return;
    }
    handleModuleNavigation(resolved);
  };

  const onSearchSubmit = () => {
    if (!searchResults.length) return;
    const next = searchResults[Math.max(0, Math.min(searchActiveIndex, searchResults.length - 1))];
    handleSearchSelect(next.path);
    setSearchFocused(false);
  };

  // --- GSAP animations (subtle, smooth) ---
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.set(".hs-card", { transformOrigin: "50% 50%" });

      gsap.fromTo(
        ".hs-sidebar",
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, ease: "power3.out" }
      );

      gsap.fromTo(
        ".hs-hero",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", delay: 0.05 }
      );

      gsap.fromTo(
        ".hs-right",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", delay: 0.12, stagger: 0.08 }
      );

      gsap.to(".hs-ringFloat", {
        y: -6,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(".hs-searchPulse", {
        scale: 1.02,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // --- Visual constants (match reference) ---
  const BG = "bg-[#E7E9FF]";
  const CARD = "bg-[#5F5EA6]";
  const CARD_DARK = "bg-[#6D6C87]";
  const BLACK_PILL = "bg-[#0B0B0B]";

  // --- Neumorphism ---
  const neuBtn = `
    transition-all duration-300 ease-out
    active:scale-[0.97]
    shadow-[6px_6px_14px_rgba(0,0,0,0.50),-6px_-6px_14px_rgba(255,255,255,0.65)]
    hover:shadow-[9px_9px_18px_rgba(0,0,0,0.14),-9px_-9px_18px_rgba(255,255,255,0.75)]
    active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.12),inset_-6px_-6px_12px_rgba(255,255,255,0.55)]
  `;

  const neuBtnSoft = `
    transition-all duration-300 ease-out
    active:scale-[0.97]
    shadow-[6px_6px_14px_rgba(0,0,0,0.16),-6px_-6px_14px_rgba(255,255,255,0.12)]
    hover:shadow-[9px_9px_18px_rgba(0,0,0,0.18),-9px_-9px_18px_rgba(255,255,255,0.14)]
    active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.10)]
  `;

  const neuBtnCta = `
    transition-all duration-300 ease-out
    shadow-[6px_6px_14px_rgba(0,0,0,0.50),-6px_-6px_14px_rgba(255,255,255,0.48)]
    hover:translate-y-[1px]
    hover:shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.11),inset_5px_5px_10px_rgba(255,255,255,0.40)]
    active:translate-y-[2px]
    active:shadow-[inset_-7px_-7px_14px_rgba(0,0,0,0.13),inset_7px_7px_14px_rgba(255,255,255,0.44)]
  `;

  const pillIconBtn = cx(
    "w-11 h-11 rounded-2xl flex items-center justify-center",
    "text-white/90 hover:text-white",
    "transition-colors duration-200"
  );

  const userLabel = useMemo(() => {
    if (!user) return "";
    return user.fullName?.trim() ? user.fullName : user.email;
  }, [user]);

  const renderSidebarIcon = ({
    label,
    onClick,
    children,
    className,
  }: {
    label: string;
    onClick: () => void;
    children: ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className={cx(pillIconBtn, "group relative", className)}
    >
      {children}
      <span
        className={cx(
          "pointer-events-none absolute z-[140] whitespace-nowrap rounded-md border border-white/20 bg-black/90 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-all duration-150",
          "left-1/2 top-[calc(100%+8px)] -translate-x-1/2",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
          "group-hover:translate-y-0 group-focus-visible:translate-y-0",
          "translate-y-1",
          "lg:left-[calc(100%+10px)] lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:group-hover:translate-x-0 lg:group-focus-visible:translate-x-0"
        )}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div ref={rootRef} className={cx("min-h-screen w-full", BG, "text-white overflow-x-hidden")}>
      {/* page padding */}
      <div className="mx-auto max-w-[1500px] px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-10">
        {/* ✅ STAGE: vertically center the entire block like target UI */}
        <div className="lg:min-h-[calc(100vh-80px)] lg:flex lg:items-center">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 w-full">
            {/* LEFT SIDEBAR */}
            <aside className="hs-sidebar relative z-[80] shrink-0">
              {/* top icon pill */}
              <div
                className={cx(
                  "hs-card",
                  BLACK_PILL,
                  "rounded-[20.2rem]",
                  "p-3 sm:p-3.5",
                  "lg:h-[30rem]",
                  "w-full lg:w-[92px]",
                  "flex lg:flex-col items-center justify-between",
                  "gap-2 lg:gap-8",
                  "shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                )}
              >
                {renderSidebarIcon({
                  label: "AI",
                  onClick: () => handleModuleNavigation("/ai"),
                  className: "h-12 w-12",
                  children: (
                    <div className="h-10 w-10 scale-[1.45] overflow-hidden rounded-full saturate-[1.45] contrast-[1.18] brightness-[1.18] ">
                      <Orb
                        hoverIntensity={1}
                        rotateOnHover={false}
                        hue={0}
                        forceHoverState={false}
                        backgroundColor="#000000"
                      />
                    </div>
                  ),
                })}
                {renderSidebarIcon({
                  label: "Dashboard",
                  onClick: () => handleModuleNavigation("/dashboard"),
                  children: <BarChart2 size={22} />,
                })}
                {renderSidebarIcon({
                  label: "Marketplace",
                  onClick: () => handleModuleNavigation("/marketplace"),
                  children: <ShoppingBag size={22} />,
                })}
                {renderSidebarIcon({
                  label: "Pricing",
                  onClick: () => handleModuleNavigation("/pricing"),
                  children: <BadgeIndianRupee size={22} />,
                })}
                {renderSidebarIcon({
                  label: "Social",
                  onClick: () => handleModuleNavigation("/dashboard/social"),
                  children: <Users size={22} />,
                })}
                {renderSidebarIcon({
                  label: "About",
                  onClick: () => handleModuleNavigation("/about"),
                  children: <Info size={22} />,
                })}
              </div>

              {/* bottom user/demo pill */}
              <div className="mt-3 lg:mt-4 flex lg:flex-col gap-3 items-stretch">
                <div
                  className={cx(
                    "rounded-[20rem] bg-[#B8B7F2]/70 backdrop-blur",
                    "p-4",                        // slightly more padding
                    "lg:h-[200px]",               // ✅ taller height
                    "w-full lg:w-[92px]",         // match sidebar width
                    "flex lg:flex-col items-center justify-center gap-4",
                    "shadow-[inset_6px_6px_14px_rgba(0,0,0,0.08),inset_-6px_-6px_14px_rgba(255,255,255,0.55)]"
                  )}
                >
                  {renderSidebarIcon({
                    label: "Profile",
                    onClick: () => handleModuleNavigation("/dashboard"),
                    className: cx(
                      "rounded-full bg-[#E7E9FF] !text-[#1A1E35] hover:!text-[#0F1226]",
                      neuBtn
                    ),
                    children: <User size={20} />,
                  })}

                  {token ? (
                    renderSidebarIcon({
                      label: "Logout",
                      onClick: handleLogout,
                      className: cx(
                        "rounded-full bg-[#E7E9FF] !text-[#7A1F2E] hover:!text-[#5A1622]",
                        neuBtn
                      ),
                      children: <LogOut size={18} />,
                    })
                  ) : (
                    renderSidebarIcon({
                      label: "Login",
                      onClick: () => navigate("/login"),
                      className: cx(
                        "rounded-full bg-[#E7E9FF] !text-[#1A1E35] hover:!text-[#0F1226]",
                        neuBtn
                      ),
                      children: <LogIn size={18} />,
                    })
                  )}
                </div>
              </div>
            </aside>

            {/* MAIN GRID */}
            <main className="flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 sm:gap-5 lg:gap-6">
                {/* HERO */}
                <section
                  className={cx(
                    "hs-hero hs-card",
                    CARD,
                    "rounded-[2.8rem]",
                    "relative overflow-visible",
                    "min-h-[520px] sm:min-h-[600px]",
                    "lg:h-[730px]", // desktop height 
                    "shadow-[0_22px_50px_rgba(95,94,166,0.28)]"
                  )}
                >
                  <div className="relative z-20 h-full px-6 sm:px-10 lg:px-14 py-10 sm:py-12 lg:py-14">
                    {/* brand */}
                    <div className="h-14">
                      <img
                        src={LOGO_LIGHT_SRC}
                        alt="EsportM"
                        className="h-12 w-auto max-w-[190px] object-contain"
                        loading="eager"
                      />
                    </div>

                    <div className="mt-8 sm:mt-10">
                      <h1 className="text-[clamp(44px,16vw,72px)] sm:text-[92px] lg:text-[120px] leading-[0.9] font-semibold tracking-tight text-white/95">
                        EsportM
                      </h1>

                      <p className="mt-4 sm:mt-6 text-white/85 text-base sm:text-lg max-w-[360px]">
                        Electronic Sports Management <br className="hidden sm:block" />
                        system
                      </p>

                      {loadingMe ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Fetching profile...</span>
                        </div>
                      ) : user ? (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                          <span>{userLabel}</span>
                          {user.role ? (
                            <span className="text-white/60">
                              ({String(user.role).toUpperCase()})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                          <span className="inline-flex h-2 w-2 rounded-full bg-rose-300" />
                          <span>Not logged in</span>
                        </div>
                      )}
                    </div>

                    {token ? (
                      <div className="mt-8 sm:mt-10 flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(dashboardEntry)}
                          className={cx(
                            "rounded-full bg-[#E7E9FF] text-[#5F5EA6] font-semibold",
                            "px-6 sm:px-8 py-3 text-sm",
                            "tracking-wide",
                            neuBtnCta
                          )}
                        >
                          Open Dashboard
                        </button>
                      </div>
                    ) : null}
                  </div>

                 
                  <div className="pointer-events-none absolute left-[12%] sm:left-[10%] lg:left-[44%] bottom-[-6%] sm:bottom-[-7%] z-10">
                    <img
                      src="/images/player.png"
                      alt="Football Player"
                      className="w-[min(310px,72vw)] sm:w-[420px] lg:w-[520px] object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)]"
                      loading="eager"
                    />
                  </div>
                </section>

                {/* RIGHT COLUMN (✅ height matches hero and centers perfectly) */}
                <section className={cx("flex flex-col gap-4 sm:gap-5 lg:gap-6", "lg:h-[720px]")}>
                  {/* TOP RIGHT CARD */}
                  <div
                    className={cx(
                      "hs-right hs-card",
                      CARD,
                      "rounded-[2.8rem]",
                      "relative overflow-hidden",
                      "flex-1", // ✅ fills remaining height
                      "shadow-[0_22px_50px_rgba(95,94,166,0.28)]"
                    )}
                  >
                    <div className="absolute right-5 top-5 sm:right-6 sm:top-6 z-20 flex items-start gap-2">
                      <div className="relative">
                        {searchFocused ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              onSearchSubmit();
                            }}
                            className={cx(
                              "hs-searchPulse",
                              "flex w-[min(240px,calc(100vw-96px))] items-center gap-2 rounded-full border border-white/15 bg-[#0B0B0B]/85 px-3 py-2 backdrop-blur sm:w-[300px]",
                              "shadow-[0_18px_35px_rgba(0,0,0,0.28)] transition-all duration-300"
                            )}
                            title="Search modules and jump"
                          >
                            <Search size={14} className="shrink-0 text-white/80" />
                            <input
                              ref={searchInputRef}
                              value={searchQuery}
                              onChange={(event) => setSearchQuery(event.target.value)}
                              onFocus={() => setSearchFocused(true)}
                              onBlur={() => {
                                window.setTimeout(() => setSearchFocused(false), 120);
                              }}
                              onKeyDown={(event) => {
                                if (!searchResults.length) return;
                                if (event.key === "ArrowDown") {
                                  event.preventDefault();
                                  setSearchActiveIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
                                }
                                if (event.key === "ArrowUp") {
                                  event.preventDefault();
                                  setSearchActiveIndex((prev) => Math.max(prev - 1, 0));
                                }
                                if (event.key === "Escape") {
                                  setSearchFocused(false);
                                  searchInputRef.current?.blur();
                                }
                              }}
                              placeholder="Search pages..."
                              className="w-full bg-transparent text-xs text-white placeholder:text-white/60 outline-none"
                              aria-label="Search modules"
                            />
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSearchFocused(true)}
                            className={cx(
                              "hs-searchPulse flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0B0B0B]/85 backdrop-blur",
                              "shadow-[0_18px_35px_rgba(0,0,0,0.28)] transition-all duration-300 hover:bg-black/90 active:scale-[0.98]"
                            )}
                            title="Open search"
                            aria-label="Open search"
                          >
                            <Search size={14} className="shrink-0 text-white/80" />
                          </button>
                        )}

                        {(searchFocused || searchQuery.trim().length > 0) && (
                          <div className="absolute right-0 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-[#0B0B0B]/85 shadow-[0_18px_35px_rgba(0,0,0,0.28)] backdrop-blur">
                            {searchResults.length ? (
                              <ul className="max-h-[260px] overflow-y-auto py-1">
                                {searchResults.map((item, index) => {
                                  const active = index === searchActiveIndex;
                                  return (
                                    <li key={item.id}>
                                      <button
                                        type="button"
                                        onMouseEnter={() => setSearchActiveIndex(index)}
                                        onClick={() => handleSearchSelect(item.path)}
                                        className={cx(
                                          "w-full px-3 py-2 text-left transition",
                                          active ? "bg-white/15" : "hover:bg-white/10"
                                        )}
                                      >
                                        <div className="text-sm font-semibold text-white">{item.label}</div>
                                        <div className="text-xs text-white/70">{item.description}</div>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div className="px-3 py-3 text-xs text-white/70">
                                No matches found. Try keywords like dashboard, social, or marketplace.
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {!token ? (
                        <button
                          type="button"
                          onClick={() => navigate("/login")}
                          className={cx(
                            "rounded-full border border-white/15 bg-[#0B0B0B]/85 px-5 py-2.5 text-sm font-medium text-white backdrop-blur",
                            "shadow-[0_18px_35px_rgba(0,0,0,0.28)] transition-all duration-300 hover:bg-black/90 active:scale-[0.98]"
                          )}
                        >
                          Login
                        </button>
                      ) : null}
                    </div>

                    <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-7 z-20">
                      <p className="text-white/90 text-sm font-medium">AI powered</p>
                    </div>
                  </div>

                  {/* BOTTOM RIGHT CARD */}
                  <div
                    className={cx(
                      "hs-right hs-card",
                      CARD_DARK,
                      "rounded-[2.8rem]",
                      "relative overflow-hidden",
                      "h-[180px] sm:h-[210px] lg:h-[210px]", // ✅ fixed bottom height
                      "shadow-[0_20px_45px_rgba(0,0,0,0.18)]"
                    )}
                  >
                    <div className="h-full px-6 sm:px-8 py-7 flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white/95">
                          EsportM
                        </h3>
                        <p className="text-white/75 text-sm mt-1">Events</p>
                      </div>

                      <button
                        onClick={() => handleModuleNavigation("/dashboard")}
                        className={cx(
                          "hs-ringFloat",
                          "w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-full",
                          "bg-[#6D6C87]",
                          "flex items-center justify-center",
                          neuBtnSoft
                        )}
                        title="Open Events"
                      >
                        <div
                          className={cx(
                            "w-[58px] h-[58px] sm:w-[64px] sm:h-[64px] rounded-full",
                            "bg-[#6D6C87]",
                            "shadow-[inset_6px_6px_14px_rgba(0,0,0,0.18),inset_-6px_-6px_14px_rgba(255,255,255,0.10)]",
                            "flex items-center justify-center"
                          )}
                        >
                          <div className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-full bg-[#7F7CEB]/60 blur-[0.2px]" />
                        </div>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />

    </div>
  );
}
