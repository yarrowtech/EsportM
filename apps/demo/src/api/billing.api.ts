import { http } from "./http";

export type BillingPlanCheckoutKey = "STARTER" | "PROFESSIONAL" | "ELITE";
export type BillingCycle = "monthly" | "annual";

export type RazorpayOrderResponse = {
  keyId: string;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  plan: BillingPlanCheckoutKey;
  amountInr: number;
  billingCycle: BillingCycle;
  club: { id: string; name: string };
};

export const billingApi = {
  async summary(clubId: string) {
    const { data } = await http.get(`/billing/club/${clubId}`);
    return data;
  },

  async createRazorpayOrder(
    clubId: string,
    plan: BillingPlanCheckoutKey,
    billingCycle: BillingCycle
  ) {
    const { data } = await http.post<RazorpayOrderResponse>("/billing/razorpay/order", {
      clubId,
      plan,
      billingCycle,
    });
    return data;
  },

  async verifyRazorpayPayment(input: {
    clubId: string;
    plan: BillingPlanCheckoutKey;
    billingCycle: BillingCycle;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { data } = await http.post("/billing/razorpay/verify", input);
    return data;
  },

  async scheduleDowngrade(clubId: string, plan: string) {
    const { data } = await http.post("/billing/schedule-downgrade", { clubId, plan });
    return data;
  },
};
