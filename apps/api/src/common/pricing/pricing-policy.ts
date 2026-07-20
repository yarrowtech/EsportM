export type BillingPlanKey =
  | 'FREE'
  | 'STARTER'
  | 'PROFESSIONAL'
  | 'ELITE'
  | 'ENTERPRISE';

export type PaidFeatureKey =
  | 'ai_assistant'
  | 'advanced_analytics'
  | 'medical_management'
  | 'social_publishing'
  | 'marketplace_recruiting';

export const PLAN_RANK: Record<BillingPlanKey, number> = {
  FREE: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  ELITE: 3,
  ENTERPRISE: 4,
};

export const PAID_FEATURE_REQUIRED_PLAN: Record<PaidFeatureKey, BillingPlanKey> = {
  ai_assistant: 'PROFESSIONAL',
  advanced_analytics: 'PROFESSIONAL',
  medical_management: 'PROFESSIONAL',
  social_publishing: 'PROFESSIONAL',
  marketplace_recruiting: 'PROFESSIONAL',
};

export const PLAN_PRICING: Record<
  Exclude<BillingPlanKey, 'FREE' | 'ENTERPRISE'>,
  { annualAmountInr: number; monthlyAmountInr: number }
> = {
  STARTER: { annualAmountInr: 14990, monthlyAmountInr: 1499 },
  PROFESSIONAL: { annualAmountInr: 49990, monthlyAmountInr: 4999 },
  ELITE: { annualAmountInr: 119990, monthlyAmountInr: 11999 },
};

export function normalizeBillingPlan(value: unknown): BillingPlanKey {
  const plan = String(value || 'FREE').trim().toUpperCase();
  if (plan === 'PRO') return 'PROFESSIONAL';
  if (plan === 'BUSINESS') return 'ELITE';
  if (plan in PLAN_RANK) return plan as BillingPlanKey;
  return 'FREE';
}

export function planMeetsRequirement(current: unknown, required: BillingPlanKey) {
  const normalized = normalizeBillingPlan(current);
  return PLAN_RANK[normalized] >= PLAN_RANK[required];
}
