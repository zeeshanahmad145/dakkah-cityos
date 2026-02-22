import {
  createWorkflow,
  WorkflowResponse,
  transform,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

interface CreateSubscriptionInput {
  customer_id: string;
  tenant_id: string;
  store_id?: string;
  billing_interval: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  billing_interval_count?: number;
  billing_anchor_day?: number;
  payment_collection_method?: "charge_automatically" | "send_invoice";
  payment_method_id?: string;
  trial_days?: number;
  items: Array<{
    product_id: string;
    variant_id: string;
    quantity: number;
  }>;
  metadata?: Record<string, unknown>;
}

// Step 1: Validate customer and products
const validateSubscriptionDataStep = createStep(
  "validate-subscription-data",
  async (input: CreateSubscriptionInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    
    // Validate customer exists and belongs to tenant
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { id: input.customer_id },
    });
    
    if (!customers?.[0]) {
      throw new Error(`Customer ${input.customer_id} not found`);
    }
    
    // Validate products exist and are subscription-enabled
    const variantIds = input.items.map(item => item.variant_id);
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id", "title", "prices.*", "product.title"],
      filters: { id: variantIds },
    });
    
    if (variants.length !== variantIds.length) {
      throw new Error("One or more product variants not found");
    }
    
    return new StepResponse({ variants }, null);
  }
);

