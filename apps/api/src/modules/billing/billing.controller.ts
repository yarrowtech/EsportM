import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('club/:clubId')
  summary(@Req() req: any, @Param('clubId') clubId: string) {
    return this.billing.summary(req.user.sub, clubId);
  }

  @Post('razorpay/order')
  createOrder(
    @Req() req: any,
    @Body() body: { clubId?: string; plan?: string; billingCycle?: string },
  ) {
    return this.billing.createRazorpayOrder(
      req.user.sub,
      String(body.clubId || ''),
      String(body.plan || ''),
      String(body.billingCycle || 'annual'),
    );
  }

  @Post('razorpay/verify')
  verifyPayment(
    @Req() req: any,
    @Body()
    body: {
      clubId?: string;
      plan?: string;
      billingCycle?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    },
  ) {
    return this.billing.verifyRazorpayPayment(req.user.sub, body);
  }

  @Post('schedule-downgrade')
  scheduleDowngrade(
    @Req() req: any,
    @Body() body: { clubId?: string; plan?: string },
  ) {
    return this.billing.scheduleDowngrade(
      req.user.sub,
      String(body.clubId || ''),
      String(body.plan || ''),
    );
  }
}
