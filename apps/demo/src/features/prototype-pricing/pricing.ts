export type PricingFeatureKey =
  | "ai_assistant"
  | "advanced_analytics"
  | "medical_management"
  | "social_publishing"
  | "marketplace_recruiting";

export type BillingPlanKey =
  | "FREE"
  | "STARTER"
  | "PROFESSIONAL"
  | "ELITE"
  | "ENTERPRISE";

export type PricingFeature = {
  key: PricingFeatureKey;
  title: string;
  shortTitle: string;
  requiredPlan: BillingPlanKey;
  description: string;
  bullets: string[];
};

export type PricingPlanDetail = {
  key: BillingPlanKey;
  name: string;
  bestFor: string;
  monthly: string;
  annual: string;
  effectiveMonthly: string;
  members: string;
  squads: string;
  staff: string;
  storage: string;
  aiRequests: string;
  support: string;
  trial: string;
  note: string;
  accent: "slate" | "sky" | "emerald" | "amber" | "violet";
  highlighted?: boolean;
};

export type PricingMatrixRow = {
  category: string;
  feature: string;
  free: string;
  starter: string;
  professional: string;
  elite: string;
  enterprise: string;
};

export const FEATURE_PRICING: Record<PricingFeatureKey, PricingFeature> = {
  ai_assistant: {
    key: "ai_assistant",
    title: "AI Assistant",
    shortTitle: "AI",
    requiredPlan: "PROFESSIONAL",
    description: "AI summaries, recommendations, and leadership reports for club decisions.",
    bullets: ["Smart summaries", "Training and match prompts", "Leadership-ready exports"],
  },
  advanced_analytics: {
    key: "advanced_analytics",
    title: "Advanced Analytics",
    shortTitle: "Analytics",
    requiredPlan: "STARTER",
    description: "Performance trends, readiness, risk signals, and club-wide analytics records.",
    bullets: ["Read-only analytics stream", "Trend analytics", "Readiness and risk scoring"],
  },
  medical_management: {
    key: "medical_management",
    title: "Medical and Injury Management",
    shortTitle: "Medical",
    requiredPlan: "PROFESSIONAL",
    description: "Injury records, recovery tracking, medical workload, and player availability.",
    bullets: ["Injury register", "Recovery timeline", "Physio workload tracking"],
  },
  social_publishing: {
    key: "social_publishing",
    title: "Social Publishing",
    shortTitle: "Social",
    requiredPlan: "PROFESSIONAL",
    description: "Public skill posts, video/image uploads, and Instagram showcase publishing.",
    bullets: ["Skill posts", "Media uploads", "Showcase visibility"],
  },
  marketplace_recruiting: {
    key: "marketplace_recruiting",
    title: "Marketplace Recruiting",
    shortTitle: "Recruiting",
    requiredPlan: "PROFESSIONAL",
    description: "Recruiter offer preparation, club offers, and deal response tracking.",
    bullets: ["Prepare offers", "Send club offers", "Recruiter deal timeline"],
  },
};

export const CLUB_PRICING_PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    price: "INR 1,499/mo",
    note: "Core operations for small clubs",
  },
  {
    key: "PROFESSIONAL",
    name: "Professional",
    price: "INR 4,999/mo",
    note: "Recommended for pro feature access",
  },
  {
    key: "ELITE",
    name: "Elite",
    price: "INR 11,999/mo",
    note: "Advanced scale and priority operations",
  },
] as const;

