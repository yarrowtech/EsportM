import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
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
    const userId: string | undefined = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Unauthorized');

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
      select: {
        id: true,
        billingPlan: true,
        subscriptionStatus: true,
        subscriptionNextBillingAt: true,
        isActive: true,
      },
    });
    if (!club || club.isActive === false) {
      throw new ForbiddenException('Club is inactive or unavailable');
    }

    const [membership, user] = await Promise.all([
      this.prisma.membership.findUnique({
        where: { userId_clubId: { userId, clubId: String(clubId) } },
        select: { clubId: true, primary: true, subRoles: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPlatformAdmin: true },
      }),
    ]);

    if (!membership && !user?.isPlatformAdmin) {
      throw new ForbiddenException('No club access');
    }

    const requiredPlan = PAID_FEATURE_REQUIRED_PLAN[feature];
    const subscriptionStatus = String(club.subscriptionStatus || 'TRIAL').toUpperCase();
    const nextBillingAt = club.subscriptionNextBillingAt
      ? new Date(club.subscriptionNextBillingAt).getTime()
      : null;
    const isExpired = nextBillingAt !== null && nextBillingAt < Date.now();

    if (subscriptionStatus !== 'ACTIVE' || isExpired) {
      throw new ForbiddenException({
        message: 'Active subscription required for this feature',
        feature,
        requiredPlan,
        currentPlan: club.billingPlan || 'FREE',
        subscriptionStatus,
        subscriptionExpired: isExpired,
      });
    }

    if (!planMeetsRequirement(club.billingPlan, requiredPlan)) {
      throw new ForbiddenException({
        message: 'Upgrade required for this feature',
        feature,
        requiredPlan,
        currentPlan: club.billingPlan || 'FREE',
      });
    }

    req.clubId = String(clubId);
    if (membership) req.membership = membership;

    return true;
  }
}
