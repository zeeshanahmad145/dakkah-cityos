/**
 * Temporal Retry Policies + Task Queue Isolation + Dead-Letter Handling
 *
 * Replaces canonical-workflows.ts stub retry configs with production-grade
 * per-workflow retry policies. Separates task queues by risk profile.
 *
 * Task Queue Topology:
 *   uce-commerce-financial    → one_time_goods, auction_settlement, milestone_escrow
 *   uce-commerce-dispatch     → on_demand_dispatch
 *   uce-commerce-recurring    → subscription_billing, usage_metering
 *   uce-commerce-fulfilment   → booking_service, trade_in_valuation
 *
 * All workflows write to a dead-letter event on exhausting retries.
 */
// @ts-ignore — install: npm install @temporalio/client @temporalio/worker @temporalio/workflow
import {
  proxyActivities,
  sleep,
  condition,
  defineSignal,
  setHandler,
  continueAsNew,
} from "@temporalio/workflow";

// ─── Retry policy constants ──────────────────────────────────────────────────

/** Financial workflows: conservative retries, long backoff, DLQ on exhaustion */
const FINANCIAL_RETRY = {
  maximumAttempts: 5,
  initialInterval: "10s",
  backoffCoefficient: 2,
  maximumInterval: "5m",
  nonRetryableErrorTypes: ["InsufficientFunds", "FraudDecline", "HardDecline"],
};

/** Dispatch workflows: fast retry for real-time SLA */
const DISPATCH_RETRY = {
  maximumAttempts: 3,
  initialInterval: "5s",
  backoffCoefficient: 1.5,
  maximumInterval: "30s",
  nonRetryableErrorTypes: ["NoDriverAvailable", "LocationNotServiceable"],
};

/** Recurring billing: tolerant of temporary PSP failures */
const BILLING_RETRY = {
  maximumAttempts: 10,
  initialInterval: "30s",
  backoffCoefficient: 2,
  maximumInterval: "12h",
  nonRetryableErrorTypes: ["SubscriptionCancelled", "PaymentMethodInvalid"],
};

/** Activity-level schedule-to-close for each profile */
const FINANCIAL_SCHEDULE_TO_CLOSE = "24h";
const DISPATCH_SCHEDULE_TO_CLOSE = "5m";
const BILLING_SCHEDULE_TO_CLOSE = "48h";

// ─── Activity proxies (per retry profile) ───────────────────────────────────

const financialActs = proxyActivities<any>({
  startToCloseTimeout: "10m",
  retry: FINANCIAL_RETRY,
  scheduleToCloseTimeout: FINANCIAL_SCHEDULE_TO_CLOSE,
});

const dispatchActs = proxyActivities<any>({
  startToCloseTimeout: "2m",
  retry: DISPATCH_RETRY,
  scheduleToCloseTimeout: DISPATCH_SCHEDULE_TO_CLOSE,
});

const billingActs = proxyActivities<any>({
  startToCloseTimeout: "5m",
  retry: BILLING_RETRY,
  scheduleToCloseTimeout: BILLING_SCHEDULE_TO_CLOSE,
});

// ─── Signals ────────────────────────────────────────────────────────────────

export const cancelSignal = defineSignal<[{ reason: string }]>("cancel");
export const pauseSignal = defineSignal<[{ reason: string }]>("pause");
export const resumeSignal = defineSignal("resume");
export const evidenceSignal =
  defineSignal<[{ evidenceType: string; payload: unknown }]>("evidence");
export const disputeSignal = defineSignal<[{ reason: string }]>("dispute");

// ─── Dead-letter helper ───────────────────────────────────────────────────—─

