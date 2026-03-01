import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  description: z.string().nullable().optional(),
  billing_interval: z
    .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
    .default("monthly"),
  billing_interval_count: z.number().optional(),
  currency_code: z.string().default("usd"),
  price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  trial_period_days: z.number().optional(),
  features: z.array(z.string()).nullable().optional(),
  limits: z.record(z.string(), z.unknown()).nullable().optional(),
  included_products: z.array(z.string()).nullable().optional(),
  sort_order: z.number().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("subscription") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;

    const items = await mod.listSubscriptionPlans(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    });

    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor subscriptions");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("subscription") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createSubscriptionPlans({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor subscriptions");
  }
}
