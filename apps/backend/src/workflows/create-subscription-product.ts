/**
 * create-subscription-product workflow
 *
 * Creates a Medusa Product for a subscription plan tier, then creates
 * the SubscriptionPlan domain record and links them.
 *
 * Step 1: createProducts() → Medusa Product
 * Step 2: Create SubscriptionPlan domain record + remoteLink
 * Step 3: Attach PriceSet with billing_interval metadata (monthly/yearly variants)
 *
 * Compensation: rollback all steps on failure.
 */
import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Use the same string key used in medusa-config.ts for module registration
const SUBSCRIPTION_MODULE = "subscription";

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateSubscriptionProductInput = {
  tenant_id?: string;
  /** Unique URL-safe handle for the plan, e.g. "pro-monthly" */
  handle: string;
  /** Display name */
  title: string;
  description?: string;
  thumbnail?: string;
  billing_interval: "monthly" | "yearly" | "weekly" | "quarterly";
  billing_interval_count?: number;
  trial_period_days?: number;
  features?: string[];
  limits?: Record<string, number>;
  sort_order?: number;
  /** Monthly price in smallest currency unit */
  monthly_price: number;
  /** Yearly price in smallest currency unit (optional) */
  yearly_price?: number;
  currency_code?: string;
};

// ─── Step 1: Create Medusa Product ────────────────────────────────────────────

const createSubProductStep = createStep(
  "create-subscription-medusa-product",
  async (input: CreateSubscriptionProductInput, { container }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variants: any[] = [
      {
        title: `${input.billing_interval.charAt(0).toUpperCase()}${input.billing_interval.slice(1)} Plan`,
        options: { Billing: input.billing_interval },
        prices: [
          {
            amount: input.monthly_price,
            currency_code: input.currency_code ?? "SAR",
          },
        ],
      },
    ];

    // Add yearly variant if price is given
    if (input.yearly_price) {
      variants.push({
        title: "Annual Plan (2 months free)",
        options: { Billing: "yearly" },
        prices: [
          {
            amount: input.yearly_price,
            currency_code: input.currency_code ?? "SAR",
          },
        ],
      });
    }

    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: input.title,
            description: input.description ?? null,
            thumbnail: input.thumbnail ?? null,
            status: "published",
            metadata: {
              vertical: "subscription",
              tenant_id: input.tenant_id,
              plan_handle: input.handle,
            },
            options: [{ title: "Billing", values: ["monthly", "yearly"] }],
            variants,
          },
        ],
      },
    });

    const product = result[0];
    return new StepResponse(product, { productId: product.id });
  },
  async ({ productId }, { container }) => {
    const productService = container.resolve("product") as unknown as any;
    await productService.deleteProducts([productId]);
  },
);

// ─── Step 2: Create SubscriptionPlan domain record ────────────────────────────

const createSubscriptionPlanStep = createStep(
  "create-subscription-plan-domain-record",
  async (
    {
      input,
      productId,
    }: { input: CreateSubscriptionProductInput; productId: string },
    { container },
  ) => {
    const subscriptionService = container.resolve(SUBSCRIPTION_MODULE) as unknown as any;
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    const [plan] = await subscriptionService.createSubscriptionPlans([
      {
        tenant_id: input.tenant_id ?? null,
        handle: input.handle,
        billing_interval: input.billing_interval,
        billing_interval_count: input.billing_interval_count ?? 1,
        trial_period_days: input.trial_period_days ?? 0,
        features: input.features ?? [],
        limits: input.limits ?? {},
        sort_order: input.sort_order ?? 0,
      },
    ]);

    await remoteLink.create([
      {
        [SUBSCRIPTION_MODULE]: { subscription_plan_id: plan.id },
        product: { product_id: productId },
      },
    ]);

    return new StepResponse({ planId: plan.id }, { planId: plan.id });
  },
  async ({ planId }, { container }) => {
    const subscriptionService = container.resolve(SUBSCRIPTION_MODULE) as unknown as any;
    await subscriptionService.deleteSubscriptionPlans([planId]);
  },
);

// ─── Workflow ──────────────────────────────────────────────────────────────────

export type CreateSubscriptionProductResult = {
  productId: string;
  planId: string;
};

export const createSubscriptionProductWorkflow = createWorkflow(
  "create-subscription-product",
  function (
    input: CreateSubscriptionProductInput,
  ): WorkflowResponse<CreateSubscriptionProductResult> {
    const product = createSubProductStep(input);
    const { planId } = createSubscriptionPlanStep({
      input,
      productId: product.id,
    });
    return new WorkflowResponse({ productId: product.id, planId });
  },
);