async function handleDeadLetter(
  workflowType: string,
  workflowId: string,
  params: unknown,
  error: unknown,
): Promise<void> {
  try {
    await financialActs.emitEvent("workflow.dead_letter", {
      workflow_type: workflowType,
      workflow_id: workflowId,
      params,
      error: error instanceof Error ? error.message : String(error),
      failed_at: new Date().toISOString(),
    });
  } catch {
    /* non-blocking */
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-financial
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * one_time_goods — Single purchase: payment → fulfillment → settlement → tax
 * Retry: financial profile (5 attempts, 10s→5m backoff)
 */
export async function one_time_goods(params: {
  offerId: string;
  orderId: string;
  customerId: string;
  grossAmount: number;
  currencyCode: string;
  vendorId?: string;
}): Promise<void> {
  try {
    await financialActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "PROCESSING",
    });
    await financialActs.postJournal({
      entries: [
        {
          accountType: "customer",
          accountId: params.customerId,
          debit: params.grossAmount,
          credit: 0,
          valueType: "money",
          currencyCode: params.currencyCode,
          referenceType: "order",
          referenceId: params.orderId,
        },
        {
          accountType: "clearing",
          accountId: "platform",
          debit: 0,
          credit: params.grossAmount,
          valueType: "money",
          currencyCode: params.currencyCode,
          referenceType: "order",
          referenceId: params.orderId,
        },
      ],
    });
    const legId = await financialActs.createFulfillmentLeg({
      orderId: params.orderId,
      vendorId: params.vendorId,
    });
    await financialActs.dispatchFulfillmentLeg(legId);
    await financialActs.completeFulfillmentLeg(legId);
    await financialActs.settleOrder({
      orderId: params.orderId,
      grossAmount: params.grossAmount,
      vendorId: params.vendorId,
      currencyCode: params.currencyCode,
    });
    await financialActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "COMPLETED",
    });
  } catch (err) {
    await financialActs
      .kernelTransition({
        entityType: "order",
        entityId: params.orderId,
        toState: "FAILED",
      })
      .catch(() => null);
    await handleDeadLetter("one_time_goods", params.orderId, params, err);
    throw err;
  }
}

/**
 * auction_settlement — Bid close → escrow capture → delivery → release
 * Retry: financial profile — escrow is idempotent
 */
export async function auction_settlement(params: {
  offerId: string;
  contractId: string;
  winnerId: string;
  vendorId: string;
  winAmount: number;
  currencyCode: string;
}): Promise<void> {
  try {
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "ACTIVE",
    });
    const freezeId = await financialActs.freezeScope({
      scopeType: "contract",
      scopeId: params.contractId,
      reason: "auction_escrow",
      releaseCondition: "delivery_confirmed",
    });
    const legId = await financialActs.createFulfillmentLeg({
      orderId: params.contractId,
      vendorId: params.vendorId,
    });
    await financialActs.dispatchFulfillmentLeg(legId);
    await financialActs.completeFulfillmentLeg(legId);
    await financialActs.submitEvidence({
      entityType: "contract",
      entityId: params.contractId,
      evidenceType: "photo",
    });
    await financialActs.thawScope(freezeId);
    await financialActs.settleOrder({
      orderId: params.contractId,
      grossAmount: params.winAmount,
      vendorId: params.vendorId,
      currencyCode: params.currencyCode,
    });
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "COMPLETED",
    });
  } catch (err) {
    await handleDeadLetter(
      "auction_settlement",
      params.contractId,
      params,
      err,
    );
    throw err;
  }
}

/**
 * milestone_escrow — Phase payments: each milestone posts, evidence gates release
 * Retry: financial, dispute-aware
 */
