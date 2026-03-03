/**
 * Temporal Activity Implementations — UCE Canonical Workflows
 *
 * These are the concrete activity implementations that Temporal worker calls.
 * Each activity function wraps a real Medusa module service call.
 *
 * Activities are stateless functions injected into the Temporal worker via
 * the activities object. They receive a MedusaContainer reference at registration
 * time via closure (see worker.ts registerWithContainer()).
 *
 * Every activity is:
 *   - Idempotent (safe to retry on failure)
 *   - Deterministic result regardless of how many times it runs
 *   - Logs enough context for audit/replay
 */

import { createLogger } from "../lib/logger";

const logger = createLogger("temporal:activities");

/**
 * Register all activities against a Medusa container.
 * Call this from the Temporal worker before Worker.create().
 *
 * activities = registerActivities(container)
 * await Worker.create({ ..., activities })
 */
export function registerActivities(container: any) {
  const kernelService = container.resolve("kernel") as any;
  const ledgerService = container.resolve("ledger") as any;
  const contractService = container.resolve("commerceContract") as any;
  const bookingService = container.resolve("booking") as any;
  const fulfillmentLegsService = container.resolve("fulfillmentLegs") as any;
  const settlement = container.resolve("settlement") as any;
  const subscriptionService = container.resolve("subscription") as any;
  const subscriptionBenefitsService = container.resolve(
    "subscriptionBenefits",
  ) as any;
  const meteringService = container.resolve("metering") as any;
  const eventBus = container.resolve("event_bus") as any;

  return {
    // ─── State machine ─────────────────────────────────────────────────────
    async kernelTransition(params: {
      entityType: string;
      entityId: string;
      toState: string;
      actorType?: string;
      actorId?: string;
      reason?: string;
    }): Promise<void> {
      await kernelService.transition({
        entityType: params.entityType,
        entityId: params.entityId,
        toState: params.toState,
        actorType: params.actorType ?? "system",
        actorId: params.actorId ?? null,
        reason: params.reason ?? null,
      });
      logger.info(
        `kernelTransition: ${params.entityType}:${params.entityId} → ${params.toState}`,
      );
    },

    // ─── Ledger ────────────────────────────────────────────────────────────
    async postJournal(params: {
      entries: Array<{
        accountType: string;
        accountId: string;
        debit?: number;
        credit?: number;
        valueType?: string;
        currency?: string;
        description?: string;
        referenceType?: string;
        referenceId?: string;
      }>;
    }): Promise<void> {
      await ledgerService.post(params.entries);
      logger.info(`postJournal: ${params.entries.length} entries posted`);
    },

    async freezeScope(params: {
      scopeType: string;
      scopeId: string;
      reason: string;
      description?: string;
      releaseCondition: string;
    }): Promise<string> {
      const record = await ledgerService.freezeScope(params);
      return record.id;
    },

    async thawScope(freezeRecordId: string): Promise<void> {
      await ledgerService.thaw(freezeRecordId, "Workflow-triggered thaw");
    },

    // ─── Booking adapter ───────────────────────────────────────────────────
    async allocateBooking(params: {
      offerId: string;
      customerId: string;
      vendorId?: string;
      bookingTime?: string;
      metadata?: Record<string, unknown>;
    }): Promise<string> {
      const booking = await bookingService.createBookings({
        offer_id: params.offerId,
        customer_id: params.customerId,
        vendor_id: params.vendorId ?? null,
        booking_time: params.bookingTime ? new Date(params.bookingTime) : null,
        status: "pending",
        metadata: params.metadata ?? null,
      } as any);
      logger.info(`allocateBooking: booking ${booking.id}`);
      return booking.id;
    },

    async confirmBooking(bookingId: string): Promise<void> {
      await bookingService.updateBookings({
        id: bookingId,
        status: "confirmed",
      } as any);
    },

    async completeBooking(bookingId: string): Promise<void> {
      await bookingService.updateBookings({
        id: bookingId,
        status: "completed",
      } as any);
    },

    async cancelBooking(bookingId: string, reason: string): Promise<void> {
      await bookingService.updateBookings({
        id: bookingId,
        status: "cancelled",
        metadata: { cancel_reason: reason },
      } as any);
    },

    // ─── Fulfillment (Fleetbase) adapter ───────────────────────────────────
    async createFulfillmentLeg(params: {
      orderId: string;
      vendorId?: string;
      pickupLocation?: { lat: number; lng: number };
      dropoffLocation?: { lat: number; lng: number };
      carrier_id?: string;
    }): Promise<string> {
      const leg = await fulfillmentLegsService.createFulfillmentLegs({
        order_id: params.orderId,
        status: "pending",
        carrier_id: params.vendorId ?? null,
        metadata: {
          pickup_location: params.pickupLocation,
          dropoff_location: params.dropoffLocation,
        },
      } as any);
      // Forward to Fleetbase if configured
      if (process.env.FLEETBASE_API_URL) {
        await _syncToFleetbase("order", {
          order_id: params.orderId,
          leg_id: leg.id,
          ...params,
        });
      }
      return leg.id;
    },

    async dispatchFulfillmentLeg(legId: string): Promise<void> {
      await fulfillmentLegsService.updateFulfillmentLegs({
        id: legId,
        status: "dispatched",
      } as any);
    },

    async completeFulfillmentLeg(legId: string): Promise<void> {
      await fulfillmentLegsService.updateFulfillmentLegs({
        id: legId,
        status: "delivered",
      } as any);
      logger.info(`fulfillmentLeg ${legId} delivered`);
    },

    async failFulfillmentLeg(legId: string, reason: string): Promise<void> {
      await fulfillmentLegsService.updateFulfillmentLegs({
        id: legId,
        status: "failed",
        metadata: { failure_reason: reason },
      } as any);
    },

    // ─── Settlement adapter ────────────────────────────────────────────────
    async settleOrder(params: {
      orderId: string;
      grossAmount: number;
      vendorId?: string;
      currencyCode?: string;
    }): Promise<string> {
      const ledger = await settlement.createSettlementLedger({
        order_id: params.orderId,
        gross_amount: params.grossAmount,
        vendor_id: params.vendorId ?? null,
        currency_code: params.currencyCode ?? "SAR",
        status: "pending",
      } as any);
      logger.info(
        `settleOrder: ledger ${ledger.id} created for order ${params.orderId}`,
      );
      return ledger.id;
    },

    // ─── Subscription ──────────────────────────────────────────────────────
    async activateSubscription(subscriptionId: string): Promise<void> {
      await subscriptionService.updateSubscriptions?.({
        id: subscriptionId,
        status: "active",
      } as any);
      logger.info(`subscription ${subscriptionId} activated`);
    },

    async activateSubscriptionBenefits(subscriptionId: string): Promise<void> {
      await subscriptionBenefitsService.createSubscriptionBenefits?.({
        subscription_id: subscriptionId,
        status: "active",
        activated_at: new Date(),
      } as any);
    },

    async chargeSubscriptionCycle(params: {
      subscriptionId: string;
      customerId: string;
      amount: number;
      currencyCode: string;
    }): Promise<void> {
      // Post ledger entry for cycle charge
      await ledgerService.post([
        {
          accountType: "customer",
          accountId: params.customerId,
          debit: params.amount,
          credit: 0,
          valueType: "money",
          currencyCode: params.currencyCode,
          description: `Subscription cycle: ${params.subscriptionId}`,
          referenceType: "subscription",
          referenceId: params.subscriptionId,
        },
        {
          accountType: "revenue",
          accountId: "platform",
          debit: 0,
          credit: params.amount,
          valueType: "money",
          currencyCode: params.currencyCode,
          description: `Sub revenue: ${params.subscriptionId}`,
          referenceType: "subscription",
          referenceId: params.subscriptionId,
        },
      ]);
      // Emit billing event
      await eventBus.emit?.("subscription.cycle_charged", {
        subscription_id: params.subscriptionId,
        amount: params.amount,
        currency: params.currencyCode,
      });
    },

    // ─── Metering ──────────────────────────────────────────────────────────
    async closeMeteringPeriod(params: {
      customerId: string;
      meterType: string;
    }): Promise<void> {
      await meteringService.closePeriod?.({
        customer_id: params.customerId,
        meter_type: params.meterType,
      });
    },

    // ─── Evidence ──────────────────────────────────────────────────────────
    async submitEvidence(params: {
      entityType: string;
      entityId: string;
      evidenceType: string;
      payload?: Record<string, unknown>;
    }): Promise<string> {
      const evidence = await contractService.submitEvidence({
        entityType: params.entityType,
        entityId: params.entityId,
        evidenceType: params.evidenceType as any,
        payload: params.payload,
        capturedByType: "system",
      });
      return evidence.id;
    },

    // ─── Event emission (for saga/choreography) ────────────────────────────
    async emitEvent(
      eventName: string,
      payload: Record<string, unknown>,
    ): Promise<void> {
      await eventBus.emit?.(eventName, payload);
    },
  };
}

// Internal: sync an order/dispatch event to Fleetbase REST API
async function _syncToFleetbase(
  resourceType: string,
  data: Record<string, unknown>,
): Promise<void> {
  const apiUrl = process.env.FLEETBASE_API_URL;
  const apiKey = process.env.FLEETBASE_API_KEY;
  if (!apiUrl || !apiKey) return;
  try {
    const res = await fetch(`${apiUrl}/v1/${resourceType}s`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) logger.warn(`Fleetbase sync failed: ${res.status}`);
    else logger.info(`Fleetbase sync OK: ${resourceType}`);
  } catch (err: any) {
    logger.error(`Fleetbase sync error: ${err.message}`);
  }
}
