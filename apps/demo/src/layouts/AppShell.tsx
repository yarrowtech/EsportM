// // src/layouts/AppShell.tsx
// import { useEffect, useMemo, useState } from "react";
// import { Outlet, useNavigate } from "react-router-dom";

// import Sidebar from "../components/ui/Sidebar";
// import type { SidebarItem, SidebarUser } from "../components/ui/Sidebar";

// import { ThemePanel } from "../theme/ThemePanel";
// import { me } from "../api/auth.api";
// import { mapToSidebarUser } from "../utils/mapSidebarUser";

// type NavKey =
//   | "dashboard"
//   | "squad"
//   | "training"
//   | "wearables"
//   | "contracts"
//   | "calendar"
//   | "reviews"
//   | "settings";

// const topNav: { key: NavKey; label: string }[] = [
//   { key: "dashboard", label: "Dashboard" },
//   { key: "squad", label: "Squad" },
//   { key: "training", label: "Training" },
//   { key: "wearables", label: "Wearables" },
//   { key: "contracts", label: "Contracts" },
//   { key: "calendar", label: "Calendar" },
//   { key: "reviews", label: "Reviews" },
// ];

// const sectionItems: SidebarItem[] = [
//   { label: "Training", to: "/dashboard/training" },
//   { label: "Schedule", to: "/dashboard/matches" },
//   { label: "Stats", to: "/dashboard/stats" },
//   { label: "Medical", to: "/dashboard/medical" },
//   { label: "Messages", to: "/dashboard/messages" },
//   { label: "Settings", to: "/dashboard/settings" },
// ];

// function cx(...s: Array<string | false | undefined>) {
//   return s.filter(Boolean).join(" ");
// }

// /**
//  * OK Glass tokens
//  * Use these instead of dark borders.
//  */
// const GLASS_BORDER = "rgba(255,255,255,0.38)";
// const GLASS_BORDER_STRONG = "rgba(255,255,255,0.52)";
// const GLASS_SHADOW = "0 28px 80px rgba(20,24,32,0.10)";
// const GLASS_BG = "rgba(255,255,255,0.52)";

// function GlassBackdrop() {
//   return (
//     <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
//       {/* Base gradient wash */}
//       <div
//         className="absolute inset-0"
//         style={{
//           background:
//             "radial-gradient(900px 520px at 15% 15%, rgba(255,255,255,.70), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(var(--primary),.22), transparent 60%), radial-gradient(900px 520px at 92% 85%, rgba(var(--primary),.14), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0))",
//         }}
//       />

//       {/* soft blobs */}
//       <svg
//         className="absolute -left-44 -top-48 h-[640px] w-[640px] opacity-60 blur-[2px]"
//         viewBox="0 0 600 600"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g1" cx="30%" cy="30%" r="70%">
//             <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
//             <stop offset="45%" stopColor="rgba(255,255,255,0.25)" />
//             <stop offset="100%" stopColor="rgba(255,255,255,0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="300" cy="300" r="260" fill="url(#g1)" />
//       </svg>

//       <svg
//         className="absolute -right-52 top-10 h-[760px] w-[760px] opacity-70 blur-[3px]"
//         viewBox="0 0 700 700"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g2" cx="55%" cy="45%" r="70%">
//             <stop offset="0%" stopColor="rgba(var(--primary),0.82)" />
//             <stop offset="55%" stopColor="rgba(var(--primary),0.24)" />
//             <stop offset="100%" stopColor="rgba(var(--primary),0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="350" cy="350" r="320" fill="url(#g2)" />
//       </svg>

//       <svg
//         className="absolute left-[8%] bottom-[-320px] h-[820px] w-[820px] opacity-60 blur-[3px]"
//         viewBox="0 0 760 760"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g3" cx="45%" cy="55%" r="70%">
//             <stop offset="0%" stopColor="rgba(var(--primary-2),0.44)" />
//             <stop offset="55%" stopColor="rgba(var(--primary-2),0.14)" />
//             <stop offset="100%" stopColor="rgba(var(--primary-2),0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="380" cy="380" r="340" fill="url(#g3)" />
//       </svg>

//       {/* subtle lines */}
//       <svg
//         className="absolute left-0 top-0 h-full w-full opacity-[0.18]"
//         viewBox="0 0 1200 800"
//         preserveAspectRatio="none"
//         aria-hidden="true"
//       >
//         <defs>
//           <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1">
//             <stop offset="0%" stopColor="rgba(0,0,0,0)" />
//             <stop offset="50%" stopColor="rgba(0,0,0,0.10)" />
//             <stop offset="100%" stopColor="rgba(0,0,0,0)" />
//           </linearGradient>
//         </defs>
//         <path
//           d="M-50 170 C 240 40, 420 480, 760 260 S 1150 210, 1300 420"
//           fill="none"
//           stroke="url(#ln)"
//           strokeWidth="2"
//         />
//         <path
//           d="M-60 520 C 240 320, 520 820, 820 520 S 1180 470, 1300 650"
//           fill="none"
//           stroke="url(#ln)"
//           strokeWidth="2"
//         />
//       </svg>

//       {/* grain */}
//       <svg
//         className="absolute inset-0 h-full w-full opacity-[0.075]"
//         aria-hidden="true"
//       >
//         <filter id="noise">
//           <feTurbulence
//             type="fractalNoise"
//             baseFrequency="0.9"
//             numOctaves="3"
//             stitchTiles="stitch"
//           />
//           <feColorMatrix
//             type="matrix"
//             values="
//               1 0 0 0 0
//               0 1 0 0 0
//               0 0 1 0 0
//               0 0 0 0.55 0"
//           />
//         </filter>
//         <rect width="100%" height="100%" filter="url(#noise)" />
//       </svg>
//     </div>
//   );
// }