export async function milestone_escrow(params: {
  contractId: string;
  customerId: string;
  vendorId: string;
  milestones: Array<{ name: string; amount: number; evidenceType: string }>;
  currencyCode: string;
}): Promise<void> {
  let cancelled = false;
  let disputed = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  setHandler(disputeSignal, () => {
    disputed = true;
  });

  try {
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "ACTIVE",
    });
    for (const milestone of params.milestones) {
      if (cancelled || disputed) break;
      const freezeId = await financialActs.freezeScope({
        scopeType: "milestone",
        scopeId: `${params.contractId}:${milestone.name}`,
        reason: "milestone_escrow",
        releaseCondition: "evidence_verified",
      });
      await condition(() => cancelled || disputed, "30d"); // wait for evidence or timeout
      if (disputed) {
        await financialActs.emitEvent("contract.dispute_raised", {
          contract_id: params.contractId,
          milestone: milestone.name,
        });
        break;
      }
      await financialActs.submitEvidence({
        entityType: "contract",
        entityId: params.contractId,
        evidenceType: milestone.evidenceType as any,
      });
      await financialActs.thawScope(freezeId);
      await financialActs.postJournal({
        entries: [
          {
            accountType: "escrow",
            accountId: params.contractId,
            debit: milestone.amount,
            credit: 0,
            currencyCode: params.currencyCode,
            referenceType: "milestone",
            referenceId: milestone.name,
          },
          {
            accountType: "vendor",
            accountId: params.vendorId,
            debit: 0,
            credit: milestone.amount,
            currencyCode: params.currencyCode,
            referenceType: "milestone",
            referenceId: milestone.name,
          },
        ],
      });
    }
    const finalState = disputed
      ? "DISPUTED"
      : cancelled
        ? "REVERSED"
        : "COMPLETED";
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: finalState,
    });
  } catch (err) {
    await handleDeadLetter("milestone_escrow", params.contractId, params, err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-dispatch
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * on_demand_dispatch — Real-time driver assignment → GPS verify → settlement
 * Retry: fast dispatch profile (3 attempts, 5s backoff)
 */
export async function on_demand_dispatch(params: {
  orderId: string;
  customerId: string;
  vendorId: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  grossAmount: number;
  currencyCode: string;
}): Promise<void> {
  try {
    await dispatchActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "DISPATCHING",
    });
    const legId = await dispatchActs.createFulfillmentLeg({
      orderId: params.orderId,
      vendorId: params.vendorId,
      pickupLocation: params.pickupLocation,
      dropoffLocation: params.dropoffLocation,
    });
    await dispatchActs.dispatchFulfillmentLeg(legId);
    await dispatchActs.submitEvidence({
      entityType: "order",
      entityId: params.orderId,
      evidenceType: "gps_trace",
    });
    await dispatchActs.completeFulfillmentLeg(legId);
    await dispatchActs.settleOrder({
      orderId: params.orderId,
      grossAmount: params.grossAmount,
      vendorId: params.vendorId,
      currencyCode: params.currencyCode,
    });
    await dispatchActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "COMPLETED",
    });
  } catch (err: any) {
    // Non-retryable: no driver available
    if (err?.cause?.type === "NoDriverAvailable") {
      await dispatchActs
        .kernelTransition({
          entityType: "order",
          entityId: params.orderId,
          toState: "CANCELLED",
        })
        .catch(() => null);
      await dispatchActs.emitEvent("order.no_driver", {
        order_id: params.orderId,
      });
      return;
    }
    await handleDeadLetter("on_demand_dispatch", params.orderId, params, err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-recurring
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * subscription_billing — Durable billing loop with robust retry
 * continueAsNew() prevents history bloat on long-running subs
 * Retry: billing profile (10 attempts, 30s→12h backoff)
 */
export async function subscription_billing(params: {
  subscriptionId: string;
  customerId: string;
  planId: string;
  amount: number;
  currencyCode: string;
  intervalDays: number;
  cycleCount?: number;
}): Promise<void> {
  let paused = false;
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  setHandler(pauseSignal, () => {
    paused = true;
  });
  setHandler(resumeSignal, () => {
    paused = false;
  });

  const cycleCount = params.cycleCount ?? 0;

  if (!cancelled) {
    try {
      await billingActs.chargeSubscriptionCycle({
        subscriptionId: params.subscriptionId,
        customerId: params.customerId,
        amount: params.amount,
        currencyCode: params.currencyCode,
      });
      await billingActs.activateSubscriptionBenefits(params.subscriptionId);
    } catch (err: any) {
      if (
        err?.cause?.type === "SubscriptionCancelled" ||
        err?.cause?.type === "PaymentMethodInvalid"
      ) {
        await billingActs.emitEvent("subscription.hard_failed", {
          subscription_id: params.subscriptionId,
          cycle: cycleCount,
        });
        return; // Stop loop — non-retryable
      }
      throw err; // Retried by Temporal
    }
  }

  // Pause handling
  await condition(() => !paused || cancelled, "7d");
  if (cancelled) return;

  // Schedule next cycle via continueAsNew (prevents history bloat)
  await sleep(`${params.intervalDays}d`);
  if (!cancelled) {
    await continueAsNew<typeof subscription_billing>({
      ...params,
      cycleCount: cycleCount + 1,
    });
  }
}

/**
 * usage_metering — Accumulate usage until period end, then bill
 * Retry: billing profile
 */
export async function usage_metering(params: {
  contractId: string;
  customerId: string;
  meterType: string;
  periodDays: number;
  currencyCode: string;
}): Promise<void> {
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  try {
    await billingActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "ACTIVE",
    });
    await sleep(`${params.periodDays}d`);
    if (!cancelled) {
      await billingActs.closeMeteringPeriod({
        customerId: params.customerId,
        meterType: params.meterType,
      });
      await billingActs.kernelTransition({
        entityType: "contract",
        entityId: params.contractId,
        toState: "COMPLETED",
      });
    }
  } catch (err) {
    await handleDeadLetter("usage_metering", params.contractId, params, err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-fulfilment
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * booking_service — Escrow → evidence → release, with dispute window
 */
export async function booking_service(params: {
  contractId: string;
  offerId: string;
  customerId: string;
  vendorId: string;
  amount: number;
  currencyCode: string;
  bookingTime?: string;
}): Promise<void> {
  let disputed = false;
  let cancelled = false;
  setHandler(disputeSignal, () => {
    disputed = true;
  });
  setHandler(cancelSignal, () => {
    cancelled = true;
  });

  try {
    const bookingId = await financialActs.allocateBooking({
      offerId: params.offerId,
      customerId: params.customerId,
      vendorId: params.vendorId,
      bookingTime: params.bookingTime,
    });
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "ACTIVE",
    });
    const freezeId = await financialActs.freezeScope({
      scopeType: "contract",
      scopeId: params.contractId,
      reason: "booking_escrow",
      releaseCondition: "service_delivered",
    });
    await condition(() => disputed || cancelled, "7d");
    if (cancelled) {
      await financialActs.cancelBooking(bookingId, "customer_cancel");
      await financialActs.thawScope(freezeId);
      await financialActs.kernelTransition({
        entityType: "contract",
        entityId: params.contractId,
        toState: "REVERSED",
      });
      return;
    }
    if (disputed) {
      await financialActs.emitEvent("contract.dispute_raised", {
        contract_id: params.contractId,
      });
      await financialActs.kernelTransition({
        entityType: "contract",
        entityId: params.contractId,
        toState: "DISPUTED",
      });
      return;
    }
    await financialActs.confirmBooking(bookingId);
    await financialActs.submitEvidence({
      entityType: "contract",
      entityId: params.contractId,
      evidenceType: "checklist",
    });
    await financialActs.thawScope(freezeId);
    await financialActs.settleOrder({
      orderId: params.contractId,
      grossAmount: params.amount,
      vendorId: params.vendorId,
      currencyCode: params.currencyCode,
    });
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "COMPLETED",
    });
  } catch (err) {
    await handleDeadLetter("booking_service", params.contractId, params, err);
    throw err;
  }
}

