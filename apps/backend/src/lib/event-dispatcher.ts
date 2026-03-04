/**
 * Event Dispatcher — UCE Canonical Workflow Bridge
 *
 * Maps Medusa business events to UCE canonical workflow function names.
 * All task queues are the 4 isolated UCE queues defined in canonical-workflows.ts.
 *
 * When an event fires, temporal-event-bridge.ts calls dispatchEventToTemporal()
 * which calls startCanonicalWorkflow(workflowFn, params, idempotencyKey).
 *
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │ TASK QUEUES                                                                │
 * │  uce-commerce-financial  — money, ledger, refunds, payouts               │
 * │  uce-commerce-dispatch   — fulfillment, logistics                         │
 * │  uce-commerce-recurring  — subscriptions, metering                        │
 * │  uce-commerce-fulfilment — bookings, KYC, onboarding                     │
 * └────────────────────────────────────────────────────────────────────────────┘
 */
import { startCanonicalWorkflow } from "./temporal-client";
import { createLogger } from "../lib/logger";

const logger = createLogger("lib:event-dispatcher");

/**
 * Canonical workflow mapping.
 * workflowFn must exactly match an exported function name in canonical-workflows.ts.
 * taskQueue must be one of the 4 UCE isolated queues.
 */
const EVENT_WORKFLOW_MAP: Record<
  string,
  { workflowFn: string; taskQueue: string; idempotencyKey: (d: any) => string }