// const FALLBACK_USER: SidebarUser = {
//   fullName: "Player",
//   userId: "-",
//   clubName: "-",
//   role: "Player",
//   position: "",
// };

// export default function AppShell() {
//   const navigate = useNavigate();

//   const [themeOpen, setThemeOpen] = useState(false);
//   const [active, setActive] = useState<NavKey>("dashboard");
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   // OK dynamic user state
//   const [user, setUser] = useState<SidebarUser>(FALLBACK_USER);
//   const [userLoading, setUserLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;

//     async function loadMe() {
//       try {
//         setUserLoading(true);

//        const token =
//   localStorage.getItem("accessToken") || localStorage.getItem("token");

// if (!token) {
//   navigate("/login", { replace: true });
//   return;
// }

//         const data = await me();
//         const mapped = mapToSidebarUser(data);

//         if (alive) setUser(mapped);
//       } catch (err) {
//         localStorage.removeItem("token");
//         if (alive) navigate("/login", { replace: true });
//       } finally {
//         if (alive) setUserLoading(false);
//       }
//     }

//     loadMe();

//     return () => {
//       alive = false;
//     };
//   }, [navigate]);

//   const subtitle = useMemo(() => {
//     const map: Record<NavKey, string> = {
//       dashboard: "Overview  -  readiness  -  schedule",
//       squad: "Team  -  roles  -  availability",
//       training: "Load  -  sessions  -  recovery",
//       wearables: "HRV  -  GPS  -  sleep",
//       contracts: "Contract  -  bonuses",
//       calendar: "Schedule  -  sessions",
//       reviews: "Coach feedback",
//       settings: "Preferences",
//     };
//     return map[active];
//   }, [active]);

//   const HEADER_H = 84;

//   return (
//     <div className="min-h-screen w-full bg-[rgb(var(--bg))]">
//       <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

//       {/* backdrop under canvas */}
//       <div className="relative">
//         <GlassBackdrop />

//         <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8">
//           {/* CANVAS (no black border) */}
//           <div
//             className={cx(
//               "relative overflow-hidden rounded-[28px]",
//               "backdrop-blur-2xl",
//               "shadow-[0_28px_80px_rgba(20,24,32,0.10)]"
//             )}
//             style={{
//               background: GLASS_BG,
//               border: `1px solid ${GLASS_BORDER}`,
//               boxShadow: GLASS_SHADOW,
//             }}
//           >
//             {/* glass highlight + subtle stroke */}
//             <div
//               className="pointer-events-none absolute inset-0"
//               style={{
//                 background:
//                   "linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.30))",
//                 opacity: 0.55,
//               }}
//             />
//             <div
//               className="pointer-events-none absolute inset-0"
//               style={{
//                 boxShadow:
//                   "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.20)",
//               }}
//             />

//             {/* Layout */}
//             <div className="relative z-10 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
//               {/* HEADER (glass, no dark divider) */}
//               <header
//                 className="sticky top-0 z-20 backdrop-blur-2xl"
//                 style={{
//                   height: HEADER_H,
//                   background: "rgba(255,255,255,0.40)",
//                   borderBottom: `1px solid ${GLASS_BORDER}`,
//                 }}
//               >
//                 <div className="h-full px-4 sm:px-6">
//                   <div className="flex h-full items-center justify-between gap-3">
//                     <div className="flex items-center gap-3">
//                       {/* mobile menu */}
//                       <button
//                         onClick={() => setSidebarOpen(true)}
//                         className="md:hidden rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                         style={{
//                           background: "rgba(255,255,255,0.55)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         Menu
//                       </button>

//                       {/* brand pill */}
//                       <div
//                         className="rounded-full px-4 py-2 text-sm font-semibold"
//                         style={{
//                           background: "rgba(255,255,255,0.50)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         EsportM
//                       </div>

//                       {/* top pills */}
//                       <nav
//                         className="hidden items-center gap-1 rounded-full p-1 sm:flex"
//                         style={{
//                           background: "rgba(255,255,255,0.44)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         {topNav.map((item) => {
//                           const on = item.key === active;
//                           return (
//                             <button
//                               key={item.key}
//                               onClick={() => setActive(item.key)}
//                               className="rounded-full px-3 py-2 text-xs font-semibold transition"
//                               style={{
//                                 background: on
//                                   ? "rgba(var(--primary), .55)"
//                                   : "transparent",
//                                 color: on
//                                   ? "rgb(var(--primary-2))"
//                                   : "rgb(var(--text))",
//                                 border: on
//                                   ? `1px solid ${GLASS_BORDER_STRONG}`
//                                   : "1px solid transparent",
//                               }}
//                             >
//                               {item.label}
//                             </button>
//                           );
//                         })}
//                       </nav>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <div className="hidden sm:block text-right">
//                         <p className="text-sm font-semibold text-[rgb(var(--text))]">
//                           EsportM  - {" "}
//                           {userLoading ? "Loading..." : user.role ?? "Player"}
//                         </p>
//                         <p className="text-xs text-[rgb(var(--muted))]">
//                           {subtitle}
//                         </p>
//                       </div>

//                       <button
//                         onClick={() => setThemeOpen(true)}
//                         className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                         style={{
//                           background: "rgba(255,255,255,0.50)",
//                           color: "rgb(var(--text))",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         Theme
//                       </button>

//                       <div
//                         className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
//                         style={{
//                           background: "rgba(255,255,255,0.48)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                         title={user.fullName}
//                       >
//                         {user.fullName?.trim()?.[0]?.toUpperCase() ?? "P"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </header>

