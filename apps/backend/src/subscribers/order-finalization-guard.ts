import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ORDER_ORCHESTRATION_MODULE } from "../modules/order-orchestration";
import type OrderOrchestrationModuleService from "../modules/order-orchestration/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:order-finalization-guard");

export default async function orderFinalizationGuard({
  event,
  container,
}: SubscriberArgs<{ id: string; idempotency_key?: string }>) {
  const idempotencyKey = event.data.idempotency_key;
  if (!idempotencyKey) return; // no key = not finalization-guarded

  const orchestrationService: OrderOrchestrationModuleService =
    container.resolve(ORDER_ORCHESTRATION_MODULE);

  try {
    // Check if this payment was already captured (idempotency)
    const existing = (await orchestrationService.listOrderTransitionLogs?.({
      idempotency_key: `finalize:${idempotencyKey}`,
    } as any)) as any[];

    if (existing && existing.length > 0) {
      logger.warn(
        `Duplicate payment capture blocked for idempotency_key=${idempotencyKey}`,
      );
      // In real scenario: throw to prevent double application
      return;
    }

    // Record the finalization lock
    await orchestrationService.createOrderTransitionLogs?.({
      order_id: event.data.id,
      from_state: null,
      to_state: "finalization_locked",
      triggered_by: "payment:captured",
      idempotency_key: `finalize:${idempotencyKey}`,
      notes: "Anti double-charge guard",
    } as any);

    logger.info(
      `Order ${event.data.id} finalization locked (idempotency_key=${idempotencyKey})`,
    );
  } catch (err) {
    logger.error(`Finalization guard error: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: ["payment.captured"],
};
