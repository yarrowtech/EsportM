-- Billing/payment audit records for Razorpay checkout.
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'VERIFIED', 'FAILED');

CREATE TABLE "ClubPayment" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerOrderId" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "providerSignature" TEXT,
  "plan" TEXT NOT NULL,
  "billingCycle" "BillingCycle" NOT NULL,
  "amountInr" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),

  CONSTRAINT "ClubPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubPayment_providerOrderId_key" ON "ClubPayment"("providerOrderId");
CREATE INDEX "ClubPayment_clubId_createdAt_idx" ON "ClubPayment"("clubId", "createdAt");
CREATE INDEX "ClubPayment_userId_idx" ON "ClubPayment"("userId");
CREATE INDEX "ClubPayment_status_idx" ON "ClubPayment"("status");

ALTER TABLE "ClubPayment" ADD CONSTRAINT "ClubPayment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubPayment" ADD CONSTRAINT "ClubPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