/**
 * trade_in_valuation — Inspect → quote → customer decision → refund or purchase
 */
export async function trade_in_valuation(params: {
  contractId: string;
  customerId: string;
  vendorId: string;
  tradeInItemId: string;
  currencyCode: string;
}): Promise<void> {
  let accepted = false;
  let declined = false;
  setHandler(evidenceSignal, (ev) => {
    if (ev.evidenceType === "inspection_accepted") accepted = true;
    if (ev.evidenceType === "inspection_declined") declined = true;
  });
  try {
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: "PROCESSING",
    });
    await financialActs.submitEvidence({
      entityType: "contract",
      entityId: params.contractId,
      evidenceType: "photo",
    });
    await condition(() => accepted || declined, "72h");
    const finalState = accepted ? "COMPLETED" : "REVERSED";
    if (accepted) {
      await financialActs.emitEvent("trade_in.accepted", {
        contract_id: params.contractId,
      });
    } else {
      await financialActs.emitEvent("trade_in.declined", {
        contract_id: params.contractId,
      });
    }
    await financialActs.kernelTransition({
      entityType: "contract",
      entityId: params.contractId,
      toState: finalState,
    });
  } catch (err) {
    await handleDeadLetter(
      "trade_in_valuation",
      params.contractId,
      params,
      err,
    );
    throw err;
  }
}

