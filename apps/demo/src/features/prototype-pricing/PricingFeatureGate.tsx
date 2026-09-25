import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { FEATURE_PRICING, type PricingFeatureKey, type BillingPlanKey } from "./pricing";
import { usePrototypePricing } from "./PrototypePricingProvider";

function planLabel(plan: BillingPlanKey) {
  if (plan === "FREE") return "Free";
  if (plan === "STARTER") return "Starter";
  if (plan === "PROFESSIONAL") return "Professional";
  if (plan === "ELITE") return "Elite";
  return "Enterprise";
}

function PaidFeatureLockedView({
  feature,
  onUpgrade,
  currentPlan,
}: {
  feature: PricingFeatureKey;
  onUpgrade: () => void;
  currentPlan: BillingPlanKey;
}) {
  const detail = FEATURE_PRICING[feature];

  return (
    <section className="pricing-locked-shell">
      <div className="pricing-locked-panel">
        <div className="pricing-locked-icon" aria-hidden="true">
          <LockKeyhole size={22} />
        </div>
        <div className="min-w-0">
          <p className="pricing-locked-kicker">
            {planLabel(detail.requiredPlan)} required
          </p>
          <h1>{detail.title} is locked</h1>
          <p className="pricing-locked-copy">{detail.description}</p>
          <div className="pricing-locked-status">
            <span>Current: {planLabel(currentPlan)}</span>
            <span>Required: {planLabel(detail.requiredPlan)}</span>
          </div>
          <div className="pricing-locked-includes">
            {detail.bullets.map((item) => (
              <span key={item}>
                <ShieldCheck size={14} />
                {item}
              </span>
            ))}
          </div>
          <button type="button" className="pricing-neu-button pricing-locked-button" onClick={onUpgrade}>
            View upgrade options
          </button>
        </div>
      </div>
    </section>
  );
}

export function PricingFeatureGate({
  children,
  feature,
}: {
  children: ReactNode;
  feature: PricingFeatureKey;
}) {
  const promptedRef = useRef(false);
  const {
    currentPlan,
    hasFeatureAccess,
    isPricingLoading,
    requestFeatureAccess,
  } = usePrototypePricing();
  const canAccess = hasFeatureAccess(feature);

  useEffect(() => {
    if (isPricingLoading || canAccess) return;
    if (promptedRef.current) return;
    promptedRef.current = true;
    requestFeatureAccess(feature);
  }, [canAccess, feature, isPricingLoading, requestFeatureAccess]);

  if (isPricingLoading) {
    return (
      <section className="pricing-locked-shell">
        <div className="pricing-locked-panel pricing-locked-panel--loading">
          Checking plan access...
        </div>
      </section>
    );
  }

  if (!canAccess) {
    return (
      <PaidFeatureLockedView
        feature={feature}
        currentPlan={currentPlan}
        onUpgrade={() => requestFeatureAccess(feature)}
      />
    );
  }

  return <>{children}</>;
}