> = {
  // ── Financial workflows ──────────────────────────────────────────────────
  "order.placed": {
    workflowFn: "one_time_goods",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.id || d.order_id,
  },
  "order.cancelled": {
    workflowFn: "order_cancellation",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.id || d.order_id,
  },
  "payment.initiated": {
    workflowFn: "one_time_goods",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.order_id || d.id,
  },
  "payment.completed": {
    workflowFn: "one_time_goods",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.order_id || d.id,
  },
  "refund.requested": {
    workflowFn: "refund_compensation",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.order_id || d.id,
  },
  "return.initiated": {
    workflowFn: "refund_compensation",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.order_id || d.id,
  },
  "invoice.created": {
    workflowFn: "refund_compensation",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.invoice_id || d.id,
  },
  "invoice.overdue": {
    workflowFn: "refund_compensation",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `overdue:${d.invoice_id || d.id}`,
  },
  "payout.initiated": {
    workflowFn: "payout_processing",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) =>
      `payout:${d.vendor_id}:${d.period_end || Date.now()}`,
  },
  "payout.failed": {
    workflowFn: "payout_processing",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `payout-retry:${d.vendor_id}:${Date.now()}`,
  },
  "dispute.opened": {
    workflowFn: "milestone_escrow",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `dispute:${d.order_id || d.contract_id || d.id}`,
  },
  "auction.started": {
    workflowFn: "auction_settlement",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => d.auction_id || d.id,
  },
  "inventory.updated": {
    workflowFn: "one_time_goods",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `inv:${d.variant_id || d.product_id || d.id}`,
  },

  // ── Dispatch workflows ───────────────────────────────────────────────────
  "fulfillment.created": {
    workflowFn: "on_demand_dispatch",
    taskQueue: "uce-commerce-dispatch",
    idempotencyKey: (d) => d.fulfillment_id || d.id,
  },
  "fulfillment.shipped": {
    workflowFn: "fulfillment_tracking",
    taskQueue: "uce-commerce-dispatch",
    idempotencyKey: (d) => `track:${d.fulfillment_id || d.id}`,
  },
  "fulfillment.delivered": {
    workflowFn: "fulfillment_tracking",
    taskQueue: "uce-commerce-dispatch",
    idempotencyKey: (d) => `track:${d.fulfillment_id || d.id}`,
  },
  "vendor_order.shipped": {
    workflowFn: "fulfillment_tracking",
    taskQueue: "uce-commerce-dispatch",
    idempotencyKey: (d) => `vtrack:${d.order_id || d.id}`,
  },
  "restaurant-order.placed": {
    workflowFn: "on_demand_dispatch",
    taskQueue: "uce-commerce-dispatch",
    idempotencyKey: (d) => d.id || d.order_id,
  },

  // ── Recurring workflows ──────────────────────────────────────────────────
  "subscription.created": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => d.subscription_id || d.id,
  },
  "subscription.cancelled": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `cancel:${d.subscription_id || d.id}`,
  },
  "subscription.payment_failed": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `retry:${d.subscription_id || d.id}:${Date.now()}`,
  },
  "subscription.renewal_upcoming": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `renewal:${d.subscription_id || d.id}`,
  },
  "subscription.trial_ending": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `trial-end:${d.subscription_id || d.id}`,
  },
  "subscription.trial_converted": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `trial-conv:${d.subscription_id || d.id}`,
  },
  "subscription.trial_expired": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `trial-exp:${d.subscription_id || d.id}`,
  },
  "subscription.plan_changed": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `plan-change:${d.subscription_id || d.id}`,
  },
  "subscription.paused": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `pause:${d.subscription_id || d.id}`,
  },
  "subscription.resumed": {
    workflowFn: "subscription_billing",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `resume:${d.subscription_id || d.id}`,
  },

  // ── Fulfilment / Onboarding workflows ────────────────────────────────────
  "booking.created": {
    workflowFn: "booking_service",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => d.booking_id || d.id,
  },
  "booking.confirmed": {
    workflowFn: "booking_service",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `confirm:${d.booking_id || d.id}`,
  },
  "booking.no_show": {
    workflowFn: "booking_service",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `noshow:${d.booking_id || d.id}`,
  },
  "kyc.requested": {
    workflowFn: "kyc_verification",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `kyc:${d.customer_id || d.id}`,
  },
  "kyc.completed": {
    workflowFn: "kyc_verification",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `kyc-vc:${d.customer_id || d.id}`,
  },
  "membership.created": {
    workflowFn: "kyc_verification",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `membership:${d.customer_id || d.id}`,
  },
  "vendor.registered": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `vendor:${d.vendor_id || d.id}`,
  },
  "vendor.created": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `vendor:${d.vendor_id || d.id}`,
  },
  "vendor.application_submitted": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `vendor-app:${d.vendor_id || d.id}`,
  },
  "vendor.suspended": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `suspend:${d.vendor_id || d.id}`,
  },
  "vendor.deactivated": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `deactivate:${d.vendor_id || d.id}`,
  },
  "vendor.stripe_connected": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `stripe:${d.vendor_id || d.id}`,
  },
  "customer.created": {
    workflowFn: "customer_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => d.customer_id || d.id,
  },
  "customer.updated": {
    workflowFn: "customer_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `update:${d.customer_id || d.id}`,
  },
  "trade_in.submitted": {
    workflowFn: "trade_in_valuation",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => d.trade_in_id || d.id,
  },

  // ── Sync / maintenance (use recurring queue) ─────────────────────────────
  "product.created": {
    workflowFn: "usage_metering", // proxy: lightweight sync via metering queue
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `prod-sync:${d.id}`,
  },
  "product.updated": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `prod-sync:${d.id}`,
  },
  "product.deleted": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `prod-del:${d.id}`,
  },
  "vendor_product.created": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `vprod-sync:${d.id}`,
  },
  "vendor_product.updated": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `vprod-update:${d.id}`,
  },
  "vendor_product.deactivated": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `vprod-deact:${d.id}`,
  },
  "governance.policy.changed": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `gov:${d.policy_id || d.id || Date.now()}`,
  },
  "store.created": {
    workflowFn: "customer_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `store:${d.id}`,
  },
  "store.updated": {
    workflowFn: "customer_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `store-update:${d.id}`,
  },
  "tenant.provisioned": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `tenant:${d.tenant_id || d.id}`,
  },
  "tenant.updated": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `tenant-upd:${d.tenant_id || d.id}`,
  },
  "node.created": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `node:${d.node_id || d.id}`,
  },
  "node.updated": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `node-upd:${d.node_id || d.id}`,
  },
  "node.deleted": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `node-del:${d.node_id || d.id}`,
  },
  "vendor.inactivity_warning": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `inactive:${d.vendor_id || d.id}`,
  },
  "workflow.dynamic.start": {
    workflowFn: "one_time_goods", // Dynamic workflows funnel to financial queue
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `dyn:${d.workflow_id || d.id || Date.now()}`,
  },
  "sync.products.scheduled": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `sched-sync:${Date.now()}`,
  },
  "sync.retry.scheduled": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `sched-retry:${Date.now()}`,
  },
  "sync.hierarchy.scheduled": {
    workflowFn: "usage_metering",
    taskQueue: "uce-commerce-recurring",
    idempotencyKey: (d) => `sched-hier:${Date.now()}`,
  },
  "payout.completed": {
    workflowFn: "payout_processing",
    taskQueue: "uce-commerce-financial",
    idempotencyKey: (d) => `payout-done:${d.vendor_id}:${Date.now()}`,
  },
  "vendor.approved": {
    workflowFn: "vendor_onboarding",
    taskQueue: "uce-commerce-fulfilment",
    idempotencyKey: (d) => `approved:${d.vendor_id || d.id}`,
  },
};

