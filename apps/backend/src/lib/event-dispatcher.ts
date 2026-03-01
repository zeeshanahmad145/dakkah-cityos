import { startWorkflow } from "./temporal-client";
import { createLogger } from "../lib/logger";
const logger = createLogger("lib:event-dispatcher");

const EVENT_WORKFLOW_MAP: Record<
  string,
  { workflowId: string; taskQueue: string }
> = {
  "order.placed": {
    workflowId: "xsystem.unified-order-orchestrator",
    taskQueue: "commerce-queue",
  },
  "order.cancelled": {
    workflowId: "xsystem.order-cancellation-saga",
    taskQueue: "commerce-queue",
  },
  "payment.initiated": {
    workflowId: "xsystem.multi-gateway-payment",
    taskQueue: "commerce-queue",
  },
  "refund.requested": {
    workflowId: "xsystem.refund-compensation-saga",
    taskQueue: "commerce-queue",
  },
  "return.initiated": {
    workflowId: "xsystem.returns-processing",
    taskQueue: "commerce-queue",
  },
  "store.created": {
    workflowId: "commerce.store-setup",
    taskQueue: "commerce-queue",
  },
  "store.updated": {
    workflowId: "commerce.store-config-sync",
    taskQueue: "commerce-queue",
  },
  "product.created": {
    workflowId: "commerce.product-catalog-sync",
    taskQueue: "commerce-queue",
  },
  "product.updated": {
    workflowId: "commerce.sync-product-to-cms",
    taskQueue: "commerce-queue",
  },
  "product.deleted": {
    workflowId: "commerce.product-catalog-remove",
    taskQueue: "commerce-queue",
  },
  "vendor_product.created": {
    workflowId: "commerce.vendor-product-catalog-sync",
    taskQueue: "commerce-queue",
  },
  "vendor_product.updated": {
    workflowId: "commerce.vendor-product-update-sync",
    taskQueue: "commerce-queue",
  },
  "vendor_product.deactivated": {
    workflowId: "commerce.vendor-product-deactivation",
    taskQueue: "commerce-queue",
  },
  "auction.started": {
    workflowId: "xsystem.auction-lifecycle",
    taskQueue: "commerce-queue",
  },
  "restaurant-order.placed": {
    workflowId: "xsystem.restaurant-order-orchestrator",
    taskQueue: "commerce-queue",
  },

  "booking.created": {
    workflowId: "xsystem.service-booking-orchestrator",
    taskQueue: "commerce-booking-queue",
  },
  "booking.confirmed": {
    workflowId: "xsystem.booking-confirmation-sync",
    taskQueue: "commerce-booking-queue",
  },
  "booking.no_show": {
    workflowId: "xsystem.booking-no-show-processing",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.created": {
    workflowId: "xsystem.subscription-lifecycle",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.cancelled": {
    workflowId: "xsystem.subscription-cancellation-sync",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.payment_failed": {
    workflowId: "xsystem.subscription-payment-failure",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.renewal_upcoming": {
    workflowId: "xsystem.subscription-renewal-notification",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.trial_ending": {
    workflowId: "xsystem.trial-ending-notification",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.trial_converted": {
    workflowId: "xsystem.trial-conversion-sync",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.trial_expired": {
    workflowId: "xsystem.trial-expiration-sync",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.plan_changed": {
    workflowId: "xsystem.subscription-plan-change-sync",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.paused": {
    workflowId: "xsystem.subscription-pause-sync",
    taskQueue: "commerce-booking-queue",
  },
  "subscription.resumed": {
    workflowId: "xsystem.subscription-resume-sync",
    taskQueue: "commerce-booking-queue",
  },

  "tenant.provisioned": {
    workflowId: "xsystem.tenant-setup-saga",
    taskQueue: "xsystem-platform-queue",
  },
  "tenant.updated": {
    workflowId: "xsystem.tenant-config-sync",
    taskQueue: "xsystem-platform-queue",
  },
  "node.created": {
    workflowId: "xsystem.node-provisioning",
    taskQueue: "xsystem-platform-queue",
  },
  "node.updated": {
    workflowId: "xsystem.node-update-propagation",
    taskQueue: "xsystem-platform-queue",
  },
  "node.deleted": {
    workflowId: "xsystem.node-decommission",
    taskQueue: "xsystem-platform-queue",
  },
  "customer.created": {
    workflowId: "xsystem.customer-onboarding",
    taskQueue: "xsystem-platform-queue",
  },
  "customer.updated": {
    workflowId: "xsystem.customer-profile-sync",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.registered": {
    workflowId: "xsystem.vendor-onboarding-verification",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.created": {
    workflowId: "commerce.vendor-onboarding",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.approved": {
    workflowId: "xsystem.vendor-ecosystem-setup",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.suspended": {
    workflowId: "xsystem.vendor-suspension-cascade",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.deactivated": {
    workflowId: "xsystem.vendor-deactivation-cascade",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.inactivity_warning": {
    workflowId: "xsystem.vendor-inactivity-notification",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.application_submitted": {
    workflowId: "xsystem.vendor-application-processing",
    taskQueue: "xsystem-platform-queue",
  },
  "vendor.stripe_connected": {
    workflowId: "xsystem.vendor-stripe-setup-sync",
    taskQueue: "xsystem-platform-queue",
  },
  "dispute.opened": {
    workflowId: "xsystem.vendor-dispute-resolution",
    taskQueue: "xsystem-platform-queue",
  },
  "kyc.requested": {
    workflowId: "xsystem.kyc-verification",
    taskQueue: "xsystem-platform-queue",
  },
  "kyc.completed": {
    workflowId: "xsystem.kyc-credential-issuance",
    taskQueue: "xsystem-platform-queue",
  },
  "membership.created": {
    workflowId: "xsystem.membership-credential-issuance",
    taskQueue: "xsystem-platform-queue",
  },
  "governance.policy.changed": {
    workflowId: "xsystem.governance-policy-propagation",
    taskQueue: "xsystem-platform-queue",
  },
  "payout.initiated": {
    workflowId: "xsystem.payout-processing",
    taskQueue: "xsystem-platform-queue",
  },
  "payout.completed": {
    workflowId: "xsystem.payout-reconciliation",
    taskQueue: "xsystem-platform-queue",
  },
  "payout.failed": {
    workflowId: "xsystem.payout-failure-handling",
    taskQueue: "xsystem-platform-queue",
  },
  "invoice.created": {
    workflowId: "xsystem.invoice-processing",
    taskQueue: "xsystem-platform-queue",
  },
  "invoice.overdue": {
    workflowId: "xsystem.invoice-overdue-processing",
    taskQueue: "xsystem-platform-queue",
  },
  "payment.completed": {
    workflowId: "xsystem.payment-reconciliation",
    taskQueue: "xsystem-platform-queue",
  },
  "inventory.updated": {
    workflowId: "xsystem.inventory-reconciliation",
    taskQueue: "xsystem-platform-queue",
  },

  "fulfillment.created": {
    workflowId: "xsystem.fulfillment-dispatch",
    taskQueue: "xsystem-logistics-queue",
  },
  "fulfillment.shipped": {
    workflowId: "xsystem.shipment-tracking-start",
    taskQueue: "xsystem-logistics-queue",
  },
  "fulfillment.delivered": {
    workflowId: "xsystem.delivery-confirmation",
    taskQueue: "xsystem-logistics-queue",
  },
  "vendor_order.shipped": {
    workflowId: "xsystem.vendor-order-shipment-tracking",
    taskQueue: "xsystem-logistics-queue",
  },

  "sync.products.scheduled": {
    workflowId: "xsystem.scheduled-product-sync",
    taskQueue: "core-maintenance-queue",
  },
  "sync.retry.scheduled": {
    workflowId: "xsystem.retry-failed-syncs",
    taskQueue: "core-maintenance-queue",
  },
  "sync.hierarchy.scheduled": {
    workflowId: "xsystem.scheduled-hierarchy-reconciliation",
    taskQueue: "core-maintenance-queue",
  },

  "workflow.dynamic.start": {
    workflowId: "dynamic-agent-orchestrator",
    taskQueue: "cityos-dynamic-queue",
  },
};

