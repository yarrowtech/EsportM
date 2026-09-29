import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Brain,
  Check,
  CheckCircle2,
  Database,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  PLAYER_PRO_PLAN,
  PRICING_COMMERCIAL_RULES,
  PRICING_FEATURE_MATRIX,
  PRICING_PLAN_DETAILS,
  type BillingPlanKey,
} from "../features/prototype-pricing/pricing";

type BillingCycle = "monthly" | "yearly";

const planAccent: Record<
  BillingPlanKey,
  {
    card: string;
    pattern: string;
    button: string;
    glow: string;
    tag: string;
  }
> = {
  FREE: {
    card: "border-slate-200/80 bg-white/82",
    pattern: "from-slate-50/90 via-white/75 to-white",
    button: "bg-slate-900 text-white shadow-slate-900/15 hover:bg-slate-800",
    glow: "bg-slate-200/40",
    tag: "bg-slate-100 text-slate-700",
  },
  STARTER: {
    card: "border-cyan-200/80 bg-cyan-50/58",
    pattern: "from-cyan-100/70 via-cyan-50/65 to-white",
    button: "bg-cyan-500 text-white shadow-cyan-500/25 hover:bg-cyan-600",
    glow: "bg-cyan-200/50",
    tag: "bg-cyan-100 text-cyan-800",
  },
  PROFESSIONAL: {
    card: "border-indigo-200/90 bg-indigo-50/70",
    pattern: "from-indigo-100/80 via-indigo-50/65 to-white",
    button: "bg-indigo-500 text-white shadow-indigo-500/30 hover:bg-indigo-600",
    glow: "bg-indigo-300/50",
    tag: "bg-slate-900 text-white",
  },
  ELITE: {
    card: "border-amber-200/80 bg-amber-50/60",
    pattern: "from-amber-100/65 via-amber-50/65 to-white",
    button: "bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600",
    glow: "bg-amber-200/50",
    tag: "bg-amber-100 text-amber-800",
  },
  ENTERPRISE: {
    card: "border-violet-200/80 bg-violet-50/62",
    pattern: "from-violet-100/75 via-violet-50/65 to-white",
    button: "bg-violet-500 text-white shadow-violet-500/25 hover:bg-violet-600",
    glow: "bg-violet-200/50",
    tag: "bg-violet-100 text-violet-800",
  },
};

const featuredPlanKeys: BillingPlanKey[] = ["STARTER", "PROFESSIONAL", "ELITE"];

const categoryIcons: Record<string, typeof Activity> = {
  "Identity & Access": Users,
  "Club Setup": Sparkles,
  Squads: Users,
  Scheduling: Activity,
  Matches: Activity,
  Performance: Activity,
  Medical: Stethoscope,
  Statistics: Activity,
  Analytics: Activity,
  Seasons: Activity,
  Operations: ShieldCheck,
  Communication: Users,
  Social: Sparkles,
  Marketplace: Store,
  AI: Brain,
  Administration: ShieldCheck,
  "Security & Data": Database,
  Service: ShieldCheck,
};

function groupedMatrix() {
  const map = new Map<string, typeof PRICING_FEATURE_MATRIX>();
  PRICING_FEATURE_MATRIX.forEach((row) => {
    map.set(row.category, [...(map.get(row.category) || []), row]);
  });
  return Array.from(map.entries());
}

