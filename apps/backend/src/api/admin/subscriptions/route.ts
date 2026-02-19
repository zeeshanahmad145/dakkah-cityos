/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSubscriptionWorkflow } from "../../../workflows/subscription/create-subscription-workflow";
import { handleApiError } from "../../../lib/api-error-handler"

const createSubscriptionSchema = z.object({
  customer_id: z.string(),
  billing_interval: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  billing_interval_count: z.number().optional(),
  billing_anchor_day: z.number().min(0).max(31).optional(),
  payment_collection_method: z.enum(["charge_automatically", "send_invoice"]).optional(),
  payment_method_id: z.string().optional(),
  trial_days: z.number().optional(),
  items: z.array(
    z.object({
      product_id: z.string(),
      variant_id: z.string(),
      quantity: z.number().min(1),
    })
  ),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// GET /admin/subscriptions - List subscriptions
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const subscriptionModule = req.scope.resolve("subscription") as any;
    const extReq = req as any;
    const tenantId = extReq.tenant?.id || "";
  
    const { offset = 0, limit = 20, status, customer_id } = req.query as Record<string, string | undefined>;
  
    const filters: Record<string, unknown> = {};
    if (tenantId) filters.tenant_id = tenantId;
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;
  
    const subscriptions = await subscriptionModule.listSubscriptions(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });
  
    res.json({
      subscriptions,
      count: Array.isArray(subscriptions) ? subscriptions.length : 0,
      offset: Number(offset),
      limit: Number(limit),
    });

  } catch (error: any) {
    handleApiError(res, error, "GET admin subscriptions")}
}

// POST /admin/subscriptions - Create subscription
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const extReq = req as any;
    const tenantId = extReq.tenant?.id;
    const storeId = extReq.store?.id;
  
    const parsed = createSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues });
    }
  
    const { result } = await createSubscriptionWorkflow(req.scope).run({
      input: {
        ...parsed.data,
        tenant_id: tenantId || "",
        store_id: storeId,
      },
    });
  
    res.status(201).json({ subscription: result.subscription });

  } catch (error: any) {
    handleApiError(res, error, "POST admin subscriptions")}
}

