// import { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import NeuCard from "../components/NeuCard";
// import NeuInput from "../components/NeuInput";
// import NeuButton from "../components/NeuButton";
// import RoleSelect from "../components/RoleSelect";
// import { registerUser } from "../api/auth";

// export default function Register() {
//   const navigate = useNavigate();

//   // UI only
//   const [role, setRole] = useState("Player");

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   // if already logged in, go dashboard
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) navigate("/dashboard", { replace: true });
//   }, [navigate]);

//   const canSubmit = useMemo(() => {
//     return (
//       email.trim().length > 3 &&
//       password.trim().length >= 6 &&
//       // backend fullName optional, but for UI we want it
//       fullName.trim().length >= 2
//     );
//   }, [fullName, email, password]);

//   const onSubmit = async () => {
//     setErr(null);
//     if (!canSubmit || loading) return;

//     try {
//       setLoading(true);

//       const data = await registerUser({
//         email: email.trim(),
//         password: password.trim(),
//         fullName: fullName.trim(),
//       });

//       // you can auto-login after signup
//       localStorage.setItem("token", data.accessToken);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       navigate("/dashboard", { replace: true });
//     } catch (e: any) {
//       setErr(e?.response?.data?.message || e?.message || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-bg flex items-center justify-center p-4">
//       <div className="w-full max-w-5xl grid md:grid-cols-2 gap-5 items-stretch">
//         {/* Brand panel */}
//         <NeuCard className="relative overflow-hidden p-0">
//           <div className="h-full rounded-3xl bg-gradient-to-b from-[#5b5ea9] to-[#1c1f45] p-8 md:p-10 text-white flex flex-col justify-end">
//             <h1 className="text-4xl md:text-5xl font-bold">EsportM</h1>
//             <p className="mt-3 text-white/80 text-base md:text-lg max-w-sm">
//               Create your account to manage clubs, matches, stats and AI insights.
//             </p>
//           </div>
//         </NeuCard>

//         {/* Form panel */}
//         <NeuCard className="relative overflow-hidden p-0">
//           <div className="h-full rounded-3xl bg-[#5b5ea9] p-6 md:p-10">
//             <RoleSelect role={role} setRole={setRole} />

//             <h2 className="text-2xl font-bold text-white mt-6 mb-6">Signup</h2>

//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Full Name
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   placeholder="Your name"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   autoComplete="name"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Email
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   placeholder="Email address"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   autoComplete="email"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Password
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   type="password"
//                   placeholder="Minimum 6 characters"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && onSubmit()}
//                   autoComplete="new-password"
//                 />
//               </div>

//               {err && (
//                 <div className="rounded-2xl bg-white/15 text-white px-4 py-3 text-sm">
//                   {err}
//                 </div>
//               )}

//               <div className="pt-5 flex items-center justify-between gap-3">
//                 <Link to="/login" className="text-white/90 text-sm underline">
//                   Already have an account?
//                 </Link>

//                 <NeuButton
//                   onClick={onSubmit}
//                   disabled={!canSubmit || loading}
//                   className="bg-[#d6d85a] text-black shadow-none hover:opacity-95 active:scale-[0.98] px-10"
//                 >
//                   {loading ? "Creating..." : "Signup"}
//                 </NeuButton>
//               </div>
//             </div>
//           </div>
//         </NeuCard>
//       </div>
//     </div>
//   );
// }






































import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { registerUser } from "../api/auth";
import { getAccessToken, setAccessToken } from "../utils/authStorage";
import { getPasswordRuleStatus, isStrongPassword } from "../utils/passwordPolicy";

