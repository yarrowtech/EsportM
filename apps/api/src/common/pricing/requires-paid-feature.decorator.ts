import { SetMetadata } from '@nestjs/common';
import { type PaidFeatureKey } from './pricing-policy';

export const PAID_FEATURE_KEY = 'paidFeatureKey';

export function RequiresPaidFeature(feature: PaidFeatureKey) {
  return SetMetadata(PAID_FEATURE_KEY, feature);
}