function formatPrice(price: string) {
  const [currency, ...rest] = price.split(" ");
  const amount = rest.join(" ");
  return { currency, amount: amount || price };
}

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white/85 p-1 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur">
      {[
        ["monthly", "Monthly"],
        ["yearly", "Yearly (16.7% off)"],
      ].map(([value, label]) => {
        const selected = cycle === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value as BillingCycle)}
            className={`h-8 rounded-full px-4 text-xs font-medium transition ${
              selected
                ? "bg-indigo-100 text-indigo-800 shadow-inner"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({
  plan,
  cycle,
}: {
  plan: (typeof PRICING_PLAN_DETAILS)[number];
  cycle: BillingCycle;
}) {
  const accent = planAccent[plan.key];
  const isHighlighted = Boolean(plan.highlighted);
  const displayPrice =
    cycle === "yearly" && plan.key !== "ENTERPRISE" ? plan.effectiveMonthly : plan.monthly;
  const comparePrice = cycle === "yearly" && plan.key !== "FREE" ? plan.monthly : null;
  const price = formatPrice(displayPrice);
  const planStats = [
    ["Active members included", plan.members],
    ["Squads included", plan.squads],
    ["Staff/admin users included", plan.staff],
    ["Storage included", plan.storage],
    ["AI requests per month", plan.aiRequests],
    ["Support", plan.support],
    ["Trial", plan.trial],
  ];

  return (
    <article
      className={`relative flex min-h-[430px] flex-col overflow-hidden rounded-[22px] border p-4 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-6 ${
        accent.card
      } ${isHighlighted ? "lg:mt-12" : ""}`}
    >
      <div className={`absolute -right-10 -top-16 h-40 w-40 rounded-full blur-3xl ${accent.glow}`} />
      <div
        className={`absolute inset-0 bg-gradient-to-b ${accent.pattern}`}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "linear-gradient(to bottom, black, transparent 72%)",
        }}
        aria-hidden="true"
      />

      {isHighlighted ? (
        <div className="absolute -top-3 right-6 rotate-[-7deg] rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
          Most popular
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{plan.name}</h2>
            <p className="mt-3 max-w-[22rem] text-sm leading-6 text-slate-600">{plan.bestFor}</p>
          </div>
          {!isHighlighted ? (
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${accent.tag}`}>
              {plan.trial}
            </span>
          ) : null}
        </div>

        <div className="mt-7 flex items-end gap-2">
          {plan.key === "ENTERPRISE" ? null : (
            <span className="mb-1 text-sm font-semibold text-slate-500">{price.currency}</span>
          )}
          <p className="text-5xl font-semibold tracking-normal text-slate-950">
            {plan.key === "ENTERPRISE" ? displayPrice : price.amount}
          </p>
          {comparePrice ? (
            <span className="mb-2 text-sm font-medium text-slate-500 line-through">
              {comparePrice}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {cycle === "yearly" && plan.key !== "ENTERPRISE"
            ? `${plan.annual} yearly; 10 months charged for 12 months service`
            : "Monthly billing"}
        </p>

        <Button asChild className={`mt-5 h-10 rounded-full border-0 shadow-lg ${accent.button}`}>
          <Link to={plan.key === "ENTERPRISE" ? "/login" : "/register"}>
            {plan.key === "ENTERPRISE" ? "Talk to admin" : "Start for free"}
          </Link>
        </Button>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-950">Included plan limits</p>
          <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-700">
            {planStats.map(([label, value]) => (
              <li key={label} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                <span>
                  <span className="text-slate-500">{label}: </span>
                  <span className="font-medium text-slate-800">{value}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600 underline decoration-slate-300 underline-offset-4">
            {plan.note}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const matrixGroups = groupedMatrix();
  const featuredPlans = useMemo(
    () => PRICING_PLAN_DETAILS.filter((plan) => featuredPlanKeys.includes(plan.key)),
    []
  );
  const supportingPlans = useMemo(
    () => PRICING_PLAN_DETAILS.filter((plan) => !featuredPlanKeys.includes(plan.key)),
    []
  );

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="relative border-b border-slate-100">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.10), transparent 24rem), linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
            backgroundSize: "auto, 72px 72px, 72px 72px",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(circle at center, black 0, black 58%, transparent 80%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.96))",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Button asChild variant="ghost" className="px-0 text-slate-600 hover:bg-transparent">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <Badge className="rounded-full border-indigo-200 bg-indigo-50 px-4 py-1 text-[11px] uppercase tracking-[0.22em] text-indigo-800">
              Pricing
            </Badge>
          </div>

          <div className="mx-auto mt-10 max-w-5xl text-center">
            <h1 className="font-serif text-5xl font-semibold leading-[1.04] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              The Perfect Balance
              <span className="block">Of Features & Affordability</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Club workspace plans for staff, squads, analytics, player operations and growth
              workflows.
            </p>
            <div className="mt-8">
              <BillingToggle cycle={cycle} onChange={setCycle} />
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3 lg:items-start">
            {featuredPlans.map((plan) => (
              <PlanCard key={plan.key} plan={plan} cycle={cycle} />
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-4 md:grid-cols-2">
            {supportingPlans.map((plan) => (
              <PlanCard key={plan.key} plan={plan} cycle={cycle} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-6 shadow-[0_18px_60px_rgba(88,28,135,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <Badge className="rounded-full bg-violet-100 px-4 py-1 text-violet-800">
                Individual player
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
                {PLAYER_PRO_PLAN.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Profile, social visibility and marketplace presence remain accessible. Player Pro
                is reserved for a future individual upgrade path.
              </p>
            </div>
            <p className="text-3xl font-semibold tracking-normal text-violet-950">
              {PLAYER_PRO_PLAN.price}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
              Full feature breakdown
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Expanded packaging view across core operations, performance, medical, social,
              marketplace and AI.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full">
            {PRICING_FEATURE_MATRIX.length} feature groups
          </Badge>
        </div>

        <div className="space-y-4">
          {matrixGroups.map(([category, rows]) => {
            const Icon = categoryIcons[category] || Activity;
            return (
              <section
                key={category}
                className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-indigo-100 text-indigo-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold tracking-normal">{category}</h3>
                </div>

                <div className="overflow-x-auto">
                  <p className="px-4 py-2 text-[11px] font-medium text-slate-400 md:hidden">
                    Swipe horizontally to see all plans
                  </p>
                  <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                    <thead className="bg-white text-xs uppercase text-slate-500">
                      <tr>
                        <th className="w-[260px] px-4 py-3 font-semibold">Feature</th>
                        <th className="px-4 py-3 font-semibold">Free</th>
                        <th className="px-4 py-3 font-semibold">Starter</th>
                        <th className="px-4 py-3 font-semibold text-indigo-700">
                          Professional
                        </th>
                        <th className="px-4 py-3 font-semibold">Elite</th>
                        <th className="px-4 py-3 font-semibold">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.feature} className="border-t border-slate-100 align-top">
                          <td className="px-4 py-4 font-semibold text-slate-950">{row.feature}</td>
                          <td className="px-4 py-4 text-slate-600">{row.free}</td>
                          <td className="px-4 py-4 text-slate-600">{row.starter}</td>
                          <td className="bg-indigo-50/70 px-4 py-4 text-indigo-950">
                            {row.professional}
                          </td>
                          <td className="px-4 py-4 text-slate-600">{row.elite}</td>
                          <td className="px-4 py-4 text-slate-600">{row.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold tracking-normal">Commercial rules</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PRICING_COMMERCIAL_RULES.map((rule) => (
              <div
                key={rule}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <p className="text-sm leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
