import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PAID_FEATURE_KEY } from './requires-paid-feature.decorator';
import {
  PAID_FEATURE_REQUIRED_PLAN,
  type PaidFeatureKey,
  planMeetsRequirement,
} from './pricing-policy';

@Injectable()
export class PaidFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const feature = this.reflector.getAllAndOverride<PaidFeatureKey>(
      PAID_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const req = context.switchToHttp().getRequest();
    const params = req.params || {};
    const query = req.query || {};
    const body = req.body || {};
    const headers = req.headers || {};
    const clubId =
      params.clubId ||
      query.clubId ||
      body.clubId ||
      body.recruiterClubId ||
      body.authorClubId ||
      headers['x-club-id'];

    if (!clubId) {
      throw new ForbiddenException('Club context is required for this paid feature');
    }

    const club = await this.prisma.club.findUnique({
      where: { id: String(clubId) },
      select: { id: true, billingPlan: true, isActive: true },
    });
    if (!club || club.isActive === false) {
      throw new ForbiddenException('Club is inactive or unavailable');
    }

    const requiredPlan = PAID_FEATURE_REQUIRED_PLAN[feature];
    if (!planMeetsRequirement(club.billingPlan, requiredPlan)) {
      throw new ForbiddenException({
        message: 'Upgrade required for this feature',
        feature,
        requiredPlan,
        currentPlan: club.billingPlan || 'FREE',
      });
    }

    return true;
  }
}
