import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  product_id: z.string().optional(),
  category: z.string().nullable().optional(),
  condition_criteria: z
    .array(z.record(z.string(), z.unknown()))
    .nullable()
    .optional(),
  min_trade_value: z.number().optional(),
  max_trade_value: z.number().optional(),
  currency_code: z.string().default("usd"),
  credit_type: z
    .enum(["store_credit", "cash", "discount"])
    .default("store_credit"),
  bonus_percentage: z.number().optional(),
  eligible_products: z.array(z.string()).nullable().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
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

    const mod = req.scope.resolve("automotive") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;

    const items = await mod.listTradeIns(filters, {
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
    handleApiError(res, error, "GET vendor trade-in");
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

    const mod = req.scope.resolve("automotive") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createTradeIns({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor trade-in");
  }
}