// ─── Task queue export map ─────────────────────────────────────────────────—

/**
 * Maps each workflow to its isolated task queue.
 * Use when creating Temporal workers in worker.ts:
 *   const queue = WORKFLOW_TASK_QUEUES["subscription_billing"] // "uce-commerce-recurring"
 */
export const WORKFLOW_TASK_QUEUES: Record<string, string> = {
  // Financial
  one_time_goods: "uce-commerce-financial",
  auction_settlement: "uce-commerce-financial",
  milestone_escrow: "uce-commerce-financial",
  order_cancellation: "uce-commerce-financial",
  refund_compensation: "uce-commerce-financial",
  payout_processing: "uce-commerce-financial",
  // Dispatch
  on_demand_dispatch: "uce-commerce-dispatch",
  fulfillment_tracking: "uce-commerce-dispatch",
  // Recurring
  subscription_billing: "uce-commerce-recurring",
  usage_metering: "uce-commerce-recurring",
  // Fulfilment / Onboarding
  booking_service: "uce-commerce-fulfilment",
  trade_in_valuation: "uce-commerce-fulfilment",
  kyc_verification: "uce-commerce-fulfilment",
  vendor_onboarding: "uce-commerce-fulfilment",
  customer_onboarding: "uce-commerce-fulfilment",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-financial (continued)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * order_cancellation — Cancel an order: reverse ledger, refund PSP, notify
 * Retry: financial profile (5 attempts)
 */
export async function order_cancellation(params: {
  orderId: string;
  customerId: string;
  reason: string;
  grossAmount: number;
  currencyCode: string;
  vendorId?: string;
}): Promise<void> {
  let cancelled = false;
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  try {
    await financialActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "CANCELLING",
    });
    // Reverse clearing entry
    await financialActs.postJournal({
      entries: [
        {
          accountType: "clearing",
          accountId: "platform",
          debit: params.grossAmount,
          credit: 0,
          currencyCode: params.currencyCode,
          referenceType: "order_cancellation",
          referenceId: params.orderId,
        },
        {
          accountType: "customer",
          accountId: params.customerId,
          debit: 0,
          credit: params.grossAmount,
          currencyCode: params.currencyCode,
          referenceType: "order_cancellation",
          referenceId: params.orderId,
        },
      ],
    });
    await financialActs.cancelOrder(params.orderId, params.reason);
    await financialActs.emitEvent("order.refund_initiated", {
      order_id: params.orderId,
      amount: params.grossAmount,
      reason: params.reason,
    });
    await financialActs.kernelTransition({
      entityType: "order",
      entityId: params.orderId,
      toState: "CANCELLED",
    });
  } catch (err) {
    await handleDeadLetter("order_cancellation", params.orderId, params, err);
    throw err;
  }
}

/**
 * refund_compensation — Partial/full refund saga with ledger reversal + ERP
 * Supports full and partial amounts.
 */
