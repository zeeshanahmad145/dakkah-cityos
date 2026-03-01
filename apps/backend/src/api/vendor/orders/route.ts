import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

// GET /vendor/orders - List vendor's orders
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const filters: Record<string, unknown> = { vendor_id: vendorId };
    if (status) {
      filters.status = status;
    }

    const { data: vendorOrders } = await query.graph({
      entity: "vendor_order",
      fields: [
        "id",
        "vendor_id",
        "order_id",
        "vendor_order_number",
        "status",
        "subtotal",
        "shipping_total",
        "tax_total",
        "total",
        "commission_amount",
        "net_amount",
        "created_at",
        "shipped_at",
        "delivered_at",
        "order.display_id",
        "order.email",
        "order.shipping_address.*",
        "items.*",
        "items.product.*",
      ],
      filters,
      pagination: {
        skip: Number(offset),
        take: Number(limit),
      },
    });

    const orders = vendorOrders.map((vo: any) => ({
      id: vo.id,
      order_id: vo.order_id,
      vendor_order_number: vo.vendor_order_number,
      display_id: vo.order?.display_id,
      customer_email: vo.order?.email,
      shipping_address: vo.order?.shipping_address,
      status: vo.status,
      subtotal: vo.subtotal,
      shipping_total: vo.shipping_total,
      tax_total: vo.tax_total,
      total: vo.total,
      commission_amount: vo.commission_amount,
      net_amount: vo.net_amount,
      items: vo.items || [],
      created_at: vo.created_at,
      shipped_at: vo.shipped_at,
      delivered_at: vo.delivered_at,
    }));

    res.json({ orders, count: orders.length });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor orders");
  }
}
