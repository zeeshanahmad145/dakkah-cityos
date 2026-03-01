import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Loyalty Points Subscriber
 * Awards points when an order is completed.
 * Uses the customer's existing loyalty account or creates one automatically.
 */
export default async function loyaltyOrderCompletedSubscriber({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;

  try {
    const query = container.resolve("query") as unknown as any;
    const loyaltyService = container.resolve("loyalty") as unknown as any;

    // Fetch order details
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "tenant_id", "customer_id", "total"],
      filters: { id: orderId },
    });

    if (!order?.customer_id || !order?.tenant_id) {
      console.warn(
        `[Loyalty] Order ${orderId} missing customer_id or tenant_id`,
      );
      return;
    }

    const total = Number(order.total || 0);
    if (total <= 0) return;

    // Find the active loyalty program for this tenant
    const programs = await loyaltyService.listLoyaltyPrograms({
      tenant_id: order.tenant_id,
      status: "active",
    });
    const programList = Array.isArray(programs)
      ? programs
      : [programs].filter(Boolean);

    if (programList.length === 0) {
      console.info(`[Loyalty] No active program for tenant ${order.tenant_id}`);
      return;
    }

    const program = programList[0];

    // Get or create loyalty account
    const account = await loyaltyService.getOrCreateAccount(
      program.id,
      order.customer_id,
      order.tenant_id,
    );

    // Calculate points to award
    const pointsToAward = await loyaltyService.calculatePoints(
      program.id,
      total / 100,
    ); // Convert cents to dollars

    if (pointsToAward <= 0) return;

    // Award points
    await loyaltyService.earnPoints({
      accountId: account.id,
      points: pointsToAward,
      referenceType: "order",
      referenceId: orderId,
      description: `Order ${orderId} completed`,
    });

    console.info(
      `[Loyalty] Awarded ${pointsToAward} pts to customer ${order.customer_id} for order ${orderId}`,
    );
  } catch (err: any) {
    console.error(
      `[Loyalty] Failed to award points for order ${orderId}:`,
      err.message,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.completed",
};
