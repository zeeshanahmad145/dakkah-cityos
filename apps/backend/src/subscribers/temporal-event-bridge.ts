import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  dispatchEventToTemporal,
  getWorkflowForEvent,
} from "../lib/event-dispatcher";
import { createLogger } from "../lib/logger";
import { appConfig } from "../lib/config";
const logger = createLogger("subscribers:temporal-event-bridge");

export default async function temporalEventBridge({
  event,
  container,
}: SubscriberArgs<any>) {
  const eventName = event.name;

  if (!appConfig.temporal.isConfigured) {
    return;
  }

  if (!getWorkflowForEvent(eventName)?.workflowFn) {
    return;
  }

  const nodeContext = {
    tenantId: event.data?.tenant_id,
    nodeId: event.data?.node_id,
    source: "medusa-subscriber",
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await dispatchEventToTemporal(
      eventName,
      event.data,
      nodeContext,
    );

    if (result.dispatched) {
      logger.info(
        `[TemporalBridge] Dispatched ${eventName} → runId: ${result.runId}`,
      );
    }
  } catch (err: any) {
    logger.warn(
      `[TemporalBridge] Failed to dispatch ${eventName}:`,
      err.message,
    );
  }
}

// Medusa business events that trigger Temporal workflows.
// Scheduled sync events (sync.products.scheduled, sync.retry.scheduled,
// sync.hierarchy.scheduled) are triggered by cron jobs in
// integration-sync-scheduler.ts, not by Medusa events.
export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.cancelled",
    "payment.initiated",
    "refund.requested",
    "vendor.registered",
    "vendor.created",
    "dispute.opened",
    "return.initiated",
    "kyc.requested",
    "subscription.created",
    "booking.created",
    "auction.started",
    "restaurant-order.placed",
    "product.updated",
    "product.created",
    "product.deleted",
    "workflow.dynamic.start",
    "governance.policy.changed",
    "node.created",
    "node.updated",
    "node.deleted",
    "tenant.provisioned",
    "tenant.updated",
    "store.created",
    "store.updated",
    "customer.created",
    "customer.updated",
    "vendor.approved",
    "vendor.suspended",
    "inventory.updated",
    "fulfillment.created",
    "fulfillment.shipped",
    "fulfillment.delivered",
    "invoice.created",
    "payment.completed",
    "kyc.completed",
    "membership.created",
    "payout.initiated",
    "payout.completed",
    "payout.failed",
    "booking.no_show",
    "subscription.cancelled",
    "subscription.payment_failed",
    "vendor.deactivated",
    "vendor.inactivity_warning",
    "invoice.overdue",
    "subscription.renewal_upcoming",
    "subscription.trial_ending",
    "subscription.trial_converted",
    "subscription.trial_expired",
    "booking.confirmed",
    "subscription.plan_changed",
    "subscription.paused",
    "subscription.resumed",
    "vendor.application_submitted",
    "vendor_order.shipped",
    "vendor_product.created",
    "vendor_product.deactivated",
    "vendor_product.updated",
    "vendor.stripe_connected",
  ],
};
