import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { billingApi, type BillingPlanCheckoutKey } from "../../api/billing.api";
import { useMe } from "../../hooks/useMe";
import { getAccessToken } from "../../utils/authStorage";
import {
  CLUB_PRICING_PLANS,
  FEATURE_PRICING,
  PLAYER_PRO_PLAN,
  PRICING_PLAN_DETAILS,
  normalizeBillingPlan,
  planMeetsRequirement,
  type BillingPlanKey,
  type PricingFeatureKey,
} from "./pricing";

type PendingRequest = {
  featureKey: PricingFeatureKey;
  onContinue?: () => void;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayConstructorOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayConstructorOptions) => { open: () => void };
  }
}

type PricingContextValue = {
  currentPlan: BillingPlanKey;
  activeClubName: string | null;
  isPrototypeMode: boolean;
  hasFeatureAccess: (featureKey: PricingFeatureKey) => boolean;
  requestFeatureAccess: (
    featureKey: PricingFeatureKey,
    onContinue?: () => void
  ) => boolean;
  runWithPricingLayer: (featureKey: PricingFeatureKey, action: () => void) => void;
};

const PricingContext = createContext<PricingContextValue | null>(null);
const isPrototypeMode = import.meta.env.VITE_PRICING_LOCK_MODE !== "locked";

function getActiveMembership(meData: any) {
  const memberships = Array.isArray(meData?.memberships) ? meData.memberships : [];
  return (
    meData?.activeMembership ||
    memberships.find((membership: any) => membership?.clubId === meData?.activeClubId) ||
    memberships[0] ||
    null
  );
}

function getClubName(club: unknown) {
  if (!club) return null;
  if (typeof club === "string") return club;
  return String((club as { name?: string })?.name || "").trim() || null;
}

function getScopeKey(meData: any, membership: any) {
  const userId = meData?.user?.id || meData?.user?._id || meData?.id || "guest";
  return membership?.clubId ? `club:${membership.clubId}` : `player:${userId}`;
}

function storageKey(scopeKey: string, featureKey: PricingFeatureKey) {
  return `prototype-pricing:${scopeKey}:${featureKey}`;
}

function readPrototypeAccess(scopeKey: string, featureKey: PricingFeatureKey) {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(storageKey(scopeKey, featureKey)) === "1";
}

function writePrototypeAccess(scopeKey: string, featureKey: PricingFeatureKey) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(storageKey(scopeKey, featureKey), "1");
}

function planLabel(plan: BillingPlanKey) {
  if (plan === "FREE") return "Free";
  if (plan === "STARTER") return "Starter";
  if (plan === "PROFESSIONAL") return "Professional";
  if (plan === "ELITE") return "Elite";
  return "Enterprise";
}

function formatAnnualPrice(price: string | undefined) {
  if (!price) return "";
  return price.replace(/^INR\s+/, "");
}

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser unavailable"));
  if (window.Razorpay) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}

const modalPlanStyles: Record<
  string,
  { card: string; badge: string; button: string; glow: string }
> = {
  STARTER: {
    card: "border-cyan-200/80 bg-cyan-50/70",
    badge: "bg-cyan-100 text-cyan-800",
    button: "bg-cyan-500 text-white",
    glow: "bg-cyan-200/50",
  },
  PROFESSIONAL: {
    card: "border-indigo-200/90 bg-indigo-50/80 shadow-xl shadow-indigo-950/10",
    badge: "bg-slate-900 text-white",
    button: "bg-indigo-500 text-white",
    glow: "bg-indigo-300/50",
  },
  ELITE: {
    card: "border-amber-200/80 bg-amber-50/75",
    badge: "bg-amber-100 text-amber-800",
    button: "bg-amber-500 text-white",
    glow: "bg-amber-200/50",
  },
};

