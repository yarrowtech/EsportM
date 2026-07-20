import { Global, Module } from '@nestjs/common';
import { PaidFeatureGuard } from './paid-feature.guard';

@Global()
@Module({
  providers: [PaidFeatureGuard],
  exports: [PaidFeatureGuard],
})
export class PricingModule {}
