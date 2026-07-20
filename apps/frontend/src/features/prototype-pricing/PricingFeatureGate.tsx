import { useEffect, useRef, type ReactNode } from "react";
import { type PricingFeatureKey } from "./pricing";
import { usePrototypePricing } from "./PrototypePricingProvider";

export function PricingFeatureGate({
  children,
  feature,
}: {
  children: ReactNode;
  feature: PricingFeatureKey;
}) {
  const promptedRef = useRef(false);
  const { hasFeatureAccess, requestFeatureAccess } = usePrototypePricing();

  useEffect(() => {
    if (promptedRef.current || hasFeatureAccess(feature)) return;
    promptedRef.current = true;
    requestFeatureAccess(feature);
  }, [feature, hasFeatureAccess, requestFeatureAccess]);

  return <>{children}</>;
}