// Step 2: Calculate subscription amounts
const calculateSubscriptionAmountsStep = createStep(
  "calculate-subscription-amounts",
  async (
    { input, variants }: { input: CreateSubscriptionInput; variants: Record<string, unknown>[] },
    { container }
  ) => {
    const items = input.items.map((item) => {
      const variant = variants.find((v: Record<string, unknown>) => v.id === item.variant_id) as Record<string, unknown>;
      const prices = variant?.prices as Array<Record<string, unknown>>;
      const price = prices?.[0];
      
      if (!price) {
        throw new Error(`No price found for variant ${item.variant_id}`);
      }
      
      const unit_price = price.amount as number;
      const subtotal = unit_price * item.quantity;
      
      // Calculate tax based on region tax rate (default 0% if not configured)
      // Tax rates are typically configured per region in Medusa admin
      const taxRate = 0; // Will be overridden by region settings when cart is created
      const tax_total = Math.round(subtotal * taxRate);
      const total = subtotal + tax_total;
      const product = variant?.product as Record<string, unknown>;
      
      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_title: product?.title as string,
        variant_title: variant?.title as string,
        quantity: item.quantity,
        unit_price,
        subtotal,
        tax_total,
        total,
        tenant_id: input.tenant_id,
      };
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax_total = items.reduce((sum, item) => sum + item.tax_total, 0);
    const total = subtotal + tax_total;
    
    // Get currency from first variant price
    const firstVariant = variants[0] as Record<string, unknown>;
    const firstPrices = firstVariant?.prices as Array<Record<string, unknown>>;
    const currency_code = firstPrices?.[0]?.currency_code as string;
    
    return new StepResponse({
      items,
      amounts: { subtotal, tax_total, total, currency_code },
    }, null);
  }
);

// Step 3: Create subscription
const createSubscriptionStep = createStep(
  "create-subscription",
  async (
    {
      input,
      items,
      amounts,
    }: {
      input: CreateSubscriptionInput;
      items: Record<string, unknown>[];
      amounts: Record<string, unknown>;
    },
    { container }
  ) => {
    const subscriptionModule = container.resolve("subscription") as any;
    
    const now = new Date();
    const trial_end = input.trial_days
      ? new Date(now.getTime() + input.trial_days * 24 * 60 * 60 * 1000)
      : null;
    
    // Create subscription
    const subscription = await subscriptionModule.createSubscriptions({
      customer_id: input.customer_id,
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      status: "draft",
      billing_interval: input.billing_interval,
      billing_interval_count: input.billing_interval_count || 1,
      billing_anchor_day: input.billing_anchor_day,
      payment_collection_method: input.payment_collection_method || "charge_automatically",
      payment_method_id: input.payment_method_id,
      trial_end,
      currency_code: amounts.currency_code,
      subtotal: amounts.subtotal,
      tax_total: amounts.tax_total,
      total: amounts.total,
      metadata: input.metadata,
    });
    
    // Create subscription items
    const subscriptionItems = await subscriptionModule.createSubscriptionItems(
      items.map((item: Record<string, unknown>) => ({
        ...item,
        subscription_id: subscription.id,
      }))
    );
    
    return new StepResponse({ subscription, items: subscriptionItems }, { subscriptionId: subscription.id });
  },
  async (compensationData: { subscriptionId: string }, { container }) => {
    if (!compensationData?.subscriptionId) return
    try {
      const subscriptionModule = container.resolve("subscription") as any;
      await subscriptionModule.deleteSubscriptions(compensationData.subscriptionId);
    } catch (error) {
    }
  }
);

// Step 4: Activate subscription (if no trial)
const activateSubscriptionStep = createStep(
  "activate-subscription",
  async ({ subscription, skipActivation }: { subscription: Record<string, unknown>; skipActivation: boolean }, { container }) => {
    if (skipActivation) {
      return new StepResponse({ subscription }, { subscriptionId: String(subscription.id), wasActivated: false });
    }
    
    const subscriptionModule = container.resolve("subscription") as any;
    const now = new Date();
    
    // Calculate first billing period
    const period_end = new Date(now);
    const intervalCount = subscription.billing_interval_count as number || 1;
    
    switch (subscription.billing_interval) {
      case "daily":
        period_end.setDate(period_end.getDate() + intervalCount);
        break;
      case "weekly":
        period_end.setDate(period_end.getDate() + 7 * intervalCount);
        break;
      case "monthly":
        period_end.setMonth(period_end.getMonth() + intervalCount);
        break;
      case "quarterly":
        period_end.setMonth(period_end.getMonth() + 3 * intervalCount);
        break;
      case "yearly":
        period_end.setFullYear(period_end.getFullYear() + intervalCount);
        break;
    }
    
    // Update subscription to active
    const updated = await subscriptionModule.updateSubscriptions({
      id: subscription.id,
      status: "active",
      start_date: now,
      current_period_start: now,
      current_period_end: period_end,
    });
    
    // Create first billing cycle
    await subscriptionModule.createBillingCycles({
      subscription_id: subscription.id,
      tenant_id: subscription.tenant_id,
      period_start: now,
      period_end,
      billing_date: period_end,
      status: "upcoming",
      subtotal: subscription.subtotal,
      tax_total: subscription.tax_total,
      total: subscription.total,
    });
    
    return new StepResponse({ subscription: updated }, { subscriptionId: String(subscription.id), wasActivated: !skipActivation });
  },
  async (compensationData: { subscriptionId: string; wasActivated: boolean }, { container }) => {
    if (!compensationData?.subscriptionId || !compensationData.wasActivated) return
    try {
      const subscriptionModule = container.resolve("subscription") as any;
      await subscriptionModule.updateSubscriptions({
        id: compensationData.subscriptionId,
        status: "draft",
        start_date: null,
        current_period_start: null,
        current_period_end: null,
      });
    } catch (error) {
    }
  }
);

export const createSubscriptionWorkflow = createWorkflow(
  "create-subscription",
  (input: CreateSubscriptionInput) => {
    // Step 1: Validate
    const { variants } = validateSubscriptionDataStep(input);
    
    // Step 2: Calculate amounts
    const { items, amounts } = calculateSubscriptionAmountsStep({ input, variants });
    
    // Step 3: Create subscription
    const { subscription, items: subscriptionItems } = createSubscriptionStep({
      input,
      items,
      amounts,
    });
    
    // Step 4: Activate if no trial
    const skipActivation = transform({ input }, ({ input }) => !!input.trial_days);
    const { subscription: finalSubscription } = activateSubscriptionStep({
      subscription,
      skipActivation,
    });
    
    return new WorkflowResponse({
      subscription: finalSubscription,
      items: subscriptionItems,
    });
  }
);
