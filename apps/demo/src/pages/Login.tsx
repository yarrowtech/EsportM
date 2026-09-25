

// import { useEffect, useMemo, useState, useRef } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";
// import { loginUser } from "../api/auth";

// export default function Login() {
//   const navigate = useNavigate();
//   const containerRef = useRef<HTMLDivElement>(null);

//   // State Management
//   const [role, setRole] = useState("Player");
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   // Redirect if already logged in
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) navigate("/dashboard", { replace: true });
//   }, [navigate]);

//   // Form Validation
//   const canSubmit = useMemo(
//     () => email.trim().length > 3 && password.trim().length >= 6,
//     [email, password]
//   );

//   // Backend Integration
//   const onSubmit = async () => {
//     setErr(null);
//     if (!canSubmit || loading) return;

//     try {
//       setLoading(true);
//       const data = await loginUser({
//         email: email.trim(),
//         password: password.trim(),
//       });

//       localStorage.setItem("token", data.accessToken);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       navigate("/dashboard", { replace: true });
//     } catch (e: any) {
//       setErr(e?.response?.data?.message || e?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // GSAP Animation
//   useGSAP(() => {
//     gsap.from(".gsap-anim", {
//       y: 40,
//       opacity: 0,
//       duration: 0.8,
//       stagger: 0.15,
//       ease: "power3.out",
//     });
//   }, { scope: containerRef });

//   return (
//     <div
//       ref={containerRef}
//       className="min-h-screen bg-[#e5e5f6] flex items-center justify-center p-4 md:p-10 font-sans"
//     >
//       <div className="w-full max-w-[900px] flex flex-col md:flex-row items-center md:items-stretch gap-0 md:gap-4 relative mt-10 md:mt-0">

//         {/* --- Mobile Home Button --- */}
//         <div className="md:hidden flex w-full justify-start mb-4 gsap-anim">
//           <Link
//             to="/"
//             className="bg-[#e5e5f6] p-4 rounded-xl shadow-[5px_5px_10px_#c3c3d1,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_#c3c3d1,inset_-4px_-4px_8px_#ffffff] transition-all"
//           >
//             <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
//               <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
//             </svg>
//           </Link>
//         </div>

//         {/* --- Desktop Left Floating Home Button --- */}
//         <div className="hidden md:flex flex-col justify-start pt-12 gsap-anim z-10">
//           <div className="bg-[#aeb1f4] rounded-l-xl p-3 shadow-[-4px_4px_10px_rgba(0,0,0,0.1)] mr-[-10px] pr-5">
//             <Link
//               to="/"
//               className="bg-[#f0f1ff] w-10 h-10 rounded-full flex items-center justify-center shadow-[inset_2px_2px_5px_#c9cbed,inset_-2px_-2px_5px_#ffffff] hover:scale-105 active:scale-95 transition-all"
//             >
//               <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
//               </svg>
//             </Link>
//           </div>
//         </div>

//         {/* --- Left Branding Card --- */}
//         <div className="gsap-anim flex-1 w-full bg-[#35365e] rounded-[1.5rem] p-10 flex flex-col justify-end min-h-[350px] md:min-h-[450px] shadow-[12px_12px_24px_#c8c8d7,-12px_-12px_24px_#ffffff] z-20">
//           <h1 className="text-white text-4xl md:text-5xl font-semibold mb-2 tracking-tight">EsportM</h1>
//           <p className="text-white/80 text-base md:text-lg leading-snug">
//             Ai Powered sports<br />management system
//           </p>
//         </div>

//         {/* --- Right Form Card --- */}
//         <div className="gsap-anim flex-1 w-full relative mt-16 md:mt-0 z-30">

