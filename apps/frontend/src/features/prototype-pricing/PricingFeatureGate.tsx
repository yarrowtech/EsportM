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
  const { requestFeatureAccess } = usePrototypePricing();

  useEffect(() => {
    if (promptedRef.current) return;
    promptedRef.current = true;
    requestFeatureAccess(feature);
  }, [feature, requestFeatureAccess]);

  return <>{children}</>;
}
