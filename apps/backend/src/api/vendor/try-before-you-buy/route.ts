import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  product_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  trial_duration_days: z.number().int().min(1).default(14),
  deposit_amount: z.number().optional(),
  retail_price: z.number(),
  currency_code: z.string().default("usd"),
  max_trials_per_customer: z.number().int().optional(),
  return_shipping_paid_by: z.enum(["vendor", "customer"]).default("customer"),
  condition_requirements: z.string().nullable().optional(),
  auto_charge_after_trial: z.boolean().default(true),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("vendor") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = {
    vendor_id: vendorId,
    type: "try_before_you_buy",
  };
  if (status) filters.status = status;

  const items = await mod.listVendorProducts(filters, {
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
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("vendor") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const item = await mod.createVendorProducts({
    ...validation.data,
    vendor_id: vendorId,
    type: "try_before_you_buy",
  });

  return res.status(201).json({ item });
}
