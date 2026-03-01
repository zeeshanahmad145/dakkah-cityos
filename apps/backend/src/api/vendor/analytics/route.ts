// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { handleApiError } from "../../../lib/api-error-handler";

// GET /vendor/analytics - Get vendor analytics dashboard data
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any;

    const context = req.cityosContext;
    const vendorId = context?.vendorId || req.vendor_id;

    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const { period = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Get current period orders
    const { data: currentOrders } = await query.graph({
      entity: "vendor_order",
      fields: [
        "id",
        "total",
        "commission_amount",
        "net_amount",
        "created_at",
        "status",
      ],
      filters: {
        vendor_id: vendorId,
        created_at: { $gte: startDate.toISOString() },
      },
    });

    // Get previous period orders for comparison
    const { data: previousOrders } = await query.graph({
      entity: "vendor_order",
      fields: ["id", "total"],
      filters: {
        vendor_id: vendorId,
        created_at: {
          $gte: previousStartDate.toISOString(),
          $lt: startDate.toISOString(),
        },
      },
    });

    // Calculate summaries
    const totalRevenue = currentOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.total) || 0),
      0,
    );
    const totalCommission = currentOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.commission_amount) || 0),
      0,
    );
    const netEarnings = currentOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.net_amount) || 0),
      0,
    );
    const totalOrders = currentOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Previous period totals
    const previousRevenue = previousOrders.reduce(
      (sum: number, o: any) => sum + (Number(o.total) || 0),
      0,
    );
    const previousOrderCount = previousOrders.length;

    // Calculate trends
    const revenueChange =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const ordersChange =
      previousOrderCount > 0
        ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
        : 0;

    // Get top products
    const { data: vendorOrderItems } = await query.graph({
      entity: "vendor_order_item",
      fields: ["product_id", "quantity", "total", "product.title"],
      filters: {
        vendor_order: {
          vendor_id: vendorId,
          created_at: { $gte: startDate.toISOString() },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<
      string,
      { title: string; units_sold: number; revenue: number }
    >();
    vendorOrderItems.forEach((item: any) => {
      const existing = productMap.get(item.product_id) || {
        title: item.product?.title || "Unknown",
        units_sold: 0,
        revenue: 0,
      };
      existing.units_sold += Number(item.quantity) || 0;
      existing.revenue += Number(item.total) || 0;
      productMap.set(item.product_id, existing);
    });

    const topProducts = Array.from(productMap.entries())
      .map(([product_id, data]) => ({ product_id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get recent orders
    const { data: recentOrders } = await query.graph({
      entity: "vendor_order",
      fields: ["id", "total", "status", "created_at", "order.display_id"],
      filters: {
        vendor_id: vendorId,
      },
      pagination: {
        take: 5,
      },
    });

    res.json({
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_commission: totalCommission,
        net_earnings: netEarnings,
        average_order_value: averageOrderValue,
      },
      trends: {
        revenue_change: revenueChange,
        orders_change: ordersChange,
      },
      top_products: topProducts,
      recent_orders: recentOrders.map((o: any) => ({
        id: o.id,
        display_id: o.order?.display_id,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
      })),
    });
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor analytics");
  }
}
