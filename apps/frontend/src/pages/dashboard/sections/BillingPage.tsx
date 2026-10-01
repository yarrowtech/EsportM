import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CreditCard, ShieldCheck } from "lucide-react";
import {
  billingApi,
  type BillingCycle,
  type BillingPlanCheckoutKey,
} from "../../../api/billing.api";
import { useMe } from "../../../hooks/useMe";
import {
  PRICING_PLAN_DETAILS,
  FEATURE_PRICING,
  PRICING_FEATURE_MATRIX,
  normalizeBillingPlan,
  planMeetsRequirement,
  type BillingPlanKey,
} from "../../../features/prototype-pricing/pricing";
import { adminCardBorder, formatDateTime } from "../../admin/admin-ui";

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

const checkoutPlans = PRICING_PLAN_DETAILS.filter((plan) =>
  ["STARTER", "PROFESSIONAL", "ELITE"].includes(plan.key)
);

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function amountFor(plan: (typeof PRICING_PLAN_DETAILS)[number], cycle: BillingCycle) {
  const raw = cycle === "monthly" ? plan.monthly : plan.annual;
  return Number(String(raw).replace(/[^0-9]/g, "")) || 0;
}

function planRank(plan: BillingPlanKey) {
  return ["FREE", "STARTER", "PROFESSIONAL", "ELITE", "ENTERPRISE"].indexOf(plan);
}

function dateValue(input?: string | null) {
  if (!input) return null;
  const value = new Date(input).getTime();
  return Number.isFinite(value) ? value : null;
}