//           {/* Top Role Selector Tab */}
//           <div className="absolute -top-10 left-0">
//             <button 
//               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//               className="bg-[#6b6d8d] text-white/90 px-5 py-2.5 rounded-t-xl flex items-center gap-10 hover:bg-[#5b5d7d] transition-colors"
//             >
//               <span className="text-sm">{role}</span>
//               <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {/* Dropdown Menu (mocked styling) */}
//             {isDropdownOpen && (
//               <div className="absolute top-full left-0 w-full bg-[#4e5072] text-white rounded-b-xl shadow-lg overflow-hidden z-50">
//                 <div className="px-5 py-2 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setRole("Player"); setIsDropdownOpen(false); }}>Player</div>
//                 <div className="px-5 py-2 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setRole("Manager"); setIsDropdownOpen(false); }}>Manager</div>
//                 <div className="px-5 py-2 hover:bg-white/10 cursor-pointer text-sm" onClick={() => { setRole("Admin"); setIsDropdownOpen(false); }}>Admin</div>
//               </div>
//             )}
//           </div>

//           {/* Form Container */}
//           <div className="bg-[#595c97] rounded-[1.5rem] rounded-tl-none p-8 md:p-10 h-full shadow-[12px_12px_24px_#c8c8d7,-12px_-12px_24px_#ffffff] flex flex-col justify-center">
//             <h2 className="text-white text-xl md:text-2xl font-medium mb-8">Login</h2>

//             <div className="space-y-5">
//               {/* Email Input */}
//               <div>
//                 <label className="text-white/90 text-sm font-medium mb-1.5 block">Email</label>
//                 <input
//                   type="email"
//                   placeholder="Enter email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full bg-[#ebecf5] text-gray-800 rounded-sm p-3 shadow-[inset_3px_3px_6px_#c3c4cc,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#d6db53]/50 transition-all placeholder:text-gray-400"
//                 />
//               </div>

//               {/* Password Input */}
//               <div>
//                 <label className="text-white/90 text-sm font-medium mb-1.5 block">Password</label>
//                 <input
//                   type="password"
//                   placeholder="Enter password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && onSubmit()}
//                   className="w-full bg-[#ebecf5] text-gray-800 rounded-sm p-3 shadow-[inset_3px_3px_6px_#c3c4cc,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#d6db53]/50 transition-all placeholder:text-gray-400"
//                 />
//               </div>

//               {/* Error Message */}
//               {err && (
//                 <div className="text-[#ffb3b3] bg-red-500/10 p-3 rounded-lg text-sm text-center border border-red-500/20">
//                   {err}
//                 </div>
//               )}

//               {/* Links & Submit */}
//               <div className="pt-6 flex flex-col items-center gap-6">
//                 <NeuButton 
//                   onClick={onSubmit} 
//                   disabled={!canSubmit || loading}
//                   loading={loading}
//                 />

//                 <Link to="/register" className="text-white/70 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white/50 pb-0.5">
//                   Create account
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// // Custom Neumorphic Button component to keep JSX clean
// const NeuButton = ({ onClick, disabled, loading }: { onClick: () => void, disabled: boolean, loading: boolean }) => (
//   <button
//     onClick={onClick}
//     disabled={disabled}
//     className={`
//       bg-[#d7dc5b] text-[#1c1d1a] font-medium px-12 py-2.5 rounded-full 
//       shadow-[4px_4px_10px_#42446f,-4px_-4px_10px_#7074bf]
//       transition-all duration-200 ease-in-out
//       hover:scale-105
//       active:scale-95 active:shadow-[inset_3px_3px_6px_#b6bb4d,inset_-3px_-3px_6px_#f8ff69] active:translate-y-1
//       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_10px_#42446f,-4px_-4px_10px_#7074bf]
//     `}
//   >
//     {loading ? "Logging in..." : "Login"}
//   </button>
// );



















































import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { loginUser, type AuthResponse } from "../api/auth";
import { getMe } from "../api/admin.api";
import { setAccessToken } from "../utils/authStorage";
import { resolveDashboardLanding, type DashboardRole } from "../utils/dashboardRouting";

const LS = {
  accessToken: "accessToken",
  user: "user",
  activeClubId: "activeClubId",
} as const;