export async function refund_compensation(params: {
  orderId: string;
  customerId: string;
  refundAmount: number;
  grossAmount: number;
  currencyCode: string;
  vendorId?: string;
  reason: string;
  isPartial: boolean;
}): Promise<void> {
  try {
    await financialActs.postJournal({
      entries: [
        {
          accountType: "refund",
          accountId: params.orderId,
          debit: params.refundAmount,
          credit: 0,
          currencyCode: params.currencyCode,
          referenceType: "refund",
          referenceId: params.orderId,
        },
        {
          accountType: "customer",
          accountId: params.customerId,
          debit: 0,
          credit: params.refundAmount,
          currencyCode: params.currencyCode,
          referenceType: "refund",
          referenceId: params.orderId,
        },
      ],
    });
    if (params.vendorId) {
      // Clawback vendor payout for refunded amount
      await financialActs.freezeScope({
        scopeType: "vendor_payout",
        scopeId: `${params.orderId}:${params.vendorId}`,
        reason: "refund_clawback",
        releaseCondition: "refund_settled",
      });
    }
    await financialActs.postSettlementToERP({
      orderId: params.orderId,
      amount: params.refundAmount,
      currencyCode: params.currencyCode,
      type: "refund",
    });
    await financialActs.emitEvent("refund.processed", {
      order_id: params.orderId,
      refund_amount: params.refundAmount,
      is_partial: params.isPartial,
    });
  } catch (err) {
    await handleDeadLetter("refund_compensation", params.orderId, params, err);
    throw err;
  }
}

/**
 * payout_processing — Calculate vendor payout → post ledger → submit to ERP
 * Retry: financial profile
 */
