import { MedusaService } from "@medusajs/framework/utils";
import Payout from "./models/payout";
import PayoutTransactionLink from "./models/payout-transaction-link";
import { createLogger } from "../../lib/logger";
import { appConfig } from "../../lib/config";
import Stripe from "stripe";
const logger = createLogger("module:payout");

type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "on_hold";
type PaymentMethod =
  | "stripe_connect"
  | "bank_transfer"
  | "paypal"
  | "manual"
  | "check";

type PayoutRecord = {
  id: string;
  payout_number: string;
  tenant_id: string;
  store_id: string | null;
  vendor_id: string;
  gross_amount: number | string;
  commission_amount: number | string;
  platform_fee_amount: number | string;
  adjustment_amount: number | string;
  net_amount: number | string;
  period_start: Date | null;
  period_end: Date | null;
  transaction_count: number;
  payment_method: PaymentMethod;
  status: PayoutStatus;
  scheduled_for: Date | null;
  stripe_transfer_id: string | null;
  stripe_failure_code: string | null;
  stripe_failure_message: string | null;
  failure_reason: string | null;
  retry_count: number;
  last_retry_at: Date | null;
  processing_started_at: Date | null;
  processing_completed_at: Date | null;
  processing_failed_at: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

interface PayoutServiceBase {
  listPayouts(filters?: Record<string, unknown>): Promise<PayoutRecord[]>;
  retrievePayout(id: string): Promise<PayoutRecord>;
  createPayouts(data: {
    payout_number: string;
    tenant_id: string;
    store_id?: string | null;
    vendor_id: string;
    gross_amount: number;
    commission_amount: number;
    platform_fee_amount: number;
    adjustment_amount: number;
    net_amount: number;
    period_start: Date;
    period_end: Date;
    transaction_count: number;
    payment_method: PaymentMethod;
    status: PayoutStatus;
    scheduled_for?: Date | null;
  }): Promise<PayoutRecord>;
  updatePayouts(data: Record<string, unknown>): Promise<PayoutRecord>;
  createPayoutTransactionLinks(
    data: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<unknown>;
}

const Base = MedusaService({ Payout, PayoutTransactionLink });

// Lazy Stripe singleton — typed because Stripe SDK types require the specific
// installed version; using a module-level singleton avoids class property any fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stripeInstance: any = null;

function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(appConfig.stripe.secretKey ?? "", {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

class PayoutModuleService extends Base implements PayoutServiceBase {
  private generatePayoutNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${year}-${timestamp}`;
  }

  async createVendorPayout(data: {
    vendorId: string;
    tenantId: string;
    storeId?: string | null;
    periodStart: Date;
    periodEnd: Date;
    transactionIds: string[];
    grossAmount: number;
    commissionAmount: number;
    platformFeeAmount?: number;
    adjustmentAmount?: number;
    paymentMethod: PaymentMethod;
    scheduledFor?: Date | null;
  }): Promise<PayoutRecord> {
    const {
      vendorId,
      tenantId,
      storeId = null,
      periodStart,
      periodEnd,
      transactionIds,
      grossAmount,
      commissionAmount,
      platformFeeAmount = 0,
      adjustmentAmount = 0,
      paymentMethod,
      scheduledFor = null,
    } = data;

    const netAmount =
      grossAmount - commissionAmount - platformFeeAmount + adjustmentAmount;

    const payout = await this.createPayouts({
      payout_number: this.generatePayoutNumber(),
      tenant_id: tenantId,
      store_id: storeId,
      vendor_id: vendorId,
      gross_amount: grossAmount,
      commission_amount: commissionAmount,
      platform_fee_amount: platformFeeAmount,
      adjustment_amount: adjustmentAmount,
      net_amount: netAmount,
      period_start: periodStart,
      period_end: periodEnd,
      transaction_count: transactionIds.length,
      payment_method: paymentMethod,
      status: scheduledFor ? "pending" : "processing",
      scheduled_for: scheduledFor,
    } as any);

    const links = transactionIds.map((txId) => ({
      payout_id: payout.id,
      commission_transaction_id: txId,
      amount: netAmount,
    }));
    await this.createPayoutTransactionLinks(links);

    return payout;
  }

  async processStripeConnectPayout(
    payoutId: string,
    stripeAccountId: string,
  ): Promise<PayoutRecord> {
    const stripe = getStripe();
    const payout = (await this.retrievePayout(payoutId)) as any;

    if (!stripeAccountId) {
      throw new Error(`No Stripe account ID provided for payout ${payoutId}`);
    }

    try {
      await this.updatePayouts({
        id: payoutId,
        status: "processing",
        processing_started_at: new Date(),
      } as any);

      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(payout.net_amount) * 100),
        currency: "usd",
        destination: stripeAccountId,
        transfer_group: payout.payout_number,
        metadata: {
          payout_id: payoutId,
          payout_number: payout.payout_number,
          vendor_id: payout.vendor_id,
        },
      });

      const updated = await this.updatePayouts({
        id: payoutId,
        status: "completed",
        stripe_transfer_id: transfer.id,
        processing_completed_at: new Date(),
      } as any);

      logger.info(
        `[Payout] Completed transfer ${transfer.id} for payout ${payoutId}`,
      );
      return updated;
    } catch (error: unknown) {
      const e = error as { code?: string; message?: string };
      logger.error(`[Payout] Failed for ${payoutId}:`, error);

      await this.updatePayouts({
        id: payoutId,
        status: "failed",
        stripe_failure_code: e.code ?? "unknown",
        stripe_failure_message: e.message ?? null,
        processing_failed_at: new Date(),
        failure_reason: e.message ?? null,
        retry_count: (payout.retry_count ?? 0) + 1,
        last_retry_at: new Date(),
      } as any);

      throw error;
    }
  }

  async createStripeConnectAccount(
    vendorId: string,
    email: string,
    country = "US",
  ): Promise<unknown> {
    const stripe = getStripe();
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { vendor_id: vendorId },
      });
      logger.info(
        `[Stripe Connect] Created account ${account.id} for vendor ${vendorId}`,
      );
      return account;
    } catch (error: unknown) {
      logger.error(
        `[Stripe Connect] Failed to create account for vendor ${vendorId}:`,
        error,
      );
      throw error;
    }
  }

  async getStripeConnectOnboardingLink(
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string,
  ): Promise<string> {
    const stripe = getStripe();
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });
      return accountLink.url;
    } catch (error: unknown) {
      logger.error("[Stripe Connect] Failed to create onboarding link:", error);
      throw error;
    }
  }

  async getStripeConnectDashboardLink(
    stripeAccountId: string,
  ): Promise<string> {
    const stripe = getStripe();
    try {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      return loginLink.url;
    } catch (error: unknown) {
      logger.error("[Stripe Connect] Failed to create dashboard link:", error);
      throw error;
    }
  }

  async checkStripeAccountStatus(stripeAccountId: string): Promise<{
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements: unknown;
    capabilities: unknown;
  }> {
    const stripe = getStripe();
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      return {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        capabilities: account.capabilities,
      };
    } catch (error: unknown) {
      logger.error("[Stripe Connect] Failed to check account status:", error);
      throw error;
    }
  }

  async getVendorBalance(vendorId: string): Promise<{
    total_paid_out: number;
    pending_amount: number;
    last_payout: PayoutRecord | null;
  }> {
    const all = (await this.listPayouts({ vendor_id: vendorId })) as any;
    const completed = all.filter((p) => p.status === "completed");
    const pending = all.filter(
      (p) => p.status === "pending" || p.status === "processing",
    );

    const totalPaidOut = completed.reduce(
      (sum, p) => sum + Number(p.net_amount),
      0,
    );
    const pendingAmount = pending.reduce(
      (sum, p) => sum + Number(p.net_amount),
      0,
    );

    return {
      total_paid_out: totalPaidOut,
      pending_amount: pendingAmount,
      last_payout: completed[0] ?? null,
    };
  }

  async retryFailedPayout(
    payoutId: string,
    stripeAccountId: string,
  ): Promise<PayoutRecord> {
    const payout = (await this.retrievePayout(payoutId)) as any;
    if (payout.status !== "failed")
      throw new Error(`Payout ${payoutId} is not in failed status`);
    if ((payout.retry_count ?? 0) >= 3)
      throw new Error(`Payout ${payoutId} has exceeded maximum retry attempts`);

    await this.updatePayouts({
      id: payoutId,
      status: "pending",
      stripe_failure_code: null,
      stripe_failure_message: null,
      failure_reason: null,
    } as any);

    return this.processStripeConnectPayout(payoutId, stripeAccountId);
  }

  async cancelPayout(payoutId: string, reason: string): Promise<PayoutRecord> {
    const payout = (await this.retrievePayout(payoutId)) as any;
    if (!["pending", "on_hold"].includes(payout.status)) {
      throw new Error(`Cannot cancel payout in ${payout.status} status`);
    }
    return this.updatePayouts({
      id: payoutId,
      status: "cancelled",
      failure_reason: reason,
      notes: `Cancelled: ${reason}`,
    });
  }

  async holdPayout(payoutId: string, reason: string): Promise<PayoutRecord> {
    const payout = (await this.retrievePayout(payoutId)) as any;
    if (payout.status !== "pending")
      throw new Error("Can only hold pending payouts");
    return this.updatePayouts({
      id: payoutId,
      status: "on_hold",
      notes: `On hold: ${reason}`,
    });
  }
}

export default PayoutModuleService;