export default function Login() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.trim().length >= 6,
    [email, password]
  );

  const clearAuth = () => {
    localStorage.removeItem(LS.accessToken);
    localStorage.removeItem("token"); // âœ… legacy cleanup
    localStorage.removeItem(LS.user);
    localStorage.removeItem(LS.activeClubId);
    localStorage.removeItem("activeDashboardRole");
  };

  const goByLanding = useCallback((landing: { path: string; dashboardRole: DashboardRole }) => {
    localStorage.setItem("activeDashboardRole", landing.dashboardRole);
    navigate(landing.path, { replace: true });
  }, [navigate]);




  // âœ… Redirect if already logged in
  useEffect(() => {
    let alive = true;

    (async () => {
      const token = localStorage.getItem(LS.accessToken);
      if (!token) return;

      try {
        const meData = await getMe();
        const landing = resolveDashboardLanding(meData, localStorage.getItem("activeDashboardRole"));

        if (!alive) return;

        if (meData?.user) localStorage.setItem(LS.user, JSON.stringify(meData.user));
        const activeClubId = (meData as any)?.activeClubId;
        if (activeClubId) localStorage.setItem(LS.activeClubId, activeClubId);

        goByLanding(landing);
      } catch {
        clearAuth();
      }
    })();

    return () => {
      alive = false;
    };
  }, [goByLanding]);

  const onSubmit = async () => {
    setErr(null);
    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      const data: AuthResponse = await loginUser({
        email: email.trim(),
        password: password.trim(),
      });

      // clear stale previous account context before resolving /auth/me
      localStorage.removeItem(LS.activeClubId);
      localStorage.removeItem("activeDashboardRole");

      // âœ… store token in one place (and remove legacy "token")
      setAccessToken(data.accessToken);

      // store user snapshot (optional)
      localStorage.setItem(LS.user, JSON.stringify(data.user ?? {}));

      // resolve role from authoritative /auth/me active membership
      const meData = await getMe();
      const landing = resolveDashboardLanding(meData);

      if (meData?.user) localStorage.setItem(LS.user, JSON.stringify(meData.user));
      const activeClubId = (meData as any)?.activeClubId;
      if (activeClubId) localStorage.setItem(LS.activeClubId, activeClubId);

      goByLanding(landing);
    } catch (e: any) {
      clearAuth();
      setErr(e?.response?.data?.message || e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useGSAP(
    () => {
      gsap.from(".glass-card", { y: 50, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".anim-item", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.3,
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-white to-white flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans"
    >
      <div className="glass-card w-full max-w-[1100px] bg-[#a4a5eb]/20 backdrop-blur-xl border border-black/20 rounded-[2rem] font-black shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT IMAGE */}
        <div className="relative w-full lg:w-1/2 min-h-[250px] sm:min-h-[350px] lg:min-h-full p-4 lg:p-6 hidden sm:block">
          <div className="w-full h-full flex items-center justify-center rounded-[1.5rem] overflow-hidden bg-black/5">
            <img
              src="/images/login-image.jpg"
              alt="VR Esport"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-center relative">
          <Link
            to="/"
            className="anim-item absolute top-6 left-6 lg:top-10 lg:left-10 text-black/70 hover:text-[#d5d200] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="max-w-md mx-auto w-full mt-8 lg:mt-0">
            <div className="anim-item mb-8">
              <h1 className="text-3xl lg:text-4xl font-semibold text-black mb-2">Log in</h1>
              <p className="text-black/70 text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="text-black font-medium hover:underline">
                  Create an Account
                </Link>
              </p>
            </div>

            <div className="space-y-5">
              <div className="anim-item">
                <label className="text-black/90 text-sm font-medium mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 border border-black/20 text-black rounded-full px-5 py-3 focus:outline-none focus:border-black/50 focus:bg-black/10 transition-all"
                />
              </div>

              <div className="anim-item">
                <label className="text-black/90 text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                    className="w-full bg-black/5 border border-black/20 text-black rounded-full px-5 py-3 pr-12 focus:outline-none focus:border-black/50 focus:bg-black/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {err && (
                <div className="anim-item text-red-600 bg-red-100 p-3 rounded-lg text-sm text-center">
                  {err}
                </div>
              )}

              <div className="anim-item pt-2">
                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || loading}
                  className="w-full bg-white text-black font-semibold rounded-full py-3.5 hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </div>

              {/* <div className="anim-item text-xs text-black/50 text-center">
                Tip: If you still see 401/403 on <span className="font-mono">/auth/me</span>, your API client must attach{" "}
                <span className="font-mono">Authorization: Bearer</span>.
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