export default function Register() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  // --- State Management ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const trimmedPassword = password.trim();
  const passwordRules = useMemo(
    () => getPasswordRuleStatus(trimmedPassword),
    [trimmedPassword]
  );
  const matchedPasswordRules = passwordRules.filter((rule) => rule.met).length;
  const passwordProgress = (matchedPasswordRules / passwordRules.length) * 100;
  const passwordProgressColor =
    passwordProgress <= 50
      ? "#ef4444"
      : passwordProgress < 100
        ? "#f59e0b"
        : "#22c55e";
  const passwordRingRadius = 15;
  const passwordRingCircumference = 2 * Math.PI * passwordRingRadius;
  const passwordRingOffset =
    passwordRingCircumference * (1 - passwordProgress / 100);
  const passwordMeetsPolicy = isStrongPassword(trimmedPassword);
  const passwordsMatch = retypePassword.length > 0 && password === retypePassword;
  const steps = [
    {
      label: "Name",
      title: "What should we call you?",
      helper: "Use your real full name for invitations, clubs, and profile records.",
    },
    {
      label: "Email",
      title: "Where should we reach you?",
      helper: "This email becomes your login and account identity.",
    },
    {
      label: "Phone",
      title: "Add a phone number",
      helper: "Optional for now. You can skip this and complete it later.",
      optional: true,
    },
    {
      label: "Password",
      title: "Create a secure password",
      helper: "Use a mix of letters, number, and a special character.",
    },
    {
      label: "Confirm",
      title: "Confirm your password",
      helper: "Re-enter it once so we know there are no typos.",
    },
    {
      label: "Terms",
      title: "Review and finish",
      helper: "Confirm the terms to create your EsportM account.",
    },
  ];
  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  // --- Redirect if already logged in ---
  useEffect(() => {
    const token = getAccessToken() || localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  // --- Form Validation ---
  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 3 &&
      passwordMeetsPolicy &&
      password === retypePassword &&
      agreeTerms
    );
  }, [fullName, email, passwordMeetsPolicy, password, retypePassword, agreeTerms]);
  const canGoNext = useMemo(() => {
    if (step === 0) return fullName.trim().length >= 2;
    if (step === 1) return email.trim().length > 3;
    if (step === 2) return true;
    if (step === 3) return passwordMeetsPolicy;
    if (step === 4) return passwordsMatch;
    return agreeTerms;
  }, [agreeTerms, email, fullName, passwordMeetsPolicy, passwordsMatch, step]);

  const goBack = () => {
    setErr(null);
    setStep((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setErr(null);
    if (isLastStep) {
      void onSubmit();
      return;
    }
    if (!canGoNext) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const skipStep = () => {
    setErr(null);
    if (!currentStep.optional) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  // --- Backend Integration ---
  const onSubmit = async () => {
    setErr(null);
    if (!canSubmit || loading) return;

    if (password !== retypePassword) {
      setErr("Passwords do not match");
      return;
    }

    if (!passwordMeetsPolicy) {
      setErr("Password must match all security requirements.");
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        email: email.trim(),
        password: trimmedPassword,
        fullName: fullName.trim(),
      });

      setAccessToken(data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // --- GSAP Animations ---
  useGSAP(() => {
    gsap.from(".signup-card", {
      y: 24,
      opacity: 0,
      duration: 0.55,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="signup-neu-page px-4 py-6 font-sans text-slate-950 sm:px-6"
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <Link
            to="/"
            className="signup-neu-icon inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5F5EA6]"
            aria-label="Go home"
          >
            <ArrowLeft size={18} />
          </Link>
          <Link to="/login" className="signup-neu-ghost rounded-full px-4 py-2 text-sm font-bold text-[#5F5EA6]">
            Log in
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-6">
          <main className="signup-card signup-neu-card w-full max-w-[560px] rounded-[32px] p-5 sm:p-7">
            <div className="mb-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5F5EA6]/70">
                    Step {step + 1} of {steps.length}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#252454]">
                    Create Account
                  </h1>
                </div>
                <span className="signup-neu-surface rounded-full px-3 py-1 text-xs font-bold text-[#5F5EA6]">
                  {currentStep.label}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5" aria-hidden="true">
                {steps.map((item, index) => (
                  <span
                    key={item.label}
                    className={`h-1.5 rounded-full transition ${
                      index <= step ? "bg-[#5F5EA6]" : "bg-[#dce2f0]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <section className="min-h-[260px]">
              <p className="text-sm font-semibold text-[#5F5EA6]/75">{currentStep.helper}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#252454]">
                {currentStep.title}
              </h2>

              <div className="mt-8">
                {step === 0 ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#252454]">Full name</span>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5EA6]/65" />
                      <input
                        autoFocus
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && goNext()}
                        placeholder="Srijon Karmakar"
                        autoComplete="name"
                        className="signup-neu-input h-14 w-full rounded-2xl px-12 text-base text-[#252454] outline-none transition placeholder:text-[#5F5EA6]/45"
                      />
                    </div>
                  </label>
                ) : null}

                {step === 1 ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#252454]">Email address</span>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5EA6]/65" />
                      <input
                        autoFocus
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && goNext()}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="signup-neu-input h-14 w-full rounded-2xl px-12 text-base text-[#252454] outline-none transition placeholder:text-[#5F5EA6]/45"
                      />
                    </div>
                  </label>
                ) : null}

                {step === 2 ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#252454]">
                      Phone number
                    </span>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5EA6]/65" />
                      <input
                        autoFocus
                        type="tel"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && goNext()}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className="signup-neu-input h-14 w-full rounded-2xl px-12 text-base text-[#252454] outline-none transition placeholder:text-[#5F5EA6]/45"
                      />
                    </div>
                    <p className="mt-3 text-xs font-medium text-[#5F5EA6]/60">
                      Phone is not required for account creation.
                    </p>
                  </label>
                ) : null}

                {step === 3 ? (
                  <div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#252454]">Password</span>
                      <div className="relative">
                        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5EA6]/65" />
                        <input
                          autoFocus
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && goNext()}
                          placeholder="Create password"
                          autoComplete="new-password"
                          className="signup-neu-input h-14 w-full rounded-2xl px-12 pr-14 text-base text-[#252454] outline-none transition placeholder:text-[#5F5EA6]/45"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="signup-neu-icon absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#5F5EA6] focus:outline-none focus:ring-2 focus:ring-[#5F5EA6]/25"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>

                    <div className="mt-4 px-1 py-1">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold text-[#5F5EA6]/75">
                        <span>Password strength</span>
                        <span>
                          {matchedPasswordRules}/{passwordRules.length} matched
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-3">
                        <svg
                          viewBox="0 0 40 40"
                          className="h-10 w-10 shrink-0 -rotate-90"
                          aria-hidden="true"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r={passwordRingRadius}
                            fill="none"
                            stroke="#dce2f0"
                            strokeWidth="5"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r={passwordRingRadius}
                            fill="none"
                            stroke={passwordProgressColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={passwordRingCircumference}
                            strokeDashoffset={passwordRingOffset}
                            className="transition-all"
                          />
                        </svg>
                        <span className="text-xs font-bold text-[#5F5EA6]/70">
                          {Math.round(passwordProgress)}%
                        </span>
                      </div>
                      <ul className="flex flex-wrap gap-1.5 text-[11px] leading-none">
                        {passwordRules.map((rule) => (
                          <li
                            key={rule.id}
                            className={`flex h-5 items-center gap-1.5 ${
                              rule.met
                                ? "text-[#5F5EA6]"
                                : "text-[#5F5EA6]/55"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                rule.met ? "bg-[#5F5EA6]" : "bg-[#bdc7dd]"
                              }`}
                            />
                            {rule.shortLabel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {step === 4 ? (
                  <div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-[#252454]">
                        Confirm password
                      </span>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5F5EA6]/65" />
                        <input
                          autoFocus
                          type={showRetypePassword ? "text" : "password"}
                          value={retypePassword}
                          onChange={(event) => setRetypePassword(event.target.value)}
                          onKeyDown={(event) => event.key === "Enter" && goNext()}
                          placeholder="Re-type password"
                          autoComplete="new-password"
                          className="signup-neu-input h-14 w-full rounded-2xl px-12 pr-14 text-base text-[#252454] outline-none transition placeholder:text-[#5F5EA6]/45"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRetypePassword(!showRetypePassword)}
                          aria-label={showRetypePassword ? "Hide password confirmation" : "Show password confirmation"}
                          className="signup-neu-icon absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#5F5EA6] focus:outline-none focus:ring-2 focus:ring-[#5F5EA6]/25"
                        >
                          {showRetypePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>
                    {retypePassword ? (
                      <p
                        className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                          passwordsMatch
                            ? "bg-[#5F5EA6]/10 text-[#5F5EA6]"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {passwordsMatch ? <Check size={13} /> : null}
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {step === 5 ? (
                  <div className="space-y-4">
                    <div className="signup-neu-surface rounded-2xl p-4 text-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-[#5F5EA6]/15 pb-3">
                        <span className="font-semibold text-[#5F5EA6]/70">Name</span>
                        <span className="truncate font-bold text-[#252454]">{fullName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-3">
                        <span className="font-semibold text-[#5F5EA6]/70">Email</span>
                        <span className="truncate font-bold text-[#252454]">{email}</span>
                      </div>
                    </div>

                    <label className="signup-neu-surface flex cursor-pointer items-start gap-3 rounded-2xl p-4">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(event) => setAgreeTerms(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#5F5EA6]/30 text-[#5F5EA6] focus:ring-[#5F5EA6]/25"
                      />
                      <span className="text-sm leading-6 text-[#5F5EA6]/80">
                        I agree to the{" "}
                        <Link to="/terms" className="font-bold text-[#252454] hover:underline">
                          Terms & Condition
                        </Link>
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>

              {err ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {err}
                </div>
              ) : null}
            </section>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0 || loading}
                className="signup-neu-ghost inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-[#5F5EA6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex items-center gap-2">
                {currentStep.optional ? (
                  <button
                    type="button"
                    onClick={skipStep}
                    disabled={loading}
                    className="signup-neu-ghost h-11 rounded-full px-4 text-sm font-bold text-[#5F5EA6]"
                  >
                    Skip
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={goNext}
                  disabled={(!canGoNext && !isLastStep) || (isLastStep && !canSubmit) || loading}
                  className="signup-neu-button inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold disabled:cursor-not-allowed"
                >
                  {isLastStep ? (loading ? "Creating..." : "Sign Up") : "Next"}
                  {!isLastStep ? <ArrowRight size={16} /> : null}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
