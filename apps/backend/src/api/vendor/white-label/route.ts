import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  product_id: z.string().optional(),
  base_product_sku: z.string().nullable().optional(),
  custom_branding: z.record(z.string(), z.unknown()).nullable().optional(),
  custom_packaging: z.record(z.string(), z.unknown()).nullable().optional(),
  label_template_url: z.string().nullable().optional(),
  min_order_quantity: z.number().int().optional(),
  unit_cost: z.number().optional(),
  retail_price: z.number().optional(),
  currency_code: z.string().default("usd"),
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

    const mod = req.scope.resolve("vendor") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {
      vendor_id: vendorId,
      type: "white_label",
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
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor white-label");
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

    const mod = req.scope.resolve("vendor") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createVendorProducts({
      ...validation.data,
      vendor_id: vendorId,
      type: "white_label",
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor white-label");
  }
}