function daysBetween(fromMs: number, toMs: number) {
  return Math.max(0, Math.ceil((toMs - fromMs) / 86_400_000));
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const meData = meQuery.data as any;
  const membership = meData?.activeMembership || meData?.memberships?.[0] || null;
  const clubId = String(membership?.clubId || "");
  const isAdmin = String(membership?.primary || "").toUpperCase() === "ADMIN";
  const user = meData?.user || {};
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [referenceTimeMs, setReferenceTimeMs] = useState<number | null>(null);

  const billingQuery = useQuery({
    queryKey: ["billing-summary", clubId],
    queryFn: () => billingApi.summary(clubId),
    enabled: !!clubId,
  });

  const summary = billingQuery.data || {};
  const currentPlan = normalizeBillingPlan(
    summary?.club?.effectiveBillingPlan || summary?.club?.billingPlan || membership?.club?.billingPlan
  );
  const purchasedPlan = normalizeBillingPlan(summary?.club?.billingPlan || membership?.club?.billingPlan);
  const currentPlanDetail = PRICING_PLAN_DETAILS.find((plan) => plan.key === currentPlan);
  const subscriptionProgress = useMemo(() => {
    const startMs = dateValue(summary?.club?.subscriptionStartAt);
    const endMs = dateValue(summary?.club?.subscriptionNextBillingAt);
    const nowMs = referenceTimeMs;
    if (!startMs || !endMs || !nowMs || endMs <= startMs) {
      return {
        hasPeriod: false,
        elapsedPercent: 0,
        remainingPercent: 0,
        daysLeft: 0,
        totalDays: 0,
        isExpired: false,
      };
    }

    const elapsedPercent = Math.min(100, Math.max(0, ((nowMs - startMs) / (endMs - startMs)) * 100));
    return {
      hasPeriod: true,
      elapsedPercent,
      remainingPercent: Math.max(0, 100 - elapsedPercent),
      daysLeft: daysBetween(nowMs, endMs),
      totalDays: daysBetween(startMs, endMs),
      isExpired: nowMs >= endMs,
    };
  }, [referenceTimeMs, summary?.club?.subscriptionNextBillingAt, summary?.club?.subscriptionStartAt]);

  useEffect(() => {
    setReferenceTimeMs(Date.now());
  }, []);

  const featureRows = useMemo(
    () =>
      Object.values(FEATURE_PRICING).map((feature) => ({
        ...feature,
        enabled: planMeetsRequirement(currentPlan, feature.requiredPlan),
      })),
    [currentPlan]
  );

  const startCheckout = async (plan: BillingPlanCheckoutKey) => {
    if (!clubId) return;
    setBusyPlan(plan);
    setError(null);
    setMessage(null);
    try {
      await loadRazorpayCheckout();
      const order = await billingApi.createRazorpayOrder(clubId, plan, cycle);
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.order.amount,
        currency: order.order.currency,
        name: "EsportM",
        description: `${plan} ${cycle} club plan`,
        order_id: order.order.id,
        prefill: {
          name: String(user.fullName || ""),
          email: String(user.email || ""),
        },
        notes: { clubId, plan, billingCycle: cycle },
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          await billingApi.verifyRazorpayPayment({
            clubId,
            plan,
            billingCycle: cycle,
            ...response,
          });
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ["billing-summary", clubId] }),
            queryClient.refetchQueries({ queryKey: ["me"] }),
          ]);
          setMessage(`${plan} plan activated.`);
          setBusyPlan(null);
        },
        modal: { ondismiss: () => setBusyPlan(null) },
      });
      checkout.open();
    } catch (err: any) {
      setBusyPlan(null);
      setError(err?.response?.data?.message || err?.message || "Unable to start checkout");
    }
  };

  const scheduleDowngrade = async (plan: string) => {
    setBusyPlan(plan);
    setError(null);
    setMessage(null);
    try {
      await billingApi.scheduleDowngrade(clubId, plan);
      await queryClient.invalidateQueries({ queryKey: ["billing-summary", clubId] });
      setMessage(`${plan} downgrade scheduled for next renewal.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to schedule downgrade");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="space-y-5">
      <section
        className="rounded-3xl border bg-white/60 p-5 backdrop-blur-xl"
        style={{ borderColor: adminCardBorder }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[rgb(var(--muted))]">
              Billing
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-[rgb(var(--text))]">
              Plan and payments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
              Manage club upgrades, billing cycle, paid services and recent Razorpay payments.
            </p>
          </div>
          <div className="rounded-2xl border bg-white/70 px-4 py-3 text-sm" style={{ borderColor: adminCardBorder }}>
            <p className="font-semibold text-[rgb(var(--text))]">{summary?.club?.name || membership?.club?.name || "Club"}</p>
            <p className="text-[rgb(var(--muted))]">
              {isAdmin ? "Admin billing controls enabled" : "Read-only billing access"}
            </p>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            error ? "text-rose-700" : "text-emerald-700"
          }`}
          style={{ borderColor: error ? "rgba(244,63,94,.35)" : "rgba(34,197,94,.35)", background: "rgba(255,255,255,.68)" }}
        >
          {error || message}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white/60 p-5 lg:col-span-1" style={{ borderColor: adminCardBorder }}>
          <CreditCard className="h-5 w-5 text-[rgb(var(--primary-2))]" />
          <h2 className="mt-4 text-xl font-bold tracking-normal">{currentPlanDetail?.name || currentPlan}</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{currentPlanDetail?.bestFor}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Members</dt><dd className="font-semibold">{currentPlanDetail?.members}</dd></div>
            <div className="flex justify-between gap-3"><dt>Squads</dt><dd className="font-semibold">{currentPlanDetail?.squads}</dd></div>
            <div className="flex justify-between gap-3"><dt>Storage</dt><dd className="font-semibold">{currentPlanDetail?.storage}</dd></div>
            <div className="flex justify-between gap-3"><dt>AI requests</dt><dd className="font-semibold">{currentPlanDetail?.aiRequests}</dd></div>
            <div className="flex justify-between gap-3"><dt>Status</dt><dd className="font-semibold">{summary?.club?.subscriptionStatus || "TRIAL"}</dd></div>
            <div className="flex justify-between gap-3"><dt>Renewal</dt><dd className="font-semibold">{summary?.club?.subscriptionNextBillingAt ? formatDateTime(summary.club.subscriptionNextBillingAt) : "Not set"}</dd></div>
          </dl>
          <div className="mt-5 rounded-2xl border bg-white/70 p-3" style={{ borderColor: adminCardBorder }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 text-[rgb(var(--primary-2))]" />
                <p className="truncate text-xs font-extrabold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  Time left
                </p>
              </div>
              <p className="text-xs font-bold text-[rgb(var(--text))]">
                {subscriptionProgress.hasPeriod
                  ? subscriptionProgress.isExpired
                    ? "Expired"
                    : `${subscriptionProgress.daysLeft}d left`
                  : "No active period"}
              </p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(var(--muted),.16)]" style={{ boxShadow: "var(--neu-inset)" }}>
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#84cc16)] transition-[width] duration-500"
                style={{ width: `${subscriptionProgress.remainingPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between gap-3 text-[11px] font-semibold text-[rgb(var(--muted))]">
              <span>{summary?.club?.subscriptionStartAt ? formatDateTime(summary.club.subscriptionStartAt) : "Start not set"}</span>
              <span>{subscriptionProgress.hasPeriod ? `${subscriptionProgress.totalDays}d cycle` : "Renewal not set"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white/60 p-5 lg:col-span-2" style={{ borderColor: adminCardBorder }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-normal">Change plan</h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Upgrades open Razorpay checkout. Downgrades are scheduled for next renewal.
              </p>
            </div>
            <div className="rounded-full border bg-white/80 p-1" style={{ borderColor: adminCardBorder }}>
              {(["monthly", "annual"] as BillingCycle[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCycle(item)}
                  className="rounded-full px-4 py-2 text-xs font-extrabold capitalize transition"
                  style={{
                    background: cycle === item ? "rgb(var(--primary))" : "transparent",
                    color: cycle === item ? "rgb(var(--primary-2))" : "rgb(var(--text))",
                    boxShadow: cycle === item ? "var(--neu-raised-sm)" : "none",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {checkoutPlans.map((plan) => {
              const rankDelta = planRank(plan.key) - planRank(currentPlan);
              const isCurrent = plan.key === currentPlan;
              const isDowngrade = rankDelta < 0;
              const amount = amountFor(plan, cycle);
              return (
                <article
                  key={plan.key}
                  className={`relative rounded-2xl border p-4 transition ${
                    isCurrent ? "ring-0" : ""
                  }`}
                  style={{
                    borderColor: isCurrent ? "rgba(var(--primary), .30)" : adminCardBorder,
                    background: isCurrent
                      ? "linear-gradient(145deg, rgba(var(--primary), .22), rgba(255,255,255,.58))"
                      : "rgba(255,255,255,.70)",
                    boxShadow: isCurrent
                      ? "0 0 0 2px rgba(var(--primary), .38), var(--neu-raised), inset 0 0 0 1px rgba(255,255,255,.58)"
                      : undefined,
                  }}
                >
                  {isCurrent ? (
                    <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ background: "rgba(255,255,255,.56)", color: "rgb(var(--primary-2))", boxShadow: "var(--neu-inset)" }}>
                      Current
                    </span>
                  ) : null}
                  <h3 className="pr-20 text-lg font-bold tracking-normal">{plan.name}</h3>
                  <p className="mt-2 text-2xl font-extrabold">{formatInr(amount)}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{cycle === "annual" ? "per year" : "per month"}</p>
                  <p className="mt-3 text-sm leading-5 text-[rgb(var(--muted))]">{plan.note}</p>
                  <button
                    type="button"
                    disabled={!isAdmin || isCurrent || busyPlan === plan.key}
                    onClick={() =>
                      isDowngrade
                        ? scheduleDowngrade(plan.key)
                        : startCheckout(plan.key as BillingPlanCheckoutKey)
                    }
                    className="mt-4 w-full rounded-full px-4 py-2 text-xs font-extrabold transition hover:brightness-105 disabled:cursor-not-allowed"
                    style={{
                      background: isCurrent
                        ? "rgba(var(--primary), .18)"
                        : !isAdmin
                          ? "rgba(15, 23, 42, 0.08)"
                          : "linear-gradient(145deg, rgb(var(--primary)), rgb(var(--primary-2)))",
                      color: isCurrent || !isAdmin ? "rgb(var(--primary-2))" : "#ffffff",
                      boxShadow: isCurrent || !isAdmin ? "var(--neu-inset)" : "var(--neu-raised-sm)",
                    }}
                  >
                    {isCurrent
                      ? "Current plan"
                      : busyPlan === plan.key
                        ? "Processing..."
                        : isDowngrade
                          ? "Schedule downgrade"
                          : "Pay with Razorpay"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white/60 p-5" style={{ borderColor: adminCardBorder }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-normal">All plan details</h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Compare full workspace limits, included modules, support targets and plan positioning.
            </p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[rgb(var(--text))]" style={{ boxShadow: "var(--neu-raised-sm)" }}>
            Active purchase: {purchasedPlan}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {PRICING_PLAN_DETAILS.map((plan) => {
            const isCurrent = plan.key === purchasedPlan;
            return (
              <article
                key={plan.key}
                className="rounded-2xl border bg-white/70 p-4"
                style={{
                  borderColor: isCurrent ? "rgba(34,197,94,.22)" : adminCardBorder,
                  boxShadow: isCurrent ? "var(--neu-raised-sm)" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold tracking-normal">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{plan.bestFor}</p>
                  </div>
                  {isCurrent ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                      Current
                    </span>
                  ) : null}
                </div>
                <dl className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Monthly</dt><dd className="font-bold">{plan.monthly}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Annual</dt><dd className="font-bold">{plan.annual}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Members</dt><dd className="font-bold">{plan.members}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Squads</dt><dd className="font-bold">{plan.squads}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Staff</dt><dd className="font-bold">{plan.staff}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Storage</dt><dd className="font-bold">{plan.storage}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">AI/mo</dt><dd className="font-bold">{plan.aiRequests}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[rgb(var(--muted))]">Support</dt><dd className="max-w-[120px] text-right font-bold">{plan.support}</dd></div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">{plan.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-white/60 p-5" style={{ borderColor: adminCardBorder }}>
        <h2 className="text-xl font-bold tracking-normal">Paid services</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {featureRows.map((feature) => (
            <article key={feature.key} className="rounded-2xl border bg-white/70 p-4" style={{ borderColor: adminCardBorder }}>
              <ShieldCheck className={`h-5 w-5 ${feature.enabled ? "text-emerald-600" : "text-slate-400"}`} />
              <h3 className="mt-3 text-sm font-bold tracking-normal">{feature.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Requires {feature.requiredPlan}. {feature.enabled ? "Enabled" : "Locked"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-white/60 p-5" style={{ borderColor: adminCardBorder }}>
        <h2 className="text-xl font-bold tracking-normal">Plan feature matrix</h2>
        <div className="mt-4 overflow-x-auto">
          <p className="pb-2 text-[11px] font-medium text-[rgb(var(--muted))] md:hidden">
            Swipe horizontally to see all plans
          </p>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-[rgb(var(--muted))]">
              <tr>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Feature</th>
                <th className="py-3 pr-4">Free</th>
                <th className="py-3 pr-4">Starter</th>
                <th className="py-3 pr-4">Professional</th>
                <th className="py-3 pr-4">Elite</th>
                <th className="py-3 pr-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURE_MATRIX.map((row) => (
                <tr key={`${row.category}-${row.feature}`} className="border-t" style={{ borderColor: adminCardBorder }}>
                  <td className="py-3 pr-4 text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{row.category}</td>
                  <td className="py-3 pr-4 font-semibold">{row.feature}</td>
                  <td className="py-3 pr-4 text-xs">{row.free}</td>
                  <td className="py-3 pr-4 text-xs">{row.starter}</td>
                  <td className="py-3 pr-4 text-xs">{row.professional}</td>
                  <td className="py-3 pr-4 text-xs">{row.elite}</td>
                  <td className="py-3 pr-4 text-xs">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border bg-white/60 p-5" style={{ borderColor: adminCardBorder }}>
        <h2 className="text-xl font-bold tracking-normal">Recent payments</h2>
        <div className="mt-4 overflow-x-auto">
          <p className="pb-2 text-[11px] font-medium text-[rgb(var(--muted))] md:hidden">
            Swipe horizontally to see all columns
          </p>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-[rgb(var(--muted))]">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Plan</th>
                <th className="py-3 pr-4">Cycle</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.payments || []).map((payment: any) => (
                <tr key={payment.id} className="border-t" style={{ borderColor: adminCardBorder }}>
                  <td className="py-3 pr-4">{formatDateTime(payment.createdAt)}</td>
                  <td className="py-3 pr-4 font-semibold">{payment.plan}</td>
                  <td className="py-3 pr-4">{String(payment.billingCycle || "").toLowerCase()}</td>
                  <td className="py-3 pr-4">{formatInr(Number(payment.amountInr || 0))}</td>
                  <td className="py-3 pr-4">{payment.status}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{payment.providerPaymentId || payment.providerOrderId}</td>
                </tr>
              ))}
              {!summary?.payments?.length ? (
                <tr>
                  <td className="py-6 text-[rgb(var(--muted))]" colSpan={6}>
                    No payment records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
