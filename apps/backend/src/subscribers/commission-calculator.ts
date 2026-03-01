import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Commission Calculator
 * Listens to `order.placed` events and calculates commission for each vendor.
 */
export default async function commissionCalculatorSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;

  try {
    const query = container.resolve("query") as unknown as any;
    const commissionService = container.resolve("commission") as unknown as any;

    // Fetch the order with items
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "tenant_id", "store_id", "total", "subtotal", "items.*"],
      filters: { id: orderId },
    });

    if (!order) {
      console.warn(`[Commission] Order ${orderId} not found`);
      return;
    }

    // Group items by vendor (seller_id field on item metadata)
    const vendorMap = new Map<
      string,
      { items: any[]; total: number; subtotal: number }
    >();

    for (const item of order.items || []) {
      const vendorId: string =
        item.metadata?.vendor_id || item.variant?.metadata?.vendor_id;
      if (!vendorId) continue;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { items: [], total: 0, subtotal: 0 });
      }

      const entry = vendorMap.get(vendorId)!;
      entry.items.push(item);
      entry.total += Number(item.total || 0);
      entry.subtotal += Number(item.subtotal || 0);
    }

    // Create commission transaction per vendor
    for (const [vendorId, { items, total, subtotal }] of vendorMap.entries()) {
      for (const item of items) {
        await commissionService.createCommissionTransaction({
          vendorId,
          orderId,
          lineItemId: item.id,
          orderSubtotal: subtotal,
          orderTotal: total,
          tenantId: order.tenant_id,
          storeId: order.store_id || null,
        });
      }
    }

    console.info(
      `[Commission] Calculated commissions for order ${orderId} across ${vendorMap.size} vendors`,
    );
  } catch (err: any) {
    console.error(
      `[Commission] Failed to calculate commission for order ${orderId}:`,
      err.message,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
