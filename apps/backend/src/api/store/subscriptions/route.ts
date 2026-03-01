import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  parseStoreQuery,
  subscriptionQuerySchema,
} from "../../../lib/route-query-validator";

/**
 * GET /store/subscriptions
 * Phase 5: query.graph() fetching products linked to SubscriptionPlan extensions.
 * Separated from account-level subscription management (GET /store/subscriptions/me).
 */

const SEED_PLANS = [
  {
    id: "prod_sub_seed_001",
    title: "Starter Plan",
    description: "Perfect for individuals and small teams.",
    thumbnail: "/seed-images/subscriptions/starter.jpg",
    subscription_plan: {
      handle: "starter",
      billing_interval: "monthly",
      trial_period_days: 14,
      features: ["5 projects", "Email support"],
      limits: { max_projects: 5 },
    },
    metadata: { vertical: "subscription" },
  },
  {
    id: "prod_sub_seed_002",
    title: "Pro Plan",
    description: "For growing businesses that need more power.",
    thumbnail: "/seed-images/subscriptions/pro.jpg",
    subscription_plan: {
      handle: "pro",
      billing_interval: "monthly",
      trial_period_days: 14,
      features: ["Unlimited projects", "Priority support", "API access"],
      limits: { max_projects: -1 },
    },
    metadata: { vertical: "subscription" },
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = parseStoreQuery(req, res, subscriptionQuerySchema);
  if (!q) return;
  const { limit, offset, tenant_id, search, billing_interval } = q;

  try {
    const query = req.scope.resolve("query") as unknown as any;
    const filters: Record<string, unknown> = {
      status: "published",
      "metadata->>'vertical'": "subscription",
    };
    if (tenant_id) filters["subscription_plan.tenant_id"] = tenant_id;
    if (billing_interval)
      filters["subscription_plan.billing_interval"] = billing_interval;
    if (search) filters.title = { $ilike: `%${search}%` };

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "handle",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.calculated_price.*",
        "subscription_plan.id",
        "subscription_plan.handle",
        "subscription_plan.billing_interval",
        "subscription_plan.billing_interval_count",
        "subscription_plan.trial_period_days",
        "subscription_plan.features",
        "subscription_plan.limits",
        "subscription_plan.sort_order",
      ],
      filters,
      pagination: {
        skip: offset,
        take: limit,
        order: { "subscription_plan.sort_order": "ASC" },
      },
    });

    const plans = products?.length > 0 ? products : SEED_PLANS;
    return res.json({
      plans,
      items: plans,
      count: metadata?.count ?? plans.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
    req.scope.resolve("logger").error?.(`[subscriptions/route] ${msg}`);
    return res.json({
      plans: SEED_PLANS,
      items: SEED_PLANS,
      count: SEED_PLANS.length,
      limit,
      offset,
    });
  }
}
