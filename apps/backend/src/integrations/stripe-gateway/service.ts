import { MedusaError } from "@medusajs/framework/utils";
import { createLogger } from "../../lib/logger"
const logger = createLogger("integration:stripe-gateway")

export interface StripeGatewayConfig {
  secretKey: string;
  webhookSecret: string;
  connectEnabled?: boolean;
}

export class StripeGatewayService {
  private config: StripeGatewayConfig;
  private stripeInstance: any | null = null;

  constructor(config: StripeGatewayConfig) {
    if (!config.secretKey) {
      logger.warn("[StripeGateway] Missing secretKey configuration");
    }
    if (!config.webhookSecret) {
      logger.warn("[StripeGateway] Missing webhookSecret configuration");
    }

    this.config = config;
  }

  private async getStripe(): Promise<any> {
    if (!this.stripeInstance) {
      const Stripe = (await import("stripe")).default;
      this.stripeInstance = new Stripe(this.config.secretKey);
    }
    return this.stripeInstance;
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
    tenantId: string;
    nodeId: string;
  }): Promise<{
    id: string;
    clientSecret: string;
    status: string;
  }> {
    try {
      logger.info(`[StripeGateway] Creating payment intent for tenant: ${data.tenantId}`);
      const stripe = await this.getStripe();

      const params: Record<string, any> = {
        amount: data.amount,
        currency: data.currency,
        metadata: {
          ...data.metadata,
          tenantId: data.tenantId,
          nodeId: data.nodeId,
        },
      };

      if (data.customerId) {
        params.customer = data.customerId;
      }

      const paymentIntent = await stripe.paymentIntents.create(params);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create payment intent: ${error.message}`
      );
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<{
    id: string;
    status: string;
  }> {
    try {
      logger.info(`[StripeGateway] Confirming payment intent: ${paymentIntentId}`);
      const stripe = await this.getStripe();

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to confirm payment intent: ${error.message}`
      );
    }
  }

  async createRefund(data: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }): Promise<{
    id: string;
    status: string;
    amount: number;
  }> {
    try {
      logger.info(`[StripeGateway] Creating refund for payment: ${data.paymentIntentId}`);
      const stripe = await this.getStripe();

      const params: Record<string, any> = {
        payment_intent: data.paymentIntentId,
      };

      if (data.amount) {
        params.amount = data.amount;
      }
      if (data.reason) {
        params.reason = data.reason;
      }

      const refund = await stripe.refunds.create(params);

      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create refund: ${error.message}`
      );
    }
  }

  async createCustomer(data: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    email: string;
    name: string;
  }> {
    try {
      logger.info(`[StripeGateway] Creating customer: ${data.email}`);
      const stripe = await this.getStripe();

      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: data.metadata || {},
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create customer: ${error.message}`
      );
    }
  }

  async createConnectAccount(data: {
    vendorEmail: string;
    vendorName: string;
    country: string;
    tenantId: string;
  }): Promise<{
    accountId: string;
    onboardingUrl?: string;
  }> {
    try {
      logger.info(`[StripeGateway] Creating Connect account for vendor: ${data.vendorName}`);
      const stripe = await this.getStripe();

      const account = await stripe.accounts.create({
        type: "express",
        email: data.vendorEmail,
        country: data.country,
        business_profile: {
          name: data.vendorName,
        },
        metadata: {
          tenantId: data.tenantId,
        },
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.STORE_URL || process.env.STOREFRONT_URL || ""}/vendor/stripe-connect/refresh`,
        return_url: `${process.env.STORE_URL || process.env.STOREFRONT_URL || ""}/vendor/stripe-connect/complete`,
        type: "account_onboarding",
      });

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create Connect account: ${error.message}`
      );
    }
  }

  async createTransfer(data: {
    amount: number;
    currency: string;
    destinationAccountId: string;
    transferGroup?: string;
  }): Promise<{
    id: string;
    amount: number;
    status: string;
  }> {
    try {
      logger.info(`[StripeGateway] Creating transfer to: ${data.destinationAccountId}`);
      const stripe = await this.getStripe();

      const params: Record<string, any> = {
        amount: data.amount,
        currency: data.currency,
        destination: data.destinationAccountId,
      };

      if (data.transferGroup) {
        params.transfer_group = data.transferGroup;
      }

      const transfer = await stripe.transfers.create(params);

      return {
        id: transfer.id,
        amount: transfer.amount,
        status: "completed",
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create transfer: ${error.message}`
      );
    }
  }

  async createPayout(data: {
    amount: number;
    currency: string;
    stripeAccountId: string;
  }): Promise<{
    id: string;
    amount: number;
    status: string;
  }> {
    try {
      logger.info(`[StripeGateway] Creating payout for account: ${data.stripeAccountId}`);
      const stripe = await this.getStripe();

      const payout = await stripe.payouts.create(
        {
          amount: data.amount,
          currency: data.currency,
        },
        {
          stripeAccount: data.stripeAccountId,
        }
      );

      return {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create payout: ${error.message}`
      );
    }
  }

  async constructWebhookEvent(body: string, signature: string): Promise<any> {
    try {
      logger.info("[StripeGateway] Constructing webhook event");
      const stripe = await this.getStripe();

      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        this.config.webhookSecret
      );

      return event;
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Webhook signature verification failed: ${error.message}`
      );
    }
  }

  async getPaymentMethods(customerId: string): Promise<
    Array<{
      id: string;
      type: string;
      card?: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
      };
    }>
  > {
    try {
      logger.info(`[StripeGateway] Getting payment methods for customer: ${customerId}`);
      const stripe = await this.getStripe();

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : undefined,
      }));
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to get payment methods: ${error.message}`
      );
    }
  }

  async getAccountBalance(stripeAccountId?: string): Promise<{
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  }> {
    try {
      logger.info(String(`[StripeGateway] Getting account balance${stripeAccountId ? ` for: ${stripeAccountId}` : ""}`));
      const stripe = await this.getStripe();

      const options: Record<string, any> = {};
      if (stripeAccountId) {
        options.stripeAccount = stripeAccountId;
      }

      const balance = await stripe.balance.retrieve(options);

      return {
        available: balance.available.map((b: any) => ({
          amount: b.amount,
          currency: b.currency,
        })),
        pending: balance.pending.map((b: any) => ({
          amount: b.amount,
          currency: b.currency,
        })),
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to get account balance: ${error.message}`
      );
    }
  }

  async createSubscription(data: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    status: string;
    currentPeriodEnd: number;
  }> {
    try {
      logger.info(`[StripeGateway] Creating subscription for customer: ${data.customerId}`);
      const stripe = await this.getStripe();

      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata || {},
      });

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to create subscription: ${error.message}`
      );
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
  }> {
    try {
      logger.info(`[StripeGateway] Cancelling subscription: ${subscriptionId}`);
      const stripe = await this.getStripe();

      const subscription = await stripe.subscriptions.cancel(subscriptionId);

      return {
        id: subscription.id,
        status: subscription.status,
      };
    } catch (error: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[StripeGateway] Failed to cancel subscription: ${error.message}`
      );
    }
  }
}
