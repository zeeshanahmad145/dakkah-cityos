import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createLogger } from "../lib/logger";
import { appConfig } from "../lib/config";

const logger = createLogger("subscribers:vendor-order-split");

export default async function vendorOrderSplitHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const vendorModuleService = container.resolve("vendorModuleService") as unknown as any;
  const query = container.resolve("query") as unknown as any;

  let commissionModuleService: any = null;
  try {
    commissionModuleService = container.resolve("commissionModuleService") as unknown as any;
  } catch {
    // Commission module may not be available in all environments
  }

  try {
    // Query order with all line items
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "currency_code",
        "tenant_id",
        "items.id",
        "items.product_id",
        "items.variant_id",
        "items.title",
        "items.sku",
        "items.thumbnail",
        "items.quantity",
        "items.unit_price",
        "shipping_address.*",
      ],
      filters: { id: data.id },
    });

    const order = orders[0];
    if (!order || !order.items || order.items.length === 0) {
      logger.warn("Order not found or has no items", { orderId: data.id });
      return;
    }

    // Group items by vendor
    const vendorGroups: Record<string, typeof order.items> = {};
    const platformItems: typeof order.items = [];

    for (const item of order.items) {
      if (!item.product_id) {
        // Skip items without product_id
        platformItems.push(item);
        continue;
      }

      try {
        // Get vendor for this product
        const vendor = await vendorModuleService.getVendorForProduct(
          item.product_id,
        );

        if (!vendor) {
          // No vendor assigned - platform-fulfilled
          platformItems.push(item);
          continue;
        }

        const vendorId = vendor.id;
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = [];
        }
        vendorGroups[vendorId].push(item);
      } catch (error) {
        logger.warn("Failed to get vendor for product", {
          orderId: data.id,
          productId: item.product_id,
          error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
        });
        // Treat as platform-fulfilled on error
        platformItems.push(item);
      }
    }

    // Log platform items if any
    if (platformItems.length > 0) {
      logger.info("Platform-fulfilled items (no vendor assigned)", {
        orderId: data.id,
        itemCount: platformItems.length,
      });
    }

    // Create vendor orders for each vendor group
    const createdVendorOrders: any[] = [];
    const failedVendors: Array<{ vendorId: string; error: string }> = [];

    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      try {
        // Determine commission rate
        let commissionRate = 15; // Default

        try {
          if (commissionModuleService && order.tenant_id) {
            const commissionCalc =
              await commissionModuleService.calculateCommission({
                vendorId,
                orderId: order.id,
                lineItemId: items[0]?.id || "",
                orderSubtotal: items.reduce(
                  (sum, item) => sum + item.unit_price * item.quantity,
                  0,
                ),
                orderTotal: items.reduce(
                  (sum, item) => sum + item.unit_price * item.quantity,
                  0,
                ),
                tenantId: order.tenant_id,
              });
            commissionRate = commissionCalc.commissionRate;
          }
        } catch (error) {
          logger.warn("Failed to calculate commission, using default", {
            orderId: data.id,
            vendorId,
            error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
          });
          // Continue with default rate
        }

        // Prepare vendor order items
        const vendorOrderItems = items.map((item) => ({
          lineItemId: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          title: item.title,
          sku: item.sku,
          thumbnail: item.thumbnail,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        }));

        // Create vendor order
        const vendorOrder =
          await vendorModuleService.createVendorOrderFromOrder(
            vendorId,
            order.id,
            vendorOrderItems,
            order.shipping_address,
            commissionRate,
          );

        createdVendorOrders.push({
          vendorId,
          vendorOrderId: vendorOrder.id,
          itemCount: items.length,
          commissionRate,
        });

        logger.info("Vendor order created successfully", {
          orderId: order.id,
          vendorId,
          vendorOrderId: vendorOrder.id,
          itemCount: items.length,
          commissionRate,
        });
      } catch (error) {
        logger.error(
          "Failed to create vendor order",
          error instanceof Error ? error : new Error(String(error)),
          {
            orderId: data.id,
            vendorId,
            itemCount: items.length,
          },
        );
        failedVendors.push({
          vendorId,
          error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
        });
        // Continue with next vendor - don't block the order
      }
    }

    // Summary log
    logger.info("Order split completed", {
      orderId: order.id,
      displayId: order.display_id,
      totalVendors: Object.keys(vendorGroups).length,
      successfulVendors: createdVendorOrders.length,
      failedVendors: failedVendors.length,
      platformItems: platformItems.length,
      vendorOrders: createdVendorOrders,
      failures: failedVendors.length > 0 ? failedVendors : undefined,
    });
  } catch (error) {
    logger.error(
      "Vendor order split handler error",
      error instanceof Error ? error : new Error(String(error)),
      { orderId: data.id },
    );
    // Don't throw - this is a non-critical subscriber
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
