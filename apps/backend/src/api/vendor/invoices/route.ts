import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  order_id: z.string().nullable().optional(),
  customer_id: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
        tax_rate: z.number().optional(),
      }),
    )
    .optional(),
  notes: z.string().nullable().optional(),
  currency_code: z.string().min(1),
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

    const mod = req.scope.resolve("invoice") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
      search,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;
    if (search) filters.search = search;

    const items = await mod.listInvoices(filters, {
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
    handleApiError(res, error, "GET vendor invoices");
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

    const mod = req.scope.resolve("invoice") as unknown as any;
    const body = req.body as Record<string, unknown>;
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createInvoices({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor invoices");
  }
}
