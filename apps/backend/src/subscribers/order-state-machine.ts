import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ORDER_ORCHESTRATION_MODULE } from "../modules/order-orchestration";
import type OrderOrchestrationModuleService from "../modules/order-orchestration/service";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscriber:order-state-machine");

// Maps Medusa native events → order state transitions
const EVENT_TO_TRANSITION: Record<
  string,
  { toState: string; orderType?: string }
> = {
  "order.placed": { toState: "pending" },
  "order.payment_captured": { toState: "payment_captured" },
  "order.fulfillment_created": { toState: "processing" },
  "order.shipment_created": { toState: "shipped" },
  "order.fulfilled": { toState: "completed" },
  "order.cancelled": { toState: "cancelled" },
  "order.refunded": { toState: "refunded" },
};

export default async function orderStateMachineSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string; order_type?: string }>) {
  const transition = EVENT_TO_TRANSITION[event.name];
  if (!transition) return;

  const orchestrationService: OrderOrchestrationModuleService =
    container.resolve(ORDER_ORCHESTRATION_MODULE);

  const orderId = event.data.id;
  const orderType = event.data.order_type ?? "physical";

  try {
    // Get previous log to determine fromState
    const prevLogs = (await orchestrationService.listOrderTransitionLogs?.({
      order_id: orderId,
    } as any)) as any[];
    const fromState =
      prevLogs.length > 0
        ? prevLogs.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0].to_state
        : null;

    // Validate transition
    const { valid, reason } = await orchestrationService.validateTransition(
      orderId,
      orderType,
      fromState,
      transition.toState,
    );
    if (!valid) {
      logger.warn(`Invalid transition for order ${orderId}: ${reason}`);
      return;
    }

    // Record transition with idempotency
    const idempotencyKey = `${orderId}:${event.name}:${transition.toState}`;
    await orchestrationService.recordTransition(
      orderId,
      orderType,
      fromState,
      transition.toState,
      `event:${event.name}`,
      idempotencyKey,
    );

    logger.info(
      `Order ${orderId} transitioned ${fromState ?? "init"} → ${transition.toState}`,
    );
  } catch (err) {
    logger.error(`Order state machine error for ${orderId}: ${String(err)}`);
  }
}

export const config: SubscriberConfig = {
  event: Object.keys(EVENT_TO_TRANSITION),
};
