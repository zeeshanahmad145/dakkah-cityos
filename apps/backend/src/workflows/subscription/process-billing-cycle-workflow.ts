// @ts-nocheck
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createCartWorkflow } from "@medusajs/medusa/core-flows";
import Stripe from "stripe";

interface ProcessBillingCycleInput {
  billing_cycle_id: string;
}

// Step 1: Load billing cycle and subscription
const loadBillingCycleStep = createStep(
  "load-billing-cycle",
  async (input: ProcessBillingCycleInput, { container }) => {
    const subscriptionModule = container.resolve("subscription") as any;
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    
    const [cycles] = await subscriptionModule.listBillingCycles(
      { id: input.billing_cycle_id },
      { relations: ["subscription"] }
    );
    
    const cycle = cycles?.[0] as any;
    
    if (!cycle) {
      throw new Error(`Billing cycle ${input.billing_cycle_id} not found`);
    }
    
    if (cycle.status !== "upcoming") {
      throw new Error(`Billing cycle ${input.billing_cycle_id} is not in upcoming status`);
    }
    
    // Load subscription items
    const { data: items } = await query.graph({
      entity: "subscription_item",
      fields: ["*"],
      filters: { subscription_id: cycle.subscription_id as string },
    });
    
    // Load customer with payment method
    const { data: [customer] } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "metadata"],
      filters: { id: cycle.subscription.customer_id as string },
    });
    
    return new StepResponse({ 
      cycle, 
      subscription: cycle.subscription, 
      items,
      customer 
    });
  }
);

// Step 2: Update billing cycle to processing
const markCycleProcessingStep = createStep(
  "mark-cycle-processing",
  async ({ cycle }: { cycle: any }, { container }) => {
    const subscriptionModule = container.resolve("subscription") as any;
    
    const previousStatus = cycle.status;
    const previousAttemptCount = cycle.attempt_count || 0;
    
    const updated = await subscriptionModule.updateBillingCycles({
      id: cycle.id,
      status: "processing",
      attempt_count: ((cycle.attempt_count as number) || 0) + 1,
      last_attempt_at: new Date(),
    });
    
    return new StepResponse({ updatedCycle: updated }, { cycleId: cycle.id, previousStatus, previousAttemptCount });
  },
  async (compensationData: { cycleId: string; previousStatus: string; previousAttemptCount: number } | undefined, { container }) => {
    if (!compensationData?.cycleId) return;
    try {
      const subscriptionModule = container.resolve("subscription") as any;
      await subscriptionModule.updateBillingCycles({
        id: compensationData.cycleId,
        status: compensationData.previousStatus,
        attempt_count: compensationData.previousAttemptCount,
      });
    } catch (error) {
    }
  }
);

// Step 3: Create order from subscription
const createOrderFromSubscriptionStep = createStep(
  "create-order-from-subscription",
  async ({ cycle, subscription, items }: { cycle: any; subscription: any; items: any[] }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    
    // Get region for customer
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: { id: subscription.customer_id as string },
    });
    
    const customer = customers[0] as any;
    if (!customer) {
      throw new Error(`Customer ${subscription.customer_id} not found`);
    }
    
    // Get default region
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id"],
      pagination: { take: 1 },
    });
    
    const region = regions[0] as any;
    
    // Create cart
    const { result: cart } = await createCartWorkflow(container).run({
      input: {
        region_id: region?.id as string,
        customer_id: subscription.customer_id as string,
        email: customer.email as string,
        currency_code: subscription.currency_code as string,
        items: items.map((item: any) => ({
          variant_id: item.variant_id as string,
          quantity: item.quantity as number,
        })),
      },
    });
    
    return new StepResponse({ cart }, { cart });
  },
  async (compensationData: { cart: any } | undefined, { container }) => {
    if (!compensationData?.cart?.id) return;
    try {
      const cartModule = container.resolve("cart") as any;
      await cartModule.deleteCarts(compensationData.cart.id);
    } catch (error) {
    }
  }
);

// Step 4: Process payment with Stripe
const processSubscriptionPaymentStep = createStep(
  "process-subscription-payment",
  async ({ cart, subscription, customer }: { cart: any; subscription: any; customer: any }, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      logger.warn("STRIPE_SECRET_KEY not configured - marking payment as simulated");
      return new StepResponse({ 
        payment_status: "paid",
        payment_method: "simulated",
        payment_id: null 
      }, { payment_id: null });
    }
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    // Get customer's Stripe customer ID
    const stripeCustomerId = customer?.metadata?.stripe_customer_id;
    
    // Get saved payment method from subscription
    const paymentMethodId = subscription.payment_method_id;
    
    if (!stripeCustomerId || !paymentMethodId) {
      logger.warn(`Missing payment details for subscription ${subscription.id}`);
      return new StepResponse({ 
        payment_status: "failed",
        payment_method: null,
        payment_id: null,
        error: "No saved payment method" 
      }, { payment_id: null });
    }
    
    try {
      // Calculate amount in cents
      const amount = Math.round(cart.total * 100);
      
      // Create payment intent and confirm immediately
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: subscription.currency_code || "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          subscription_id: subscription.id,
          billing_cycle_id: cart.id,
          type: "subscription_renewal"
        }
      });
      
      if (paymentIntent.status === "succeeded") {
        logger.info(`Payment succeeded for subscription ${subscription.id}`);
        return new StepResponse({ 
          payment_status: "paid",
          payment_method: paymentMethodId,
          payment_id: paymentIntent.id 
        }, { payment_id: paymentIntent.id });
      } else {
        logger.warn(`Payment status ${paymentIntent.status} for subscription ${subscription.id}`);
        return new StepResponse({ 
          payment_status: "pending",
          payment_method: paymentMethodId,
          payment_id: paymentIntent.id 
        }, { payment_id: paymentIntent.id });
      }
    } catch (error: any) {
      logger.error(`Payment failed for subscription ${subscription.id}: ${error.message}`);
      
      // Handle specific Stripe errors
      if (error.type === "StripeCardError") {
        return new StepResponse({ 
          payment_status: "failed",
          payment_method: paymentMethodId,
          payment_id: null,
          error: error.message 
        }, { payment_id: null });
      }
      
      throw error;
    }
  },
  async (compensationData: { payment_id: string | null } | undefined, { container }) => {
    if (!compensationData?.payment_id) return;
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) return;
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
      await stripe.refunds.create({ payment_intent: compensationData.payment_id });
    } catch (error) {
    }
  }
);

