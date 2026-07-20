import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
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

const modalPlanStyles: Record<
  string,
  { card: string; badge: string; icon: string; bar: string }
> = {
  STARTER: {
    card: "border-sky-200 bg-sky-50/75 text-slate-950",
    badge: "bg-sky-100 text-sky-800",
    icon: "text-sky-600",
    bar: "bg-sky-500",
  },
  PROFESSIONAL: {
    card: "border-emerald-500 bg-emerald-600 text-white shadow-xl shadow-emerald-900/20",
    badge: "bg-white text-emerald-700",
    icon: "text-emerald-600",
    bar: "bg-emerald-400",
  },
  ELITE: {
    card: "border-amber-200 bg-amber-50/85 text-slate-950",
    badge: "bg-amber-100 text-amber-800",
    icon: "text-amber-600",
    bar: "bg-amber-500",
  },
};

export function PrototypePricingProvider({ children }: { children: ReactNode }) {
  const hasToken = Boolean(getAccessToken());
  const meQuery = useMe({ enabled: hasToken });
  const meData = meQuery.data as any;
  const membership = useMemo(() => getActiveMembership(meData), [meData]);
  const scopeKey = useMemo(() => getScopeKey(meData, membership), [meData, membership]);
  const activeClubName = useMemo(() => getClubName(membership?.club), [membership]);
  const currentPlan = normalizeBillingPlan(membership?.club?.billingPlan);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [sessionUnlocks, setSessionUnlocks] = useState<Record<string, boolean>>({});

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
      if (hasFeatureAccess(featureKey)) {
        onContinue?.();
        return true;
      }

      setPendingRequest({ featureKey, onContinue });
      return false;
    },
    [hasFeatureAccess]
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
  const modalPlans = CLUB_PRICING_PLANS.map((plan) => ({
    ...plan,
    detail: PRICING_PLAN_DETAILS.find((row) => row.key === plan.key),
  }));

  return (
    <PricingContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(feature)} onOpenChange={(open) => !open && dismissPrototype()}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[900px] overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:w-[calc(100vw-2rem)]">
          {feature ? (
            <div className="max-h-[90dvh] overflow-y-auto">
              <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 pb-5 pt-5 text-white sm:px-7 sm:pt-7">
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <Badge className="border-white/20 bg-white/10 text-white">
                    Current: {planLabel(currentPlan)}
                  </Badge>
                  <Badge className="bg-emerald-300 text-emerald-950">
                    Recommended: {planLabel(feature.requiredPlan)}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-normal text-white sm:text-3xl">
                  Upgrade for {feature.title}
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  {feature.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {modalPlans.map((plan) => {
                    const isRecommended = plan.key === feature.requiredPlan;
                    const style = modalPlanStyles[plan.key] ?? modalPlanStyles.STARTER;
                    return (
                      <div
                        key={plan.key}
                        className={`relative flex min-h-[172px] overflow-hidden rounded-lg border p-4 transition ${style.card}`}
                      >
                        <span className={`absolute inset-x-0 top-0 h-1 ${style.bar}`} />
                        <div className="flex min-h-7 flex-wrap items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold tracking-normal">
                            {plan.name}
                          </h3>
                          {isRecommended ? (
                            <Badge className={`shrink-0 ${style.badge}`}>
                              Best value
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-4 text-2xl font-bold tracking-normal">
                          {plan.price}
                        </p>
                        <p
                          className={`mt-2 text-sm leading-5 ${
                            isRecommended ? "text-emerald-50" : "text-slate-600"
                          }`}
                        >
                          {plan.note}
                        </p>
                        <div
                          className={`mt-auto pt-4 text-xs ${
                            isRecommended ? "text-emerald-50" : "text-slate-500"
                          }`}
                        >
                          {plan.detail?.members} members | {plan.detail?.storage} storage
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

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                  <p className="text-sm font-semibold tracking-normal text-slate-950">
                    Included in {feature.shortTitle}
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                    {feature.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex min-h-12 items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm leading-5 text-slate-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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
