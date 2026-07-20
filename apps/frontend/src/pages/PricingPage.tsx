import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Brain,
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

const planAccent: Record<
  BillingPlanKey,
  { card: string; chip: string; text: string; line: string; button: string }
> = {
  FREE: {
    card: "border-slate-200 bg-white",
    chip: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    line: "bg-slate-300",
    button: "border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
  },
  STARTER: {
    card: "border-sky-200 bg-sky-50/70",
    chip: "bg-sky-100 text-sky-800",
    text: "text-sky-800",
    line: "bg-sky-500",
    button: "border-sky-200 bg-white text-sky-900 hover:bg-sky-50",
  },
  PROFESSIONAL: {
    card: "border-emerald-500 bg-emerald-600 text-white shadow-xl shadow-emerald-950/20",
    chip: "bg-white text-emerald-700",
    text: "text-emerald-50",
    line: "bg-emerald-300",
    button: "border-white bg-white text-emerald-800 hover:bg-emerald-50",
  },
  ELITE: {
    card: "border-amber-200 bg-amber-50/80",
    chip: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    line: "bg-amber-500",
    button: "border-amber-200 bg-white text-amber-900 hover:bg-amber-50",
  },
  ENTERPRISE: {
    card: "border-violet-200 bg-violet-50/80",
    chip: "bg-violet-100 text-violet-800",
    text: "text-violet-800",
    line: "bg-violet-500",
    button: "border-violet-200 bg-white text-violet-900 hover:bg-violet-50",
  },
};

const highlights = [
  { icon: Users, label: "All club roles covered", value: "Admin, manager, coach, player and staff" },
  { icon: Activity, label: "Operations included", value: "Squads, matches, schedules and tasks" },
  { icon: Brain, label: "AI from Professional", value: "250 requests/month included" },
  { icon: ShieldCheck, label: "Club-scoped access", value: "Role and permission based workflows" },
];

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

function PlanCard({ plan }: { plan: (typeof PRICING_PLAN_DETAILS)[number] }) {
  const accent = planAccent[plan.key];
  const isHighlighted = Boolean(plan.highlighted);

  return (
    <article className={`relative flex min-h-[420px] flex-col overflow-hidden rounded-xl border p-5 ${accent.card}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 ${accent.line}`} />
      <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
        <div>
          <h2 className="text-xl font-bold tracking-normal">{plan.name}</h2>
          <p className={`mt-2 text-sm leading-5 ${isHighlighted ? "text-emerald-50" : "text-slate-600"}`}>
            {plan.bestFor}
          </p>
        </div>
        {isHighlighted ? <Badge className={accent.chip}>Recommended</Badge> : null}
      </div>

      <div className="mt-6">
        <p className="text-3xl font-bold tracking-normal">{plan.monthly}</p>
        <p className={`mt-1 text-sm ${isHighlighted ? "text-emerald-50" : accent.text}`}>
          Monthly billing
        </p>
      </div>

      <dl className="mt-6 grid gap-3 text-sm">
        {[
          ["Annual", plan.annual],
          ["Effective monthly", plan.effectiveMonthly],
          ["Members", plan.members],
          ["Squads", plan.squads],
          ["Staff/admin", plan.staff],
          ["Storage", plan.storage],
          ["AI requests", plan.aiRequests],
          ["Trial", plan.trial],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className={isHighlighted ? "text-emerald-50" : "text-slate-500"}>{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <p className={`mt-5 text-sm leading-5 ${isHighlighted ? "text-emerald-50" : "text-slate-600"}`}>
        {plan.note}
      </p>

      <Button asChild className={`mt-auto ${accent.button}`} variant="outline">
        <Link to={plan.key === "ENTERPRISE" ? "/login" : "/register"}>
          {plan.key === "ENTERPRISE" ? "Talk to admin" : "Start with this plan"}
        </Link>
      </Button>
    </article>
  );
}

export default function PricingPage() {
  const matrixGroups = groupedMatrix();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" className="px-0 text-slate-600 hover:bg-transparent">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <Badge className="bg-emerald-100 text-emerald-800">Club pricing</Badge>
          </div>

          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              EsportM pricing for clubs, teams and individual players
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Pick a club workspace plan for your full staff and player operations. Individual
              player access stays lightweight, with a separate Player Pro path for future
              personal upgrades.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Icon className="h-5 w-5 text-emerald-600" />
                  <p className="mt-3 text-sm font-semibold tracking-normal">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.value}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-5">
          {PRICING_PLAN_DETAILS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="bg-violet-100 text-violet-800">Individual player</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
                {PLAYER_PRO_PLAN.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Profile, social visibility and marketplace presence remain accessible. Player Pro
                is reserved for a future individual upgrade path.
              </p>
            </div>
            <p className="text-2xl font-bold tracking-normal text-violet-900">
              {PLAYER_PRO_PLAN.price}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              Full feature breakdown
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Expanded packaging view across core operations, performance, medical, social,
              marketplace and AI.
            </p>
          </div>
          <Badge variant="outline">{PRICING_FEATURE_MATRIX.length} feature groups</Badge>
        </div>

        <div className="space-y-4">
          {matrixGroups.map(([category, rows]) => {
            const Icon = categoryIcons[category] || Activity;
            return (
              <section key={category} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold tracking-normal">{category}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                    <thead className="bg-white text-xs uppercase text-slate-500">
                      <tr>
                        <th className="w-[260px] px-4 py-3 font-semibold">Feature</th>
                        <th className="px-4 py-3 font-semibold">Free</th>
                        <th className="px-4 py-3 font-semibold">Starter</th>
                        <th className="px-4 py-3 font-semibold text-emerald-700">Professional</th>
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
                          <td className="bg-emerald-50/70 px-4 py-4 text-emerald-900">
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
          <h2 className="text-xl font-bold tracking-normal">Commercial rules</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PRICING_COMMERCIAL_RULES.map((rule) => (
              <div key={rule} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