//               {/* BODY */}
//               <div className="flex h-[calc(100%-84px)] gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
//                 {/* Desktop sticky sidebar (glass) */}
//                 <div className="hidden md:block shrink-0" style={{ width: 220 }}>
//                   <div className="sticky top-[96px]">
//                     <Sidebar
//                       open={sidebarOpen}
//                       onClose={() => setSidebarOpen(false)}
//                       items={sidebarItems}
//                       user={user}
//                     />
//                   </div>
//                 </div>

//                 {/* Mobile drawer */}
//                 <div className="md:hidden">
//                   <Sidebar
//                     open={sidebarOpen}
//                     onClose={() => setSidebarOpen(false)}
//                     items={sidebarItems}
//                     user={user}
//                   />
//                 </div>

//                 {/* Scroll only main */}
//                 <main className="min-w-0 flex-1 overflow-y-auto pr-1">
//                   {/* quick actions (mobile) */}
//                   <div className="mb-4 flex justify-end gap-2 sm:hidden">
//                     <button
//                       onClick={() => navigate("/")}
//                       className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                       style={{
//                         background: "rgba(255,255,255,0.50)",
//                         border: `1px solid ${GLASS_BORDER}`,
//                       }}
//                     >
//                       Home
//                     </button>

//                     <button
//                       onClick={() => {
//                         localStorage.removeItem("token");
//                         navigate("/login", { replace: true });
//                       }}
//                       className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:opacity-95"
//                       style={{
//                         background: "rgba(var(--primary), .65)",
//                         color: "rgb(var(--primary-2))",
//                         border: `1px solid ${GLASS_BORDER_STRONG}`,
//                       }}
//                     >
//                       Logout
//                     </button>
//                   </div>

//                   {/* Optional: small loading ribbon */}
//                   {userLoading && (
//                     <div
//                       className="mb-3 rounded-2xl border bg-white/50 px-4 py-3 text-sm backdrop-blur-md"
//                       style={{ borderColor: "rgba(var(--primary-2), .10)" }}
//                     >
//                       Loading profile...
//                     </div>
//                   )}

//                   <Outlet />
//                 </main>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
















































// src/layouts/AppShell.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Dumbbell,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings2,
  ShoppingBag,
  Star,
  UserRound,
  Users2,
} from "lucide-react";

import Sidebar from "../components/ui/Sidebar";
import type { SidebarItem, SidebarUser } from "../components/ui/Sidebar";
import ConfirmModal from "../components/ui/ConfirmModal";
import { ScheduleEventType, type ScheduleEvent } from "../api/schedule.api";
import type { PrimaryRole, SubRole } from "../api/admin.api";

import { useMe } from "../hooks/useMe";
import { useScheduleEvents } from "../hooks/useScheduleEvents";
import { useNotifications } from "../hooks/useNotifications";
import { mapToSidebarUser } from "../utils/mapSidebarUser";
import { clearAuth, getAccessToken } from "../utils/authStorage";
import {
  formatDashboardRole,
  getDashboardRoleAccess,
  pathForDashboardRole,
  type DashboardRole,
} from "../utils/dashboardRouting";
import { listRolePermissions, type RolePermission } from "../utils/rolePolicy";
import {
  markNotificationRead,
  type Notification,
  type NotificationListResponse,
} from "../api/notifications.api";
import { DotTag, formatDateTime } from "../pages/admin/admin-ui";

 type NavKey =
   | "dashboard"
   | "squad"
   | "training"
   | "wearables"
   | "contracts"
   | "calendar"
   | "reviews"
   | "settings"
   | "profile";

type DashboardRoleKey =
  | "ADMIN"
  | "MANAGER"
  | "PLAYER"
  | "MEMBER"
  | "COACH"
  | "PHYSIO"
  | "AGENT"
  | "NUTRITIONIST"
  | "PITCH_MANAGER";

type AppShellOutletContext = {
  clubId: string;
  role: PrimaryRole;
  subRoles: SubRole[];
  permissions: RolePermission[];
};

const defaultTopNav: { key: NavKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "squad", label: "Squad" },
  { key: "training", label: "Training" },
  { key: "wearables", label: "Wearables" },
  { key: "contracts", label: "Contracts" },
  { key: "calendar", label: "Calendar" },
  { key: "reviews", label: "Reviews" },
  { key: "profile", label: "Profile" },
];

const topNavByRole: Partial<Record<DashboardRoleKey, Array<{ key: NavKey; label: string }>>> = {
  PLAYER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reviews" },
    { key: "profile", label: "Profile" },
  ],
  COACH: [
    { key: "dashboard", label: "Dashboard" },
    { key: "squad", label: "Squad" },
    { key: "training", label: "Training" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reviews" },
    { key: "profile", label: "Profile" },
  ],
  PHYSIO: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "wearables", label: "Wearables" },
    { key: "reviews", label: "Reviews" },
    { key: "profile", label: "Profile" },
  ],
  AGENT: [
    { key: "dashboard", label: "Dashboard" },
    { key: "squad", label: "Talent" },
    { key: "contracts", label: "Contracts" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reports" },
    { key: "profile", label: "Profile" },
  ],
  NUTRITIONIST: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "wearables", label: "Load" },
    { key: "reviews", label: "Reviews" },
    { key: "profile", label: "Profile" },
  ],
  PITCH_MANAGER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Prep" },
    { key: "calendar", label: "Fixtures" },
    { key: "settings", label: "Settings" },
    { key: "profile", label: "Profile" },
  ],
  MEMBER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "settings", label: "Settings" },
    { key: "profile", label: "Profile" },
  ],
};