export function getWorkflowForEvent(
  eventType: string,
): { workflowId: string; taskQueue: string } | null {
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

  try {
    const result = await startWorkflow(
      mapping.workflowId,
      payload,
      nodeContext || {},
      mapping.taskQueue,
    );
    return { dispatched: true, runId: result.runId };
  } catch (err: any) {
    logger.warn(
      `[EventDispatcher] Failed to dispatch ${eventType} to Temporal:`,
      err.message,
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
    const eventOutboxService = container.resolve("eventOutbox") as unknown as any;
    const pendingEvents = await eventOutboxService.listPendingEvents(
      undefined,
      50,
    );

    for (const event of pendingEvents) {
      const mapping = getWorkflowForEvent(event.event_type);
      if (!mapping) {
        continue;
      }

      try {
        const envelope = eventOutboxService.buildEnvelope(event);
        await startWorkflow(
          mapping.workflowId,
          envelope.payload,
          {
            tenantId: event.tenant_id,
            nodeId: event.node_id,
            correlationId: event.correlation_id,
            channel: event.channel,
          },
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
      const eventOutboxService = container.resolve("eventOutbox") as unknown as any;
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
    `[EventDispatcher] Dispatched ${eventType} to Temporal: runId=${temporalResult.runId}`,
  );
  return { temporal: true, integrations: ["temporal"] };
}