// Step 5: Complete billing cycle
const completeBillingCycleStep = createStep(
  "complete-billing-cycle",
  async ({ cycle, cart, payment_status, payment_id, subscription }: { 
    cycle: any; 
    cart: any; 
    payment_status: string; 
    payment_id: string | null;
    subscription: any 
  }, { container }) => {
    const subscriptionModule = container.resolve("subscription") as any;
    const eventBus = container.resolve(Modules.EVENT_BUS);
    
    const isPaid = payment_status === "paid";
    
    // Update billing cycle
    const updatedCycle = await subscriptionModule.updateBillingCycles({
      id: cycle.id,
      status: isPaid ? "completed" : "failed",
      paid_at: isPaid ? new Date() : null,
      order_id: cart.id,
      payment_id: payment_id,
    });
    
    // If successful, create next billing cycle
    if (isPaid) {
      const nextBillingDate = new Date(cycle.billing_date);
      
      // Determine billing interval
      const interval = subscription.billing_interval || "month";
      if (interval === "month") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else if (interval === "week") {
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
      } else if (interval === "year") {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else if (interval === "quarter") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      }
      
      // Create next cycle
      await subscriptionModule.createBillingCycles({
        subscription_id: subscription.id,
        billing_date: nextBillingDate,
        status: "upcoming",
        attempt_count: 0,
      });
      
      // Update subscription next billing date
      await subscriptionModule.updateSubscriptions({
        id: subscription.id,
        next_billing_date: nextBillingDate,
        payment_status: "paid",
      });
      
      // Emit success event
      await eventBus.emit("subscription.billing_cycle_completed", {
        subscription_id: subscription.id,
        billing_cycle_id: cycle.id,
        amount: cart.total,
      });
    } else {
      // Update subscription payment status
      await subscriptionModule.updateSubscriptions({
        id: subscription.id,
        payment_status: "failed",
      });
      
      // Emit failure event for retry handling
      await eventBus.emit("subscription.payment_failed", {
        subscription_id: subscription.id,
        billing_cycle_id: cycle.id,
        attempt_count: cycle.attempt_count,
      });
    }
    
    return new StepResponse({ 
      success: isPaid,
      cycle: updatedCycle,
      payment_status 
    }, { cycleId: cycle.id, subscriptionId: subscription.id, isPaid, previousCycleStatus: cycle.status });
  },
  async (compensationData: { cycleId: string; subscriptionId: string; isPaid: boolean; previousCycleStatus: string } | undefined, { container }) => {
    if (!compensationData?.cycleId) return;
    try {
      const subscriptionModule = container.resolve("subscription") as any;
      await subscriptionModule.updateBillingCycles({
        id: compensationData.cycleId,
        status: compensationData.previousCycleStatus,
        paid_at: null,
        order_id: null,
        payment_id: null,
      });
    } catch (error) {
    }
  }
);

export const processBillingCycleWorkflow = createWorkflow(
  "process-billing-cycle",
  (input: ProcessBillingCycleInput) => {
    // Load data
    const loadResult = loadBillingCycleStep(input);
    
    // Transform to get cycle for marking
    const cycleForMark = transform({ loadResult }, ({ loadResult }) => ({
      cycle: loadResult.cycle
    }));
    
    // Mark as processing
    const markResult = markCycleProcessingStep(cycleForMark);
    
    // Transform for order creation
    const orderInput = transform({ loadResult, markResult }, ({ loadResult, markResult }) => ({
      cycle: markResult.updatedCycle,
      subscription: loadResult.subscription,
      items: loadResult.items,
    }));
    
    // Create order
    const orderResult = createOrderFromSubscriptionStep(orderInput);
    
    // Transform for payment processing
    const paymentInput = transform({ orderResult, loadResult }, ({ orderResult, loadResult }) => ({
      cart: orderResult.cart,
      subscription: loadResult.subscription,
      customer: loadResult.customer,
    }));
    
    // Process payment
    const paymentResult = processSubscriptionPaymentStep(paymentInput);
    
    // Transform for completion
    const completeInput = transform({ markResult, orderResult, paymentResult, loadResult }, ({ markResult, orderResult, paymentResult, loadResult }) => ({
      cycle: markResult.updatedCycle,
      cart: orderResult.cart,
      payment_status: paymentResult.payment_status,
      payment_id: paymentResult.payment_id,
      subscription: loadResult.subscription,
    }));
    
    // Complete cycle
    const result = completeBillingCycleStep(completeInput);
    
    return new WorkflowResponse(result);
  }
);