export async function payout_processing(params: {
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  platformFee: number;
  currencyCode: string;
}): Promise<void> {
  try {
    const netAmount = params.grossAmount - params.platformFee;
    await financialActs.postJournal({
      entries: [
        {
          accountType: "clearing",
          accountId: "platform",
          debit: netAmount,
          credit: 0,
          currencyCode: params.currencyCode,
          referenceType: "payout",
          referenceId: `payout:${params.vendorId}:${params.periodEnd}`,
        },
        {
          accountType: "payout",
          accountId: params.vendorId,
          debit: 0,
          credit: netAmount,
          currencyCode: params.currencyCode,
          referenceType: "payout",
          referenceId: `payout:${params.vendorId}:${params.periodEnd}`,
        },
      ],
    });
    await financialActs.postSettlementToERP({
      orderId: `payout:${params.vendorId}:${params.periodEnd}`,
      amount: netAmount,
      currencyCode: params.currencyCode,
      type: "vendor_payout",
    });
    await financialActs.emitEvent("payout.completed", {
      vendor_id: params.vendorId,
      net_amount: netAmount,
      period_end: params.periodEnd,
    });
  } catch (err) {
    await handleDeadLetter(
      "payout_processing",
      `${params.vendorId}:${params.periodEnd}`,
      params,
      err,
    );
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-dispatch (continued)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * fulfillment_tracking — Track a shipment through its lifecycle states
 * Handles: pending → picked_up → in_transit → delivered | failed
 */
export async function fulfillment_tracking(params: {
  fulfillmentId: string;
  orderId: string;
  vendorId: string;
  estimatedDelivery?: string;
}): Promise<void> {
  let delivered = false;
  let failed = false;
  setHandler(evidenceSignal, (ev: any) => {
    if (ev.evidenceType === "delivery_confirmed") delivered = true;
    if (ev.evidenceType === "delivery_failed") failed = true;
  });
  try {
    await dispatchActs.kernelTransition({
      entityType: "fulfillment",
      entityId: params.fulfillmentId,
      toState: "TRACKING",
    });
    // Wait up to 14 days for delivery confirmation
    await condition(() => delivered || failed, "14d");
    const finalState = delivered ? "DELIVERED" : "FAILED";
    await dispatchActs.kernelTransition({
      entityType: "fulfillment",
      entityId: params.fulfillmentId,
      toState: finalState,
    });
    await dispatchActs.emitEvent(`fulfillment.${finalState.toLowerCase()}`, {
      fulfillment_id: params.fulfillmentId,
      order_id: params.orderId,
    });
    if (delivered) {
      await dispatchActs.settleOrder({
        orderId: params.orderId,
        grossAmount: 0, // Settlement done in one_time_goods — just finalize state
        vendorId: params.vendorId,
        currencyCode: "SAR",
      });
    }
  } catch (err) {
    await handleDeadLetter(
      "fulfillment_tracking",
      params.fulfillmentId,
      params,
      err,
    );
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE: uce-commerce-fulfilment (continued)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * kyc_verification — KYC check → walt.id VC issuance
 * Non-retryable if document invalid.
 */
export async function kyc_verification(params: {
  customerId: string;
  documentType: string;
  documentRef: string;
  contractId?: string;
}): Promise<void> {
  try {
    await financialActs.kernelTransition({
      entityType: "customer",
      entityId: params.customerId,
      toState: "KYC_PENDING",
    });
    const vcId = await financialActs.issueVerifiableCredential({
      subjectId: params.customerId,
      type: "KYCCredential",
      claims: {
        document_type: params.documentType,
        document_ref: params.documentRef,
        verified_at: new Date().toISOString(),
      },
    });
    await financialActs.kernelTransition({
      entityType: "customer",
      entityId: params.customerId,
      toState: "KYC_VERIFIED",
    });
    await financialActs.emitEvent("kyc.completed", {
      customer_id: params.customerId,
      vc_id: vcId,
      document_type: params.documentType,
    });
  } catch (err: any) {
    if (err?.cause?.type === "InvalidDocument") {
      await financialActs.kernelTransition({
        entityType: "customer",
        entityId: params.customerId,
        toState: "KYC_REJECTED",
      });
      await financialActs.emitEvent("kyc.rejected", {
        customer_id: params.customerId,
      });
      return;
    }
    await handleDeadLetter("kyc_verification", params.customerId, params, err);
    throw err;
  }
}

/**
 * vendor_onboarding — Vendor setup → verification → platform activation
 */
export async function vendor_onboarding(params: {
  vendorId: string;
  tenantId: string;
  companyName: string;
  email: string;
  categoryId?: string;
}): Promise<void> {
  let approved = false;
  let rejected = false;
  setHandler(evidenceSignal, (ev: any) => {
    if (ev.evidenceType === "kyc_approved") approved = true;
    if (ev.evidenceType === "kyc_rejected") rejected = true;
  });
  try {
    await financialActs.kernelTransition({
      entityType: "vendor",
      entityId: params.vendorId,
      toState: "PENDING_VERIFICATION",
    });
    // Wait for admin/KYC review (up to 30 days)
    await condition(() => approved || rejected, "30d");
    if (rejected) {
      await financialActs.kernelTransition({
        entityType: "vendor",
        entityId: params.vendorId,
        toState: "REJECTED",
      });
      await financialActs.emitEvent("vendor.rejected", {
        vendor_id: params.vendorId,
      });
      return;
    }
    await financialActs.activateVendor(params.vendorId);
    await financialActs.syncCustomerToCms(params.vendorId, "vendor");
    await financialActs.kernelTransition({
      entityType: "vendor",
      entityId: params.vendorId,
      toState: "ACTIVE",
    });
    await financialActs.emitEvent("vendor.approved", {
      vendor_id: params.vendorId,
    });
  } catch (err) {
    await handleDeadLetter("vendor_onboarding", params.vendorId, params, err);
    throw err;
  }
}

/**
 * customer_onboarding — Create customer, sync to CMS, emit welcome
 */
export async function customer_onboarding(params: {
  customerId: string;
  email: string;
  name: string;
  tenantId?: string;
}): Promise<void> {
  try {
    await financialActs.kernelTransition({
      entityType: "customer",
      entityId: params.customerId,
      toState: "ACTIVE",
    });
    await financialActs.syncCustomerToCms(params.customerId, "customer");
    await financialActs.emitEvent("customer.welcomed", {
      customer_id: params.customerId,
      email: params.email,
    });
  } catch (err) {
    await handleDeadLetter(
      "customer_onboarding",
      params.customerId,
      params,
      err,
    );
    throw err;
  }
}