const defaultSectionItems: SidebarItem[] = [
  { label: "Training", to: "/dashboard/training" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "Scheduling", to: "/dashboard/schedule" },
  { label: "Stats", to: "/dashboard/stats" },
  { label: "Medical", to: "/dashboard/medical" },
  { label: "Messages", to: "/dashboard/messages" },
  { label: "Social", to: "/dashboard/social" },
  { label: "Settings", to: "/dashboard/settings" },
];

const MARKETPLACE_SIDEBAR_ITEM: SidebarItem = {
  label: "Marketplace",
  to: "/marketplace",
};

const PROFILE_SIDEBAR_ITEM: SidebarItem = {
  label: "Profile",
  to: "/dashboard/profile",
};

const BILLING_SIDEBAR_ITEM: SidebarItem = {
  label: "Billing",
  to: "/dashboard/billing",
};

const SQUAD_MANAGEMENT_ITEM: SidebarItem = {
  label: "Squad Management",
  to: "/dashboard/squad-management",
};

const sectionItemsByRole: Partial<Record<DashboardRoleKey, SidebarItem[]>> = {
  PLAYER: defaultSectionItems,
  MANAGER: [
    { label: "Members", to: "/dashboard/members" },
    SQUAD_MANAGEMENT_ITEM,
    ...defaultSectionItems,
  ],
  ADMIN: [
    { label: "Members", to: "/dashboard/members" },
    SQUAD_MANAGEMENT_ITEM,
    ...defaultSectionItems,
  ],
  COACH: [
    SQUAD_MANAGEMENT_ITEM,
    { label: "Training", to: "/dashboard/training" },
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  PHYSIO: [
    { label: "Medical", to: "/dashboard/medical" },
    { label: "Training", to: "/dashboard/training" },
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  AGENT: [
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  NUTRITIONIST: [
    { label: "Training", to: "/dashboard/training" },
    { label: "Medical", to: "/dashboard/medical" },
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  PITCH_MANAGER: [
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Training", to: "/dashboard/training" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  MEMBER: [
    { label: "Onboarding", to: "/dashboard/onboarding" },
    { label: "Scheduling", to: "/dashboard/schedule" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
};

function ensureProfileItem(items: SidebarItem[]) {
  if (items.some((item) => item.to === PROFILE_SIDEBAR_ITEM.to)) {
    return items;
  }
  const settingsIndex = items.findIndex((item) => item.to === "/dashboard/settings");
  if (settingsIndex === -1) {
    return [...items, PROFILE_SIDEBAR_ITEM];
  }
  return [
    ...items.slice(0, settingsIndex),
    PROFILE_SIDEBAR_ITEM,
    ...items.slice(settingsIndex),
  ];
}

function ensureBillingItem(items: SidebarItem[]) {
  if (items.some((item) => item.to === BILLING_SIDEBAR_ITEM.to)) {
    return items;
  }
  const settingsIndex = items.findIndex((item) => item.to === "/dashboard/settings");
  if (settingsIndex === -1) {
    return [...items, BILLING_SIDEBAR_ITEM];
  }
  return [
    ...items.slice(0, settingsIndex),
    BILLING_SIDEBAR_ITEM,
    ...items.slice(settingsIndex),
  ];
}

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

function resolveNavKeyFromPath(pathname: string, dashboardHome: string): NavKey {
  if (pathname === dashboardHome || pathname.startsWith(`${dashboardHome}/`)) return "dashboard";
  if (pathname.startsWith("/dashboard/training")) return "training";
  if (
    pathname.startsWith("/dashboard/matches") ||
    pathname.startsWith("/dashboard/schedule")
  )
    return "calendar";
  if (pathname.startsWith("/dashboard/squad-management")) return "squad";
  if (pathname.startsWith("/dashboard/stats")) return "squad";
  if (pathname.startsWith("/dashboard/medical")) return "wearables";
  if (pathname.startsWith("/dashboard/messages") || pathname.startsWith("/dashboard/social")) return "reviews";
  if (pathname.startsWith("/dashboard/profile")) return "profile";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "dashboard";
}

function iconForSidebarPath(path: string) {
  if (path === "/marketplace") return <ShoppingBag size={16} strokeWidth={1.8} />;
  if (path.includes("/squad-management")) return <Users2 size={16} strokeWidth={1.8} />;
  if (path.includes("/training")) return <Dumbbell size={16} strokeWidth={1.8} />;
  if (path.includes("/schedule") || path.includes("/matches"))
    return <CalendarDays size={16} strokeWidth={1.8} />;
  if (path.includes("/stats")) return <Activity size={16} strokeWidth={1.8} />;
  if (path.includes("/medical")) return <HeartPulse size={16} strokeWidth={1.8} />;
  if (path.includes("/messages") || path.includes("/social")) return <MessageSquare size={16} strokeWidth={1.8} />;
  if (path.includes("/members")) return <Users2 size={16} strokeWidth={1.8} />;
  if (path.includes("/profile")) return <UserRound size={16} strokeWidth={1.8} />;
  if (path.includes("/billing")) return <CreditCard size={16} strokeWidth={1.8} />;
  if (path.includes("/settings")) return <Settings2 size={16} strokeWidth={1.8} />;
  return <LayoutDashboard size={16} strokeWidth={1.8} />;
}

function topNavIcon(key: NavKey) {
  if (key === "dashboard") return <LayoutDashboard size={17} />;
  if (key === "training") return <Dumbbell size={17} />;
  if (key === "calendar") return <CalendarDays size={17} />;
  if (key === "reviews") return <Star size={17} />;
  if (key === "profile") return <UserRound size={17} />;
  if (key === "squad") return <Users2 size={17} />;
  if (key === "wearables") return <HeartPulse size={17} />;
  if (key === "settings") return <Settings2 size={17} />;
  return <Activity size={17} />;
}

/**
 * OK Glass tokens
 * Use these instead of dark borders.
 */
const GLASS_SHADOW = "var(--neu-raised)";
const GLASS_BG = "rgb(var(--bg))";
const LOGO_DARK_SRC = "/logo/logo-dark.png";
const NEU_INSET = "var(--neu-inset)";

type ScheduleNotificationProps = {
  events?: ScheduleEvent[];
  isLoading: boolean;
  onViewCalendar: () => void;
  referenceTimeMs: number | null;
};

type NotificationOverviewProps = {
  data?: NotificationListResponse;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
};

function NotificationOverview({
  data,
  isLoading,
  onMarkAsRead,
}: NotificationOverviewProps) {
  const notifications = data?.notifications ?? [];

  return (
    <div
      className="neu-surface h-full rounded-[24px] px-4 py-3"
      style={{
        background: "rgb(var(--bg))",
        boxShadow: GLASS_SHADOW,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(var(--primary), .14)",
              color: "rgb(var(--primary-2))",
              boxShadow: NEU_INSET,
            }}
          >
            <Bell size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
              Notifications
            </div>
            <p className="text-sm font-extrabold text-[rgb(var(--text))]">
              {isLoading
                ? "Refreshing alerts..."
                : data?.unreadCount
                ? `You have ${data.unreadCount} unread alert${data.unreadCount > 1 ? "s" : ""}`
                : "All caught up"}
            </p>
            {!isLoading && notifications.length === 0 ? (
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">No notifications yet.</p>
            ) : null}
          </div>
        </div>
        <div className="text-[11px] text-[rgb(var(--muted))]">{notifications.length} recent</div>
      </div>

      {isLoading && (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">Loading notifications...</p>
      )}

      {!isLoading && notifications.length > 0 ? (
        <div className="mt-3 space-y-2">
          {notifications.slice(0, 3).map((notification: Notification) => (
            <article
              key={notification.id}
              className={cx(
                  "rounded-2xl px-3 py-3 transition",
                notification.isRead
                  ? "bg-white/60 text-[rgb(var(--text))]"
                  : "border-[rgba(var(--primary),.2)] bg-[rgba(var(--primary),.08)]"
              )}
              style={{
                boxShadow: notification.isRead ? NEU_INSET : "inset 5px 5px 12px rgba(var(--primary), .12), inset -5px -5px 12px rgba(255,255,255,.84)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {notification.title}
                  </p>
                  <p className="text-[11px] text-[rgb(var(--muted))] truncate">
                    {notification.body}
                  </p>
                  <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={notification.isRead}
                  className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] transition"
                  style={{
                    background: notification.isRead ? "rgb(var(--bg))" : "rgb(var(--primary))",
                    color: notification.isRead ? "rgb(var(--text))" : "rgb(var(--primary-2))",
                    boxShadow: notification.isRead ? NEU_INSET : "5px 5px 12px rgba(var(--primary), .22), -5px -5px 12px rgba(255,255,255,.72)",
                  }}
                >
                  {notification.isRead ? "Read" : "Mark read"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

    </div>
  );
}

function ScheduleNotification({
  events,
  isLoading,
  onViewCalendar,
  referenceTimeMs,
}: ScheduleNotificationProps) {
  const upcoming = useMemo(() => {
    if (!events?.length) return [];
    const cutoff = (referenceTimeMs ?? 0) - 1_000;
    return events
      .slice()
      .filter((event) => new Date(event.eventAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime())
      .slice(0, 2);
  }, [events, referenceTimeMs]);

  const nextEvent = upcoming[0];

  return (
    <div
      className="neu-surface h-full rounded-[24px] px-4 py-3"
      style={{
        background: "rgb(var(--bg))",
        boxShadow: GLASS_SHADOW,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(var(--primary), .14)",
              color: "rgb(var(--primary-2))",
              boxShadow: NEU_INSET,
            }}
          >
            <CalendarCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[rgb(var(--muted))]">
              Scheduling
            </p>
            <p className="text-sm font-extrabold text-[rgb(var(--text))]">
              {isLoading
                ? "Refreshing schedule..."
                : nextEvent
                ? nextEvent.title
                : "No upcoming events"}
            </p>
            <p className="text-[11px] text-[rgb(var(--muted))]">
              {isLoading
                ? "Checking for new schedule items"
                : nextEvent
                ? formatDateTime(nextEvent.eventAt)
                : "Plan a session to notify your crew"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewCalendar}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold"
          style={{
            background: "rgb(var(--bg))",
            boxShadow: "var(--neu-raised-sm)",
          }}
        >
          <CalendarDays size={14} />
          View calendar
        </button>
      </div>

      {!isLoading && upcoming.length > 0 && (
        <div className="mt-3 space-y-2">
          {upcoming.map((event) => (
            <article
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
              style={{
                background: "rgb(var(--bg))",
                boxShadow: NEU_INSET,
              }}
            >
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text))]">{event.title}</p>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  {formatDateTime(event.eventAt)}
                </p>
              </div>
              <DotTag tone={event.type === ScheduleEventType.Match ? "warn" : "ok"}>
                {event.type}
              </DotTag>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !upcoming.length && (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          No schedule items yet. Share a session so others can see it here.
        </p>
      )}
    </div>
  );
}

function GlassBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ background: "rgb(var(--bg))" }}
    />
  );
}

const FALLBACK_USER: SidebarUser = {
  fullName: "Player",
  userId: "-",
  clubName: "-",
  role: "Player",
  position: "",
};

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: meData, isLoading: userLoading, error: meError } = useMe();

  const [active, setActive] = useState<NavKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [scheduleReferenceTimeMs, setScheduleReferenceTimeMs] = useState<number | null>(null);

  const user = useMemo<SidebarUser>(() => {
    if (!meData) return FALLBACK_USER;
    return mapToSidebarUser(meData as any);
  }, [meData]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setScheduleReferenceTimeMs(Date.now());
  }, []);

  useEffect(() => {
    if (!meError) return;
    const status = (meError as any)?.response?.status;
    if (status === 401) {
      clearAuth();
      navigate("/login", { replace: true });
      return;
    }
    console.error("Profile load failed (non-auth):", meError);
  }, [meError, navigate]);

  const subtitle = useMemo(() => {
    const map: Record<NavKey, string> = {
      dashboard: "Overview  -  readiness  -  schedule",
      squad: "Team  -  roles  -  availability",
      training: "Load  -  sessions  -  recovery",
      wearables: "HRV  -  GPS  -  sleep",
      contracts: "Contract  -  bonuses",
      calendar: "Schedule  -  sessions",
      reviews: "Coach feedback",
      settings: "Preferences",
      profile: "Profile data",
    };
    return map[active];
  }, [active]);

  const HEADER_H = 68;

  const roleAccess = useMemo(() => getDashboardRoleAccess(meData), [meData]);
  const isPlatformAdmin = !!meData?.isPlatformAdmin;
  const switchableRoles = roleAccess.availableRoles as DashboardRoleKey[];
  const canSwitchRole = roleAccess.canUseMultiRole && switchableRoles.length > 1;

  const dashboardRole = useMemo(() => {
    const stored = String(localStorage.getItem("activeDashboardRole") || "").toUpperCase() as DashboardRoleKey;
    if (switchableRoles.includes(stored)) return stored;
    return switchableRoles[0] || "PLAYER";
  }, [switchableRoles]);

  const dashboardHome = useMemo(() => {
    if (dashboardRole === "ADMIN") return "/dashboard/admin";
    return pathForDashboardRole(dashboardRole as DashboardRole);
  }, [dashboardRole]);

  const activeClubDisplay = useMemo(() => {
    const memberships = Array.isArray((meData as any)?.memberships) ? (meData as any).memberships : [];
    const activeClubId =
      String((meData as any)?.activeClubId || localStorage.getItem("activeClubId") || "").trim();
    const activeMembership =
      (meData as any)?.activeMembership ||
      memberships.find((membership: any) => membership?.clubId === activeClubId) ||
      memberships[0] ||
      null;
    const rawClub = activeMembership?.club;
    const clubName =
      (typeof rawClub === "string" ? rawClub : rawClub?.name) ||
      (user.clubName && user.clubName !== "-" ? user.clubName : "");
    const clubSlug = typeof rawClub === "object" && rawClub?.slug ? String(rawClub.slug) : "";
    const clubLogoUrl = typeof rawClub === "object" && rawClub?.logoUrl ? String(rawClub.logoUrl) : "";
    const clubId = String(activeMembership?.clubId || activeClubId || "").trim();
    const role = String(activeMembership?.primary || "").trim().toUpperCase();
    const hasClub = Boolean(clubName || clubId);

    return {
      hasClub,
      clubName: clubName || "No Club Assigned",
      clubSlug,
      clubLogoUrl,
      clubId,
      role: role ? formatDashboardRole(role as DashboardRole) : "",
    };
  }, [meData, user.clubName]);

  const topNav = useMemo(
    () => topNavByRole[dashboardRole] || defaultTopNav,
    [dashboardRole]
  );
  const topNavTargets = useMemo<Record<NavKey, string>>(
    () => ({
      dashboard: dashboardHome,
      squad: ["ADMIN", "MANAGER", "COACH"].includes(dashboardRole)
        ? "/dashboard/squad-management"
        : "/dashboard/stats",
      training: "/dashboard/training",
      wearables: "/dashboard/medical",
      contracts: "/dashboard/settings",
      calendar: "/dashboard/schedule",
      reviews: "/dashboard/messages",
      settings: "/dashboard/settings",
      profile: "/dashboard/profile",
    }),
    [dashboardHome, dashboardRole]
  );

  const sectionItems = useMemo(() => {
    const source = ensureBillingItem(
      ensureProfileItem(sectionItemsByRole[dashboardRole] || defaultSectionItems)
    );
    if (source.some((item) => item.to === MARKETPLACE_SIDEBAR_ITEM.to)) {
      return source;
    }

    const settingsIndex = source.findIndex((item) => item.to === "/dashboard/settings");
    if (settingsIndex === -1) {
      return [...source, MARKETPLACE_SIDEBAR_ITEM];
    }

    return [
      ...source.slice(0, settingsIndex),
      MARKETPLACE_SIDEBAR_ITEM,
      ...source.slice(settingsIndex),
    ];
  }, [dashboardRole]);

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const source = [{ label: "Dashboard", to: dashboardHome }, ...sectionItems];
    const seen = new Set<string>();
    return source
      .filter((item) => {
        if (seen.has(item.to)) return false;
        seen.add(item.to);
        return true;
      })
      .map((item) => ({
        ...item,
        icon: item.icon ?? iconForSidebarPath(item.to),
      }));
  }, [dashboardHome, sectionItems]);

  const outletContext = useMemo<AppShellOutletContext>(() => {
    const memberships = Array.isArray((meData as any)?.memberships) ? (meData as any).memberships : [];
    const activeClubId =
      String((meData as any)?.activeClubId || localStorage.getItem("activeClubId") || "").trim();
    const activeMembership =
      (meData as any)?.activeMembership ||
      memberships.find((membership: any) => membership?.clubId === activeClubId) ||
      memberships[0] ||
      null;

    const role = String(activeMembership?.primary || "MEMBER").toUpperCase() as PrimaryRole;
    const subRoles = Array.isArray(activeMembership?.subRoles)
      ? (activeMembership.subRoles as SubRole[])
      : [];
    const clubId = String(activeMembership?.clubId || activeClubId || "").trim();

    return {
      clubId,
      role,
      subRoles,
      permissions: listRolePermissions(role, subRoles),
    };
  }, [meData]);

  const scheduleQuery = useScheduleEvents(activeClubDisplay.clubId || undefined);
  const notificationsQuery = useNotifications(activeClubDisplay.clubId || undefined);
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => notificationsQuery.refetch(),
  });
  const handleMarkRead = useCallback(
    (id: string) => {
      if (markReadMutation.isPending) return;
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  useEffect(() => {
    const next = resolveNavKeyFromPath(location.pathname, dashboardHome);
    if (topNav.some((item) => item.key === next)) {
      setActive(next);
      return;
    }
    setActive(topNav[0]?.key ?? "dashboard");
  }, [dashboardHome, location.pathname, topNav]);

  useEffect(() => {
    localStorage.setItem("activeDashboardRole", dashboardRole);
  }, [dashboardRole]);

  const onSwitchRole = (nextRole: string) => {
    const normalized = String(nextRole || "").toUpperCase() as DashboardRoleKey;
    if (!switchableRoles.includes(normalized)) return;
    localStorage.setItem("activeDashboardRole", normalized);
    if (normalized === "ADMIN") {
      navigate("/dashboard/admin", { replace: true });
      return;
    }
    navigate(pathForDashboardRole(normalized as DashboardRole), { replace: true });
  };

  const requestLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const logout = () => {
    setLogoutConfirmOpen(false);
    clearAuth();
    navigate("/login", { replace: true });
  };

  const openScheduleCalendar = () => {
    navigate("/dashboard/schedule");
  };

  return (
    <div className="dashboard-readable min-h-screen w-full bg-[rgb(var(--bg))]">
      {/* backdrop under canvas */}
      <div className="relative">
        <GlassBackdrop />

        <div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-6 sm:py-6 md:px-7 md:py-7 lg:px-8 lg:py-8">
          {/* CANVAS (no black border) */}
          <div
            className={cx(
              "relative rounded-[24px] bg-[rgb(var(--bg))]"
            )}
            style={{
              background: GLASS_BG,
              boxShadow: GLASS_SHADOW,
            }}
          >
            {/* Layout */}
            <div className="relative z-10 flex h-[calc(100dvh-1.5rem)] min-h-0 flex-col sm:h-[calc(100dvh-3rem)] md:h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-4rem)]">
              {/* HEADER (glass, no dark divider) */}
              <header
                className="sticky top-0 z-20 shrink-0 rounded-t-[24px]"
                style={{
                  minHeight: HEADER_H,
                  background: "rgb(var(--bg))",
                  boxShadow: "var(--neu-raised-sm)",
                }}
              >
                <div className="px-2 py-2 sm:px-3 sm:py-2 lg:px-4">
                  <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {/* mobile menu */}
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70 md:hidden"
                        style={{
                          background: "rgb(var(--bg))",
                          boxShadow: "var(--neu-raised-sm)",
                        }}
                      >
                        Menu
                      </button>

                      {/* brand pill */}
                      <div
                        className="flex h-10 shrink-0 items-center rounded-full px-3 py-2"
                        style={{
                          background: "rgb(var(--bg))",
                          boxShadow: "var(--neu-raised-sm)",
                        }}
                      >
                        <img
                          src={LOGO_DARK_SRC}
                          alt="EsportM"
                          className="h-7 w-auto max-w-[132px] object-contain"
                        />
                      </div>

                      {/* top pills */}
                      <nav
                        className="app-top-nav hidden min-w-0 flex-1 items-center gap-1 overflow-visible sm:flex"
                      >
                        {topNav.map((item) => {
                          const on = item.key === active;
                          return (
                            <button
                              key={item.key}
                              onClick={() => {
                                setActive(item.key);
                                navigate(topNavTargets[item.key]);
                              }}
                              className={cx(
                                "app-top-nav-button inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                on && "app-top-nav-button-active"
                              )}
                              aria-label={item.label}
                              data-label={item.label}
                              style={{
                                background: on
                                  ? "rgb(var(--primary-2))"
                                  : "transparent",
                                color: on
                                  ? "rgb(255 255 255)"
                                  : "rgb(var(--text))",
                                boxShadow: on
                                  ? "inset 6px 6px 12px rgb(var(--shadow) / .24), inset -6px -6px 12px rgba(255,255,255,.18), -4px -4px 14px rgba(255,255,255,.9), 5px 6px 16px rgb(var(--shadow) / .2)"
                                  : undefined,
                              }}
                            >
                              {topNavIcon(item.key)}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="flex min-w-0 shrink-0 items-center gap-2">
                      <div
                        className="hidden rounded-2xl px-3 py-2 2xl:block"
                        style={{
                          background: "rgb(var(--bg))",
                          boxShadow: "var(--neu-raised-sm)",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="grid h-8 w-8 place-items-center rounded-xl"
                            style={{
                              background: "rgb(var(--bg))",
                              boxShadow: NEU_INSET,
                              color: "rgb(var(--text))",
                            }}
                          >
                            {activeClubDisplay.clubLogoUrl ? (
                              <img
                                src={activeClubDisplay.clubLogoUrl}
                                alt=""
                                className="h-full w-full rounded-xl object-cover"
                              />
                            ) : activeClubDisplay.hasClub ? (
                              <BadgeCheck size={16} />
                            ) : (
                              <Building2 size={16} />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[170px]">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                              Current Club
                            </p>
                            <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                              {activeClubDisplay.clubName}
                            </p>
                            <p className="truncate text-[10px] text-[rgb(var(--muted))]">
                              {activeClubDisplay.clubSlug || activeClubDisplay.clubId || "Waiting for assignment"}
                              {activeClubDisplay.role ? ` - ${activeClubDisplay.role}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden max-w-[140px] text-right xl:block">
                        <p className="truncate text-xs font-semibold text-[rgb(var(--text))]">
                          EsportM  -  {userLoading ? "Loading..." : formatDashboardRole(dashboardRole as DashboardRole)}
                        </p>
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]">{subtitle}</p>
                      </div>

                      {canSwitchRole && (
                        <select
                          value={dashboardRole}
                          onChange={(event) => onSwitchRole(event.target.value)}
                          className="max-w-[132px] rounded-full px-3 py-2 text-xs font-semibold outline-none"
                          style={{
                            background: "rgb(var(--bg))",
                            color: "rgb(var(--text))",
                            boxShadow: "var(--neu-raised-sm)",
                          }}
                          title="Switch authorized role context"
                        >
                          {switchableRoles.map((role) => (
                            <option key={role} value={role}>
                              {formatDashboardRole(role as DashboardRole)}
                            </option>
                          ))}
                        </select>
                      )}

                      {isPlatformAdmin && (
                        <button
                          onClick={() => navigate("/platform")}
                          className="hidden rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70 sm:inline-flex"
                          style={{
                            background: "rgb(var(--bg))",
                            color: "rgb(var(--text))",
                            boxShadow: "var(--neu-raised-sm)",
                          }}
                        >
                          Platform
                        </button>
                      )}

                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold"
                        style={{
                          background: "rgb(var(--bg))",
                          boxShadow: "var(--neu-raised-sm)",
                        }}
                        title={user.fullName}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          user.fullName?.trim()?.[0]?.toUpperCase() ?? "P"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* BODY */}
              <div className="flex min-h-0 flex-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                {/* Desktop sticky sidebar (glass) */}
                <div className="hidden shrink-0 p-2 md:block" style={{ width: 226 }}>
                  <div className="sticky top-[96px]">
                    <Sidebar
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      items={sidebarItems}
                      user={user}
                    />
                  </div>
                </div>

                {/* Mobile drawer */}
                <div className="md:hidden">
                  <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    items={sidebarItems}
                    user={user}
                  />
                </div>

                {/* Scroll only main */}
                <main className="dashboard-scroll min-w-0 flex-1 overflow-y-auto">
                  <div
                    className="mb-4 rounded-2xl px-4 py-3 lg:hidden"
                    style={{
                      background: "rgb(var(--bg))",
                      boxShadow: GLASS_SHADOW,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                        style={{
                          background: "rgb(var(--bg))",
                          color: "rgb(var(--text))",
                          boxShadow: NEU_INSET,
                        }}
                      >
                        {activeClubDisplay.clubLogoUrl ? (
                          <img
                            src={activeClubDisplay.clubLogoUrl}
                            alt=""
                            className="h-full w-full rounded-xl object-cover"
                          />
                        ) : activeClubDisplay.hasClub ? (
                          <BadgeCheck size={16} />
                        ) : (
                          <Building2 size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                          Current Club
                        </p>
                        <p className="truncate text-sm font-extrabold text-[rgb(var(--text))]">
                          {activeClubDisplay.clubName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* quick actions (mobile) */}
                  <div className="mb-4 flex justify-end gap-2 sm:hidden">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                      style={{
                        background: "rgb(var(--bg))",
                        boxShadow: "var(--neu-raised-sm)",
                      }}
                    >
                      <Home size={13} />
                      Home
                    </button>

                    <button
                      onClick={requestLogout}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                      style={{
                        background: "linear-gradient(135deg, rgba(239,68,68,.96), rgba(185,28,28,.93))",
                        border: "1px solid rgba(220, 38, 38, .42)",
                        boxShadow: "0 10px 24px rgba(239,68,68,.30)",
                      }}
                    >
                      <LogOut size={13} />
                      Logout
                    </button>
                  </div>

                  {/* Optional: small loading ribbon */}
                  {userLoading && (
                    <div
                      className="mb-3 rounded-2xl bg-white/50 px-4 py-3 text-sm"
                      style={{ boxShadow: NEU_INSET }}
                    >
                      Loading profile...
                    </div>
                  )}

                  {activeClubDisplay.hasClub && (
                    <div className="neu-compact-grid mb-3 grid xl:grid-cols-2">
                      <NotificationOverview
                        data={notificationsQuery.data}
                        isLoading={notificationsQuery.isLoading}
                        onMarkAsRead={handleMarkRead}
                      />
                      <ScheduleNotification
                        events={scheduleQuery.data}
                        isLoading={scheduleQuery.isLoading}
                        onViewCalendar={openScheduleCalendar}
                        referenceTimeMs={scheduleReferenceTimeMs}
                      />
                    </div>
                  )}

                  <Outlet context={outletContext} />
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="You will need to sign in again to access your dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}