export const PRICING_PLAN_DETAILS: PricingPlanDetail[] = [
  {
    key: "FREE",
    name: "Free",
    bestFor: "New or community teams testing EsportM",
    monthly: "INR 0",
    annual: "INR 0",
    effectiveMonthly: "INR 0",
    members: "25",
    squads: "1",
    staff: "3",
    storage: "1 GB",
    aiRequests: "0",
    support: "Community/email",
    trial: "No expiry",
    note: "Lead-generation plan; one club only",
    accent: "slate",
  },
  {
    key: "STARTER",
    name: "Starter",
    bestFor: "Small academies and single-club teams",
    monthly: "INR 1,499",
    annual: "INR 14,990",
    effectiveMonthly: "INR 1,249",
    members: "75",
    squads: "3",
    staff: "10",
    storage: "5 GB",
    aiRequests: "0",
    support: "Email; 2 business-day target",
    trial: "14 days",
    note: "Core club operations and match management",
    accent: "sky",
  },
  {
    key: "PROFESSIONAL",
    name: "Professional",
    bestFor: "Growing competitive clubs needing performance workflows",
    monthly: "INR 4,999",
    annual: "INR 49,990",
    effectiveMonthly: "INR 4,166",
    members: "250",
    squads: "10",
    staff: "35",
    storage: "50 GB",
    aiRequests: "250",
    support: "Priority email; 1 business-day target",
    trial: "14 days",
    note: "Recommended plan; includes medical, seasons, social, marketplace and AI",
    accent: "emerald",
    highlighted: true,
  },
  {
    key: "ELITE",
    name: "Elite",
    bestFor: "Multi-squad academies and high-performance clubs",
    monthly: "INR 11,999",
    annual: "INR 119,990",
    effectiveMonthly: "INR 9,999",
    members: "750",
    squads: "30",
    staff: "Unlimited",
    storage: "250 GB",
    aiRequests: "1,500",
    support: "Priority onboarding; 4 business-hour target",
    trial: "14 days",
    note: "All current sellable modules with higher limits",
    accent: "amber",
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    bestFor: "Federations, leagues and large multi-club operators",
    monthly: "Starting INR 24,999",
    annual: "Custom",
    effectiveMonthly: "Custom",
    members: "Custom",
    squads: "Custom",
    staff: "Unlimited",
    storage: "Custom",
    aiRequests: "Custom",
    support: "Named success contact and negotiated SLA",
    trial: "Pilot by agreement",
    note: "Custom limits, deployment, migration and commercial terms",
    accent: "violet",
  },
];

export const PLAYER_PRO_PLAN = {
  name: "Player Pro",
  price: "INR 199/mo",
  note: "Future individual upgrade path",
};