export function PrototypePricingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(getAccessToken());
  const meQuery = useMe({ enabled: hasToken });
  const meData = meQuery.data as any;
  const membership = useMemo(() => getActiveMembership(meData), [meData]);
  const scopeKey = useMemo(() => getScopeKey(meData, membership), [meData, membership]);
  const activeClubName = useMemo(() => getClubName(membership?.club), [membership]);
  const currentPlan = normalizeBillingPlan(membership?.club?.billingPlan);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [sessionUnlocks, setSessionUnlocks] = useState<Record<string, boolean>>({});
  const [checkoutPlan, setCheckoutPlan] = useState<BillingPlanCheckoutKey | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const hasFeatureAccess = useCallback(
    (featureKey: PricingFeatureKey) => {
      const feature = FEATURE_PRICING[featureKey];
      if (planMeetsRequirement(currentPlan, feature.requiredPlan)) return true;
      if (!isPrototypeMode) return false;
      return Boolean(sessionUnlocks[featureKey]) || readPrototypeAccess(scopeKey, featureKey);
    },
    [currentPlan, scopeKey, sessionUnlocks]
  );

  const dismissPrototype = useCallback(() => {
    if (!pendingRequest) return;
    writePrototypeAccess(scopeKey, pendingRequest.featureKey);
    setSessionUnlocks((prev) => ({ ...prev, [pendingRequest.featureKey]: true }));
    setPendingRequest(null);
    pendingRequest.onContinue?.();
  }, [pendingRequest, scopeKey]);

  const requestFeatureAccess = useCallback(
    (featureKey: PricingFeatureKey, onContinue?: () => void) => {
      const feature = FEATURE_PRICING[featureKey];
      if (planMeetsRequirement(currentPlan, feature.requiredPlan)) {
        onContinue?.();
        return true;
      }

      setPendingRequest({ featureKey, onContinue });
      return false;
    },
    [currentPlan]
  );

  const runWithPricingLayer = useCallback(
    (featureKey: PricingFeatureKey, action: () => void) => {
      requestFeatureAccess(featureKey, action);
    },
    [requestFeatureAccess]
  );

  const value = useMemo<PricingContextValue>(
    () => ({
      currentPlan,
      activeClubName,
      isPrototypeMode,
      hasFeatureAccess,
      requestFeatureAccess,
      runWithPricingLayer,
    }),
    [
      currentPlan,
      activeClubName,
      hasFeatureAccess,
      requestFeatureAccess,
      runWithPricingLayer,
    ]
  );

  const feature = pendingRequest ? FEATURE_PRICING[pendingRequest.featureKey] : null;
  const isIndividual = !membership?.clubId;
  const activeClubId = String(membership?.clubId || "");
  const isClubAdmin = String(membership?.primary || "").toUpperCase() === "ADMIN";
  const modalPlans = CLUB_PRICING_PLANS.map((plan) => ({
    ...plan,
    detail: PRICING_PLAN_DETAILS.find((row) => row.key === plan.key),
  }));

  const startCheckout = useCallback(
    async (plan: BillingPlanCheckoutKey) => {
      if (!activeClubId) {
        setCheckoutError("Join or create a club before upgrading.");
        return;
      }
      setCheckoutPlan(plan);
      setCheckoutError(null);
      setCheckoutMessage(null);

      try {
        await loadRazorpayCheckout();
        const order = await billingApi.createRazorpayOrder(activeClubId, plan, "annual");
        if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");

        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.order.amount,
          currency: order.order.currency,
          name: "EsportM",
          description: `${planLabel(plan)} annual club plan`,
          order_id: order.order.id,
          prefill: {
            name: String(meData?.user?.fullName || ""),
            email: String(meData?.user?.email || ""),
          },
          notes: {
            clubId: activeClubId,
            plan,
            billingCycle: "annual",
          },
          theme: { color: "#4f46e5" },
          handler: async (response) => {
            try {
              await billingApi.verifyRazorpayPayment({
                clubId: activeClubId,
                plan,
                billingCycle: "annual",
                ...response,
              });
              await queryClient.invalidateQueries({ queryKey: ["me"] });
              setCheckoutMessage(`${planLabel(plan)} plan activated.`);
              const continuation = pendingRequest?.onContinue;
              setPendingRequest(null);
              continuation?.();
            } catch (error: any) {
              setCheckoutError(
                error?.response?.data?.message ||
                  error?.message ||
                  "Payment verification failed"
              );
            } finally {
              setCheckoutPlan(null);
            }
          },
          modal: {
            ondismiss: () => setCheckoutPlan(null),
          },
        });
        checkout.open();
      } catch (error: any) {
        setCheckoutPlan(null);
        setCheckoutError(
          error?.response?.data?.message || error?.message || "Unable to start checkout"
        );
      }
    },
    [activeClubId, meData, pendingRequest, queryClient]
  );

  return (
    <PricingContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(feature)} onOpenChange={(open) => !open && dismissPrototype()}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[960px] overflow-hidden rounded-[24px] border-slate-200 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:w-[calc(100vw-2rem)]">
          {feature ? (
            <div className="max-h-[90dvh] overflow-y-auto bg-white">
              <DialogHeader className="relative overflow-hidden border-b border-slate-100 px-5 pb-6 pt-6 text-center sm:px-8 sm:pt-8">
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 22rem), linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
                    backgroundSize: "auto, 56px 56px, 56px 56px",
                  }}
                  aria-hidden="true"
                />
                <div className="relative mx-auto flex max-w-3xl flex-col items-center pr-8">
                  <Badge className="rounded-full border-indigo-200 bg-indigo-50 px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-800">
                    Paid feature
                  </Badge>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge className="rounded-full border-slate-200 bg-white/85 text-slate-700">
                    Current: {planLabel(currentPlan)}
                    </Badge>
                    <Badge className="rounded-full bg-indigo-100 text-indigo-800">
                      Recommended: {planLabel(feature.requiredPlan)}
                    </Badge>
                  </div>
                  <DialogTitle className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
                    Upgrade for {feature.title}
                  </DialogTitle>
                  <DialogDescription className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    {feature.description}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-5 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {modalPlans.map((plan) => {
                    const isRecommended = plan.key === feature.requiredPlan;
                    const style = modalPlanStyles[plan.key] ?? modalPlanStyles.STARTER;
                    return (
                      <div
                        key={plan.key}
                        className={`relative flex min-h-[252px] flex-col overflow-hidden rounded-[20px] border p-5 text-slate-950 transition ${
                          style.card
                        } ${isRecommended ? "md:-mt-4" : ""}`}
                      >
                        <div className={`absolute -right-10 -top-16 h-36 w-36 rounded-full blur-3xl ${style.glow}`} />
                        <div
                          className="absolute inset-0 opacity-45"
                          style={{
                            backgroundImage:
                              "linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
                            backgroundSize: "18px 18px",
                            maskImage: "linear-gradient(to bottom, black, transparent 72%)",
                          }}
                          aria-hidden="true"
                        />
                        {isRecommended ? (
                          <div className="absolute -top-2 right-5 rotate-[-6deg] rounded-full bg-slate-900 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-lg">
                            Most popular
                          </div>
                        ) : null}

                        <div className="relative z-10 flex flex-1 flex-col">
                          <div className="flex min-h-7 flex-wrap items-start justify-between gap-2">
                            <h3 className="text-xl font-semibold tracking-normal">
                              {plan.name}
                            </h3>
                          {isRecommended ? (
                            <Badge className={`shrink-0 ${style.badge}`}>
                              Best value
                            </Badge>
                          ) : null}
                          </div>
                          <p className="mt-4 text-3xl font-semibold tracking-normal">
                            INR {formatAnnualPrice(plan.detail?.effectiveMonthly)}/mo
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {plan.detail?.annual} yearly; 10 months charged for 12 months service
                          </p>
                          <p className="mt-3 text-sm leading-5 text-slate-600">{plan.note}</p>
                          <dl className="mt-5 grid gap-2 text-xs text-slate-600">
                            <div className="flex justify-between gap-3">
                              <dt>Active members</dt>
                              <dd className="font-semibold text-slate-900">
                                {plan.detail?.members}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt>Squads</dt>
                              <dd className="font-semibold text-slate-900">
                                {plan.detail?.squads}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt>Storage</dt>
                              <dd className="font-semibold text-slate-900">
                                {plan.detail?.storage}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt>AI requests/mo</dt>
                              <dd className="font-semibold text-slate-900">
                                {plan.detail?.aiRequests}
                              </dd>
                            </div>
                          </dl>
                          {isClubAdmin ? (
                            <button
                              type="button"
                              onClick={() => startCheckout(plan.key as BillingPlanCheckoutKey)}
                              disabled={checkoutPlan === plan.key}
                              className={`mt-5 h-10 rounded-full px-4 text-sm font-semibold shadow-lg transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70 ${style.button}`}
                            >
                              {checkoutPlan === plan.key ? "Opening checkout..." : "Upgrade with Razorpay"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isIndividual ? (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tracking-normal text-slate-950">
                          {PLAYER_PRO_PLAN.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{PLAYER_PRO_PLAN.note}</p>
                      </div>
                      <p className="text-base font-bold tracking-normal text-slate-950">
                        {PLAYER_PRO_PLAN.price}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!isClubAdmin && !isIndividual ? (
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    This service is available to your role after the club upgrades. Ask a club admin
                    to activate the recommended plan.
                  </div>
                ) : null}

                {checkoutError ? (
                  <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {checkoutError}
                  </div>
                ) : null}

                {checkoutMessage ? (
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {checkoutMessage}
                  </div>
                ) : null}

                <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                  <p className="text-sm font-semibold tracking-normal text-slate-950">
                    Included in {feature.shortTitle}
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                    {feature.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex min-h-12 items-start gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-3 text-sm leading-5 text-slate-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeClubName ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-950">Plan context:</span>{" "}
                    {activeClubName}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PricingContext.Provider>
  );
}

export function usePrototypePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) {
    throw new Error("usePrototypePricing must be used inside PrototypePricingProvider");
  }
  return ctx;
}
