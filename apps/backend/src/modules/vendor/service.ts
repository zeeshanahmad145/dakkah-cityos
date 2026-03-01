import { MedusaService } from "@medusajs/framework/utils";
import Vendor from "./models/vendor";
import VendorUser from "./models/vendor-user";
import { VendorProduct } from "./models/vendor-product";
import { VendorOrder, VendorOrderItem } from "./models/vendor-order";
import {
  VendorAnalyticsSnapshot,
  VendorPerformanceMetric,
} from "./models/vendor-analytics";
import MarketplaceListing from "./models/marketplace-listing";

/**
 * Vendor Module Service
 *
 * Manages marketplace vendors, product attribution, orders, and analytics.
 */
class VendorModuleService extends MedusaService({
  Vendor,
  VendorUser,
  VendorProduct,
  VendorOrder,
  VendorOrderItem,
  VendorAnalyticsSnapshot,
  VendorPerformanceMetric,
  MarketplaceListing,
}) {
  // ============ Vendor Management ============

  /**
   * Generate vendor order number
   */
  async generateVendorOrderNumber(vendorId: string): Promise<string> {
    const vendor = (await this.retrieveVendor(vendorId)) as any;
    const prefix = vendor.handle?.substring(0, 4).toUpperCase() || "VO";
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  }

  /**
   * Get vendors by status
   */
  async listVendorsByStatus(status: string, tenantId?: string) {
    const filters: Record<string, unknown> = { status };
    if (tenantId) filters.tenant_id = tenantId;
    return (await this.listVendors(filters)) as any;
  }

  /**
   * Approve vendor
   */
  async approveVendor(
    vendorId: string,
    approverId: string,
    notes?: string,
  ): Promise<any> {
    return await this.updateVendors({
      id: vendorId,
      verification_status: "approved",
      verification_approved_by: approverId,
      verification_approved_at: new Date(),
      verification_notes: notes,
      status: "active",
    } as any);
  }

  /**
   * Reject vendor
   */
  async rejectVendor(
    vendorId: string,
    approverId: string,
    reason: string,
  ): Promise<any> {
    return await this.updateVendors({
      id: vendorId,
      verification_status: "rejected",
      verification_approved_by: approverId,
      verification_approved_at: new Date(),
      verification_notes: reason,
    } as any);
  }

  /**
   * Suspend vendor
   */
  async suspendVendor(vendorId: string, reason: string): Promise<any> {
    return await this.updateVendors({
      id: vendorId,
      status: "suspended",
      verification_notes: reason,
    } as any);
  }

  // ============ Product Attribution ============

  /**
   * Assign product to vendor
   */
  async assignProductToVendor(
    vendorId: string,
    productId: string,
    options?: {
      isPrimary?: boolean;
      commissionOverride?: number;
      vendorSku?: string;
      vendorCost?: number;
    },
  ): Promise<any> {
    const existing = (await this.listVendorProducts({
      vendor_id: vendorId,
      product_id: productId,
    })) as any;

    const existingList = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);

    if (existingList.length > 0) {
      throw new Error("Product already assigned to this vendor");
    }

    return await this.createVendorProducts({
      vendor_id: vendorId,
      product_id: productId,
      is_primary_vendor: options?.isPrimary ?? true,
      vendor_sku: options?.vendorSku,
      vendor_cost: options?.vendorCost,
      commission_override: options?.commissionOverride !== undefined,
      commission_rate: options?.commissionOverride,
      commission_type: options?.commissionOverride ? "percentage" : null,
      status: "pending_approval",
    } as any);
  }

  /**
   * Get vendor for product
   */
  async getVendorForProduct(productId: string): Promise<any | null> {
    const vendorProducts = (await this.listVendorProducts({
      product_id: productId,
      is_primary_vendor: true,
      status: "approved",
    })) as any;

    const list = Array.isArray(vendorProducts)
      ? vendorProducts
      : [vendorProducts].filter(Boolean);

    if (list.length === 0) return null;

    return (await this.retrieveVendor(list[0].vendor_id)) as any;
  }

  /**
   * Get all products for vendor
   */
  async getVendorProducts(vendorId: string, status?: string): Promise<any[]> {
    const filters: Record<string, unknown> = { vendor_id: vendorId };
    if (status) filters.status = status;

    const products = (await this.listVendorProducts(filters)) as any;
    return Array.isArray(products) ? products : [products].filter(Boolean);
  }

  // ============ Order Management ============

  /**
   * Create vendor order from platform order
   */
  async createVendorOrderFromOrder(
    vendorId: string,
    orderId: string,
    items: Array<{
      lineItemId: string;
      productId: string;
      variantId?: string;
      title: string;
      sku?: string;
      thumbnail?: string;
      quantity: number;
      unitPrice: number;
      vendorCost?: number;
    }>,
    shippingAddress: any,
    commissionRate: number = 15,
  ): Promise<any> {
    const orderNumber = await this.generateVendorOrderNumber(vendorId);

    // Calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const itemSubtotal = item.unitPrice * item.quantity;
      const commissionAmount = itemSubtotal * (commissionRate / 100);
      const netAmount = itemSubtotal - commissionAmount;

      subtotal += itemSubtotal;

      orderItems.push({
        line_item_id: item.lineItemId,
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        sku: item.sku,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: itemSubtotal,
        total: itemSubtotal,
        vendor_cost: item.vendorCost,
        commission_amount: commissionAmount,
        net_amount: netAmount,
      });
    }

    const totalCommission = subtotal * (commissionRate / 100);
    const netAmount = subtotal - totalCommission;

    // Create vendor order
    const vendorOrder = await this.createVendorOrders({
      vendor_id: vendorId,
      order_id: orderId,
      vendor_order_number: orderNumber,
      subtotal,
      total: subtotal,
      commission_amount: totalCommission,
      net_amount: netAmount,
      shipping_address: shippingAddress,
    } as any);

    // Create order items
    for (const item of orderItems) {
      await this.createVendorOrderItems({
        ...item,
        vendor_order_id: vendorOrder.id,
      } as any);
    }

    return vendorOrder;
  }

  /**
   * Update vendor order status
   */
  async updateVendorOrderStatus(
    vendorOrderId: string,
    status: string,
    trackingInfo?: { trackingNumber?: string; trackingUrl?: string },
  ): Promise<any> {
    const updateData: any = { id: vendorOrderId, status };

    if (status === "shipped") {
      updateData.shipped_at = new Date();
      if (trackingInfo?.trackingNumber) {
        updateData.tracking_number = trackingInfo.trackingNumber;
      }
      if (trackingInfo?.trackingUrl) {
        updateData.tracking_url = trackingInfo.trackingUrl;
      }
    }

    if (status === "delivered") {
      updateData.delivered_at = new Date();
      updateData.fulfillment_status = "fulfilled";
    }

    if (status === "completed") {
      updateData.fulfillment_status = "fulfilled";
    }

    return await this.updateVendorOrders(updateData);
  }

  /**
   * Get pending vendor orders
   */
  async getPendingVendorOrders(vendorId: string): Promise<any[]> {
    const orders = (await this.listVendorOrders({
      vendor_id: vendorId,
      status: ["pending", "acknowledged", "processing", "ready_to_ship"],
    })) as any;
    return Array.isArray(orders) ? orders : [orders].filter(Boolean);
  }

  /**
   * Get vendor orders awaiting payout
   */
  async getVendorOrdersAwaitingPayout(vendorId: string): Promise<any[]> {
    const orders = (await this.listVendorOrders({
      vendor_id: vendorId,
      status: "completed",
      payout_status: "pending",
    })) as any;
    return Array.isArray(orders) ? orders : [orders].filter(Boolean);
  }

  // ============ Analytics ============

  /**
   * Calculate vendor analytics for period
   */
  async calculateVendorAnalytics(
    vendorId: string,
    periodType: "daily" | "weekly" | "monthly",
    periodStart: Date,
    periodEnd: Date,
  ): Promise<any> {
    // Get orders in period
    const orders = (await this.listVendorOrders({
      vendor_id: vendorId,
    })) as unknown as Record<string, unknown>[];

    const orderList = (
      Array.isArray(orders) ? orders : [orders].filter(Boolean)
    ).filter((o: any) => {
      const createdAt = new Date(o.created_at);
      return createdAt >= periodStart && createdAt <= periodEnd;
    });

    const completedOrders = orderList.filter(
      (o: any) => o.status === "completed",
    );
    const cancelledOrders = orderList.filter(
      (o: any) => o.status === "cancelled",
    );
    const returnedOrders = orderList.filter(
      (o: any) => o.status === "returned",
    );

    const grossRevenue = orderList.reduce(
      (sum: number, o: any) => sum + Number(o.total || 0),
      0,
    );
    const netRevenue = orderList.reduce(
      (sum: number, o: any) => sum + Number(o.net_amount || 0),
      0,
    );
    const totalCommission = orderList.reduce(
      (sum: number, o: any) => sum + Number(o.commission_amount || 0),
      0,
    );

    const avgOrderValue =
      orderList.length > 0 ? grossRevenue / orderList.length : 0;

    // Get products
    const products = await this.getVendorProducts(vendorId);
    const activeProducts = products.filter((p: any) => p.status === "approved");

    // Create or update snapshot
    const existingSnapshots = (await this.listVendorAnalyticsSnapshots({
      vendor_id: vendorId,
      period_type: periodType,
      period_start: periodStart,
    })) as any;

    const existingList = Array.isArray(existingSnapshots)
      ? existingSnapshots
      : [existingSnapshots].filter(Boolean);

    const snapshotData = {
      vendor_id: vendorId,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      total_orders: orderList.length,
      completed_orders: completedOrders.length,
      cancelled_orders: cancelledOrders.length,
      returned_orders: returnedOrders.length,
      gross_revenue: grossRevenue,
      net_revenue: netRevenue,
      total_commission: totalCommission,
      total_products: products.length,
      active_products: activeProducts.length,
      average_order_value: avgOrderValue,
    };

    if (existingList.length > 0) {
      return await this.updateVendorAnalyticsSnapshots({
        id: existingList[0].id,
        ...snapshotData,
      } as any);
    }

    return await this.createVendorAnalyticsSnapshots(snapshotData);
  }

  /**
   * Calculate vendor performance metrics
   */
  async calculateVendorPerformanceMetrics(
    vendorId: string,
    periodDays: number = 30,
  ): Promise<any[]> {
    const metrics: any[] = [];
    const now = new Date();
    const periodStart = new Date(
      now.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );

    // Get orders in period
    const orders = (await this.listVendorOrders({
      vendor_id: vendorId,
    })) as unknown as Record<string, unknown>[];
    const orderList = (
      Array.isArray(orders) ? orders : [orders].filter(Boolean)
    ).filter((o: any) => new Date(o.created_at) >= periodStart);

    const totalOrders = orderList.length;
    if (totalOrders === 0) return metrics;

    // Cancellation Rate
    const cancelledOrders = orderList.filter(
      (o: any) => o.status === "cancelled",
    ).length;
    const cancellationRate = (cancelledOrders / totalOrders) * 100;
    metrics.push({
      vendor_id: vendorId,
      metric_type: "cancellation_rate",
      value: cancellationRate,
      threshold_warning: 5,
      threshold_critical: 10,
      status:
        cancellationRate > 10
          ? "critical"
          : cancellationRate > 5
            ? "warning"
            : "good",
      measured_at: now,
      period_days: periodDays,
      sample_count: totalOrders,
    });

    // Return Rate
    const returnedOrders = orderList.filter(
      (o: any) => o.status === "returned",
    ).length;
    const returnRate = (returnedOrders / totalOrders) * 100;
    metrics.push({
      vendor_id: vendorId,
      metric_type: "return_rate",
      value: returnRate,
      threshold_warning: 10,
      threshold_critical: 20,
      status:
        returnRate > 20 ? "critical" : returnRate > 10 ? "warning" : "good",
      measured_at: now,
      period_days: periodDays,
      sample_count: totalOrders,
    });

    // Late Shipment Rate
    const shippedOrders = orderList.filter((o: any) => o.shipped_at);
    // Simplified - would need expected ship date to calculate properly
    const lateShipments = 0; // Placeholder
    const lateShipmentRate =
      shippedOrders.length > 0
        ? (lateShipments / shippedOrders.length) * 100
        : 0;
    metrics.push({
      vendor_id: vendorId,
      metric_type: "late_shipment_rate",
      value: lateShipmentRate,
      threshold_warning: 5,
      threshold_critical: 10,
      status:
        lateShipmentRate > 10
          ? "critical"
          : lateShipmentRate > 5
            ? "warning"
            : "good",
      measured_at: now,
      period_days: periodDays,
      sample_count: shippedOrders.length,
    });

    // Save metrics
    for (const metric of metrics) {
      await this.createVendorPerformanceMetrics(metric);
    }

    return metrics;
  }

  /**
   * Get vendor dashboard data
   */
  async getVendorDashboard(vendorId: string): Promise<any> {
    const vendor = (await this.retrieveVendor(vendorId)) as any;

    // Get recent orders
    const recentOrders = (await this.listVendorOrders({
      vendor_id: vendorId,
    })) as any;
    const orderList = (
      Array.isArray(recentOrders)
        ? recentOrders
        : [recentOrders].filter(Boolean)
    ).slice(0, 10);

    // Get pending orders
    const pendingOrders = await this.getPendingVendorOrders(vendorId);

    // Get products
    const products = await this.getVendorProducts(vendorId);

    // Get latest analytics
    const analytics = (await this.listVendorAnalyticsSnapshots({
      vendor_id: vendorId,
      period_type: "monthly",
    })) as any;
    const latestAnalytics = Array.isArray(analytics) ? analytics[0] : analytics;

    // Get performance metrics
    const metrics = (await this.listVendorPerformanceMetrics({
      vendor_id: vendorId,
    })) as any;
    const metricsList = Array.isArray(metrics)
      ? metrics
      : [metrics].filter(Boolean);

    return {
      vendor,
      summary: {
        totalOrders: vendor.total_orders || 0,
        totalSales: vendor.total_sales || 0,
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === "approved")
          .length,
        pendingOrders: pendingOrders.length,
      },
      recentOrders: orderList,
      analytics: latestAnalytics,
      performanceMetrics: metricsList,
    };
  }
}

export default VendorModuleService;