export const PRICING_FEATURE_MATRIX: PricingMatrixRow[] = [
  {
    category: "Identity & Access",
    feature: "Email login, personal profile and role dashboards",
    free: "Included",
    starter: "Included",
    professional: "Included",
    elite: "Included",
    enterprise: "Custom",
  },
  {
    category: "Identity & Access",
    feature: "Club switching, invitations and member directory",
    free: "1 club; 5 invites/mo; 25 members",
    starter: "1 club; 50 invites/mo; 75 members",
    professional: "1 club; 250 invites/mo; 250 members",
    elite: "1 club; 1,000 invites/mo; 750 members",
    enterprise: "Custom",
  },
  {
    category: "Identity & Access",
    feature: "Per-club role enable/disable matrix",
    free: "Not included",
    starter: "Not included",
    professional: "Included",
    elite: "Included",
    enterprise: "Included",
  },
  {
    category: "Club Setup",
    feature: "Club profile, settings, theme and visual branding",
    free: "Default theme",
    starter: "Custom theme",
    professional: "Custom theme",
    elite: "Custom theme",
    enterprise: "Custom",
  },
  {
    category: "Squads",
    feature: "Squad creation, roster management and squad workspace",
    free: "1 squad",
    starter: "3 squads",
    professional: "10 squads",
    elite: "30 squads",
    enterprise: "Custom",
  },
  {
    category: "Scheduling",
    feature: "Club calendar, schedule events and in-app notifications",
    free: "10 events/mo",
    starter: "100 events/mo",
    professional: "500 events/mo",
    elite: "Unlimited fair use",
    enterprise: "Custom",
  },
  {
    category: "Matches",
    feature: "Opponent database, fixture management and match results",
    free: "5 matches/mo; no opponent DB",
    starter: "25 matches/mo; 25 opponents",
    professional: "Unlimited fair use",
    elite: "Unlimited fair use",
    enterprise: "Custom",
  },
  {
    category: "Matches",
    feature: "Match event logging, lineups and squad assignment",
    free: "Not included",
    starter: "Included",
    professional: "Included",
    elite: "Included",
    enterprise: "Included",
  },
  {
    category: "Performance",
    feature: "Club overview, charts and recent activity dashboard",
    free: "Basic overview; 30-day basic view",
    starter: "90-day view",
    professional: "Full view",
    elite: "Full view",
    enterprise: "Custom",
  },
  {
    category: "Performance",
    feature: "Player directory, player records and wellness history",
    free: "Read-only basic; latest status",
    starter: "Included; 30-day history",
    professional: "Included; 90-day history",
    elite: "Included; full history",
    enterprise: "Custom",
  },
  {
    category: "Performance",
    feature: "Training-load recording, history and workload trends",
    free: "Not included",
    starter: "30-day history/trend",
    professional: "Full history; 90-day trend",
    elite: "Full history/trend",
    enterprise: "Custom",
  },
  {
    category: "Medical",
    feature: "Injury register and case management",
    free: "Not included",
    starter: "Read-only active injuries",
    professional: "Create and manage",
    elite: "Create and manage",
    enterprise: "Custom",
  },
  {
    category: "Statistics",
    feature: "Stats recompute engine, summaries and leaderboards",
    free: "Top 5 basic leaderboard",
    starter: "10 recomputes/mo; full leaderboards",
    professional: "100 recomputes/mo",
    elite: "500 recomputes/mo",
    enterprise: "Custom",
  },
  {
    category: "Analytics",
    feature: "Dashboard analytics entries and reporting workspace",
    free: "Not included",
    starter: "Read-only",
    professional: "Create and view",
    elite: "Create and view",
    enterprise: "Custom",
  },
  {
    category: "Seasons",
    feature: "Season setup, teams, match linking and standings",
    free: "Not included",
    starter: "Not included",
    professional: "Included",
    elite: "Included",
    enterprise: "Included",
  },
  {
    category: "Operations",
    feature: "Club tasks and operational activity feed",
    free: "10 open tasks; 7-day feed",
    starter: "100 open tasks; 30-day feed",
    professional: "Unlimited fair use; 90-day feed",
    elite: "Unlimited fair use; full history",
    enterprise: "Custom",
  },
  {
    category: "Communication",
    feature: "Internal messages and notification inbox",
    free: "100 messages/mo",
    starter: "1,000 messages/mo",
    professional: "Unlimited fair use",
    elite: "Unlimited fair use",
    enterprise: "Custom",
  },
  {
    category: "Social",
    feature: "Social feed browsing, posts, comments and media uploads",
    free: "Read-only",
    starter: "Read-only",
    professional: "Included; 10 GB media allowance",
    elite: "Included; 100 GB media allowance",
    enterprise: "Custom",
  },
  {
    category: "Marketplace",
    feature: "Listings, player listing management and recruiter offers",
    free: "Read-only browse",
    starter: "Read-only browse",
    professional: "Included",
    elite: "Included",
    enterprise: "Included",
  },
  {
    category: "AI",
    feature: "Performance insights, schedule suggestions, skill analysis and assistant",
    free: "Not included",
    starter: "Add-on",
    professional: "250 requests/mo",
    elite: "1,500 requests/mo",
    enterprise: "Custom",
  },
  {
    category: "Administration",
    feature: "Feature controls for AI, marketplace and social",
    free: "Not included",
    starter: "Not included",
    professional: "Included",
    elite: "Included",
    enterprise: "Included",
  },
  {
    category: "Security & Data",
    feature: "JWT auth, permission controls, storage and cancellation export",
    free: "1 GB; export on request",
    starter: "5 GB; export on request",
    professional: "50 GB; export included",
    elite: "250 GB; export included",
    enterprise: "Custom",
  },
  {
    category: "Service",
    feature: "Standard product updates and support",
    free: "Community/email",
    starter: "Email; 2 business-day target",
    professional: "Priority email; 1 business-day target",
    elite: "Priority onboarding; 4 business-hour target",
    enterprise: "Named success contact and SLA",
  },
];

export const PRICING_COMMERCIAL_RULES = [
  "Subscription is priced per club workspace.",
  "Club subscription covers all roles assigned inside that club.",
  "Free and Starter keep advanced modules visible as upgrade paths.",
  "AI usage is metered against the shared plan allowance.",
  "External SMS/email delivery, payment execution and custom development are separate commercial services.",
];

const PLAN_RANK: Record<BillingPlanKey, number> = {
  FREE: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  ELITE: 3,
  ENTERPRISE: 4,
};

export function normalizeBillingPlan(value: unknown): BillingPlanKey {
  const plan = String(value || "FREE").trim().toUpperCase();
  if (plan === "PRO") return "PROFESSIONAL";
  if (plan === "BUSINESS") return "ELITE";
  if (plan in PLAN_RANK) return plan as BillingPlanKey;
  return "FREE";
}

export function planMeetsRequirement(
  current: BillingPlanKey,
  required: BillingPlanKey
) {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}
