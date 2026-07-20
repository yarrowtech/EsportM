import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrimaryRole, SubscriptionStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PLAN_PRICING,
  PLAN_RANK,
  PAID_FEATURE_REQUIRED_PLAN,
  normalizeBillingPlan,
  planMeetsRequirement,
  type BillingPlanKey,
} from '../../common/pricing/pricing-policy';

type PaidPlan = keyof typeof PLAN_PRICING;
type BillingCycleValue = 'MONTHLY' | 'ANNUAL';
const BillingCycleValue = {
  MONTHLY: 'MONTHLY' as BillingCycleValue,
  ANNUAL: 'ANNUAL' as BillingCycleValue,
};
const PaymentStatusValue = {
  CREATED: 'CREATED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private normalizePaidPlan(value: string): PaidPlan {
    const plan = normalizeBillingPlan(value);
    if (plan === 'STARTER' || plan === 'PROFESSIONAL' || plan === 'ELITE') {
      return plan;
    }
    throw new BadRequestException('Choose Starter, Professional or Elite');
  }

  private normalizeCycle(value: string): BillingCycleValue {
    const cycle = String(value || 'annual').toUpperCase();
    if (cycle === 'MONTHLY') return BillingCycleValue.MONTHLY;
    if (cycle === 'ANNUAL' || cycle === 'YEARLY') return BillingCycleValue.ANNUAL;
    throw new BadRequestException('billingCycle must be monthly or annual');
  }

  private amountFor(plan: PaidPlan, cycle: BillingCycleValue) {
    const pricing = PLAN_PRICING[plan];
    return cycle === BillingCycleValue.MONTHLY
      ? pricing.monthlyAmountInr
      : pricing.annualAmountInr;
  }

  private async getMembership(userId: string, clubId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      include: { club: true },
    });
    if (!membership) throw new NotFoundException('Club not found');
    if (membership.club.isActive === false) {
      throw new ForbiddenException('Club is inactive');
    }
    return membership;
  }

  private async assertClubAdmin(userId: string, clubId: string) {
    const membership = await this.getMembership(userId, clubId);
    if (membership.primary !== PrimaryRole.ADMIN) {
      throw new ForbiddenException('Only club admins can manage billing');
    }
    return membership.club;
  }

  private getRazorpayCredentials() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new InternalServerErrorException(
        'Razorpay credentials are not configured',
      );
    }
    return { keyId, keySecret };
  }

  private verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string,
  ) {
    const expected = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  async summary(userId: string, clubId: string) {
    if (!clubId) throw new BadRequestException('clubId is required');
    const membership = await this.getMembership(userId, clubId);
    const currentPlan = normalizeBillingPlan(membership.club.billingPlan);
    const isAdmin = membership.primary === PrimaryRole.ADMIN;

    const payments = await (this.prisma as any).clubPayment.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        provider: true,
        providerOrderId: true,
        providerPaymentId: true,
        plan: true,
        billingCycle: true,
        amountInr: true,
        status: true,
        metadata: true,
        createdAt: true,
        verifiedAt: true,
      },
    });

    const enabledFeatures = Object.entries(PAID_FEATURE_REQUIRED_PLAN).map(
      ([feature, requiredPlan]) => ({
        feature,
        requiredPlan,
        enabled: planMeetsRequirement(currentPlan, requiredPlan),
      }),
    );

    return {
      canManageBilling: isAdmin,
      role: membership.primary,
      club: {
        id: membership.club.id,
        name: membership.club.name,
        billingPlan: currentPlan,
        subscriptionStatus: membership.club.subscriptionStatus,
        subscriptionMonthlyPrice: membership.club.subscriptionMonthlyPrice,
        subscriptionStartAt: membership.club.subscriptionStartAt,
        subscriptionNextBillingAt: membership.club.subscriptionNextBillingAt,
      },
      enabledFeatures,
      pendingDowngrade:
        payments.find((payment: any) => payment.status === 'CREATED' && payment.metadata?.type === 'SCHEDULED_DOWNGRADE') ??
        null,
      payments,
    };
  }

  async createRazorpayOrder(
    userId: string,
    clubId: string,
    planInput: string,
    cycleInput: string,
  ) {
    if (!clubId) throw new BadRequestException('clubId is required');
    const plan = this.normalizePaidPlan(planInput);
    const cycle = this.normalizeCycle(cycleInput);
    const club = await this.assertClubAdmin(userId, clubId);
    const currentPlan = normalizeBillingPlan(club.billingPlan);

    if (PLAN_RANK[plan] < PLAN_RANK[currentPlan]) {
      throw new BadRequestException(
        'Downgrades are scheduled for next renewal and do not require checkout',
      );
    }

    const amountInr = this.amountFor(plan, cycle);
    const { keyId, keySecret } = this.getRazorpayCredentials();
    const receipt = `club_${clubId}_${plan}_${Date.now()}`.slice(0, 40);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInr * 100,
        currency: 'INR',
        receipt,
        notes: {
          clubId,
          clubName: club.name,
          plan,
          billingCycle: cycle.toLowerCase(),
        },
      }),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      throw new BadRequestException(
        data?.error?.description || 'Unable to create Razorpay order',
      );
    }

    await (this.prisma as any).clubPayment.create({
      data: {
        clubId,
        userId,
        provider: 'razorpay',
        providerOrderId: String(data.id),
        plan,
        billingCycle: cycle,
        amountInr,
        status: PaymentStatusValue.CREATED,
        metadata: {
          receipt,
          currentPlan,
        },
      },
    });

    return {
      keyId,
      order: data,
      plan,
      amountInr,
      billingCycle: cycle.toLowerCase(),
      club: { id: club.id, name: club.name },
    };
  }

  async verifyRazorpayPayment(
    userId: string,
    body: {
      clubId?: string;
      plan?: string;
      billingCycle?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    },
  ) {
    const clubId = String(body.clubId || '');
    if (!clubId) throw new BadRequestException('clubId is required');
    const plan = this.normalizePaidPlan(String(body.plan || ''));
    const cycle = this.normalizeCycle(String(body.billingCycle || 'annual'));
    await this.assertClubAdmin(userId, clubId);

    const orderId = String(body.razorpay_order_id || '');
    const paymentId = String(body.razorpay_payment_id || '');
    const signature = String(body.razorpay_signature || '');
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing Razorpay payment verification fields');
    }

    const paymentRecord = await (this.prisma as any).clubPayment.findUnique({
      where: { providerOrderId: orderId },
    });
    if (!paymentRecord || paymentRecord.clubId !== clubId || paymentRecord.plan !== plan) {
      throw new ForbiddenException('Payment order does not match this club or plan');
    }

    const { keySecret } = this.getRazorpayCredentials();
    if (!this.verifySignature(orderId, paymentId, signature, keySecret)) {
      await (this.prisma as any).clubPayment.update({
        where: { providerOrderId: orderId },
        data: { status: PaymentStatusValue.FAILED },
      });
      throw new ForbiddenException('Invalid Razorpay payment signature');
    }

    const now = new Date();
    const nextBillingAt = new Date(now);
    if (cycle === BillingCycleValue.MONTHLY) {
      nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);
    } else {
      nextBillingAt.setFullYear(nextBillingAt.getFullYear() + 1);
    }

    const club = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        billingPlan: plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionMonthlyPrice: PLAN_PRICING[plan].monthlyAmountInr,
        subscriptionStartAt: now,
        subscriptionNextBillingAt: nextBillingAt,
      },
      select: {
        id: true,
        name: true,
        billingPlan: true,
        subscriptionStatus: true,
        subscriptionMonthlyPrice: true,
        subscriptionStartAt: true,
        subscriptionNextBillingAt: true,
      },
    });

    const payment = await (this.prisma as any).clubPayment.update({
      where: { providerOrderId: orderId },
      data: {
        providerPaymentId: paymentId,
        providerSignature: signature,
        billingCycle: cycle,
        status: PaymentStatusValue.VERIFIED,
        verifiedAt: now,
      },
    });

    return { club, payment };
  }

  async scheduleDowngrade(userId: string, clubId: string, planInput: string) {
    if (!clubId) throw new BadRequestException('clubId is required');
    const nextPlan = normalizeBillingPlan(planInput);
    if (nextPlan === 'ENTERPRISE') {
      throw new BadRequestException('Enterprise changes require support');
    }
    const club = await this.assertClubAdmin(userId, clubId);
    const currentPlan = normalizeBillingPlan(club.billingPlan);

    if (PLAN_RANK[nextPlan as BillingPlanKey] >= PLAN_RANK[currentPlan]) {
      throw new BadRequestException('Use checkout to upgrade or renew this plan');
    }

    const payment = await (this.prisma as any).clubPayment.create({
      data: {
        clubId,
        userId,
        provider: 'manual',
        providerOrderId: `scheduled_${clubId}_${Date.now()}`,
        plan: nextPlan,
        billingCycle: BillingCycleValue.ANNUAL,
        amountInr: 0,
        status: PaymentStatusValue.CREATED,
        metadata: {
          type: 'SCHEDULED_DOWNGRADE',
          currentPlan,
          effectiveAt: club.subscriptionNextBillingAt,
        },
      },
    });

    return { pendingDowngrade: payment };
  }
}
