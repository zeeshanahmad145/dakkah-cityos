import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscribers:credit-limit-guard");

/**
 * Credit Limit Guard — Order Placement Pre-Validation
 *
 * Fires on `order.placed` and checks whether the ordering company
 * (B2B context) has available credit to cover this order.
 *
 * If credit is exhausted:
 *  → Cancels the order
 *  → Creates a notification to the company admin
 *  → Emits `company.credit.exceeded` event
 *
 * If credit is available:
 *  → Calls company.reserveCredit() to deduct from available credit
 *  → On order.cancelled / order.returned, company.releaseCredit() is called
 *    by the existing order-cancelled subscriber (extend separately)
 *
 * Note: Guest and non-B2B orders (no company_id) pass through immediately.
 */
export default async function creditLimitGuard({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query") as any;
  const eventBus = container.resolve("event_bus") as any;

  try {
    // Fetch order with metadata
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "total", "currency_code", "metadata"],
      filters: { id: data.id },
    });

    const order = orders?.[0];
    if (!order) return;

    const companyId = order.metadata?.company_id as string | undefined;
    if (!companyId) return; // Not a B2B order — skip

    const companyService = container.resolve("company") as any;
    const orderTotal = BigInt(Math.round(Number(order.total) * 100)); // to integer cents

    const hasCredit = await companyService.hasAvailableCredit(
      companyId,
      orderTotal,
    );

    if (!hasCredit) {
      logger.warn(
        `Company ${companyId} credit exhausted for order ${order.id}`,
      );

      // Cancel the order
      try {
        const orderModule = container.resolve("order") as any;
        await orderModule.cancelOrder({ id: order.id });
      } catch (cancelErr: any) {
        logger.error(`Failed to cancel order ${order.id}:`, cancelErr.message);
      }

      // Notify
      await eventBus.emit("company.credit.exceeded", {
        company_id: companyId,
        order_id: order.id,
        required_amount: Number(orderTotal),
        currency_code: order.currency_code,
      });
      return;
    }

    // Reserve the credit
    await companyService.reserveCredit(companyId, orderTotal);
    logger.info(`Credit reserved for company ${companyId}, order ${order.id}`);
  } catch (err: any) {
    logger.error("Credit limit guard error:", err.message);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