export function getWorkflowForEvent(
  eventType: string,
): {
  workflowFn: string;
  taskQueue: string;
  idempotencyKey: (d: any) => string;
} | null {
  return EVENT_WORKFLOW_MAP[eventType] || null;
}

export function getAllMappedEvents(): string[] {
  return Object.keys(EVENT_WORKFLOW_MAP);
}

export async function dispatchEventToTemporal(
  eventType: string,
  payload: any,
  nodeContext?: any,
): Promise<{ dispatched: boolean; runId?: string; error?: string }> {
  const mapping = getWorkflowForEvent(eventType);
  if (!mapping) {
    return {
      dispatched: false,
      error: `No workflow mapped for event: ${eventType}`,
    };
  }

  const idempotencyKey = mapping.idempotencyKey(payload);

  try {
    const result = await startCanonicalWorkflow(
      mapping.workflowFn,
      { ...payload, _eventType: eventType, _nodeContext: nodeContext },
      idempotencyKey,
      mapping.taskQueue,
    );
    return { dispatched: true, runId: result.workflowId };
  } catch (err: any) {
    logger.warn(
      `[EventDispatcher] Failed to dispatch ${eventType} → ${mapping.workflowFn}: ${err.message}`,
    );
    return { dispatched: false, error: err.message };
  }
}

export async function processOutboxEvents(container: any): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  try {
    const eventOutboxService = container.resolve("eventOutbox") as any;
    const pendingEvents = await eventOutboxService.listPendingEvents(
      undefined,
      50,
    );
    for (const event of pendingEvents) {
      const mapping = getWorkflowForEvent(event.event_type);
      if (!mapping) continue;
      try {
        const envelope = eventOutboxService.buildEnvelope(event);
        await startCanonicalWorkflow(
          mapping.workflowFn,
          { ...envelope.payload, _eventType: event.event_type },
          mapping.idempotencyKey(envelope.payload),
          mapping.taskQueue,
        );
        await eventOutboxService.markPublished(event.id);
        processed++;
      } catch (err: any) {
        await eventOutboxService.markFailed(event.id, err.message);
        failed++;
        errors.push(`Event ${event.id} (${event.event_type}): ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`Outbox processing error: ${err.message}`);
  }
  return { processed, failed, errors };
}

export async function dispatchCrossSystemEvent(
  eventType: string,
  payload: any,
  container: any,
  nodeContext?: any,
): Promise<{ temporal: boolean; integrations: string[] }> {
  const temporalResult = await dispatchEventToTemporal(
    eventType,
    payload,
    nodeContext,
  );
  if (!temporalResult.dispatched) {
    logger.info(
      `[EventDispatcher] No Temporal workflow for ${eventType}, attempting outbox fallback`,
    );
    try {
      const eventOutboxService = container.resolve("eventOutbox") as any;
      await eventOutboxService.createEvent({
        event_type: eventType,
        payload,
        tenant_id: nodeContext?.tenantId,
        node_id: nodeContext?.nodeId,
        correlation_id: nodeContext?.correlationId || crypto.randomUUID(),
        channel: nodeContext?.channel,
        status: "pending",
      });
      return { temporal: false, integrations: ["outbox"] };
    } catch (err: any) {
      logger.warn(
        `[EventDispatcher] Outbox fallback failed for ${eventType}: ${err.message}`,
      );
      return { temporal: false, integrations: [] };
    }
  }
  logger.info(
    `[EventDispatcher] Dispatched ${eventType} → ${getWorkflowForEvent(eventType)?.workflowFn}: runId=${temporalResult.runId}`,
  );
  return { temporal: true, integrations: ["temporal"] };
}
