import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  product_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  quantity: z.number().min(1),
  price: z.number(),
  currency_code: z.string().min(1),
  commission_rate: z.number().optional(),
  status: z
    .enum(["pending", "active", "sold", "returned", "expired"])
    .optional(),
  expires_at: z.string().nullable().optional(),
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

    const query = req.scope.resolve("query") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      status,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = { vendor_id: vendorId };
    if (status) filters.status = status;

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "fulfillments.id",
        "fulfillments.tracking_links",
        "fulfillments.shipped_at",
        "fulfillments.delivered_at",
        "fulfillments.canceled_at",
        "fulfillments.created_at",
        "fulfillments.items.id",
        "fulfillments.items.title",
        "fulfillments.items.quantity",
      ],
      filters: filters,
      pagination: {
        skip: Number(offset),
        take: Number(limit),
        order: { created_at: "DESC" },
      },
    });

    const consignments = (Array.isArray(orders) ? orders : []).flatMap(
      (order: any) =>
        (order.fulfillments || []).map((f: any) => ({
          id: f.id,
          order_id: order.id,
          order_display_id: order.display_id,
          tracking_links: f.tracking_links || [],
          shipped_at: f.shipped_at,
          delivered_at: f.delivered_at,
          canceled_at: f.canceled_at,
          created_at: f.created_at,
          items: f.items || [],
          status: f.delivered_at
            ? "delivered"
            : f.canceled_at
              ? "canceled"
              : f.shipped_at
                ? "shipped"
                : "processing",
        })),
    );

    return res.json({
      items: consignments,
      count: consignments.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor consignments");
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

    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const query = req.scope.resolve("query") as unknown as any;

    const item = {
      ...validation.data,
      vendor_id: vendorId,
      created_at: new Date().toISOString(),
    };

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor consignments");
  }
}
