import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  customer_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().optional(),
        description: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
      }),
    )
    .optional(),
  valid_until: z.string().nullable().optional(),
  currency_code: z.string().min(1),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const updateSchema = z.object({
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "expired", "converted"])
    .optional(),
  items: z.any().optional(),
  valid_until: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

    const mod = req.scope.resolve("quote") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
      search,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;
    if (search) filters.search = search;

    const items = await mod.listQuotes(filters, {
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
    handleApiError(res, error, "GET vendor quotes");
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

    const mod = req.scope.resolve("quote") as unknown as any;
    const body = req.body as Record<string, unknown>;
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createQuotes({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor quotes");
  }
}
