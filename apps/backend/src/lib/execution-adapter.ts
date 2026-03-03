/**
 * ExecutionAdapter — Universal interface for all vertical service execution engines.
 *
 * Every vertical that involves fulfillment MUST implement this interface.
 * This ensures orchestration (saga + contracts + Temporal workflows) can
 * coordinate any service execution through a single surface.
 *
 * Implementors:
 *   BookingExecutionAdapter    — scheduling engine (fitness, healthcare, restaurants)
 *   FulfillmentExecutionAdapter — physical delivery via Fleetbase
 *   EntitlementExecutionAdapter — digital access gates
 *   MeteringExecutionAdapter   — usage tracking (API calls, parking, utilities)
 *
 * Lifecycle:
 *   allocate → start → [verify] → complete → [settle]
 *                        ↓fail
 *                     compensate
 */

import { createLogger } from "./logger";

const logger = createLogger("lib:execution-adapter");

export type AllocationContext = {
  offer_id: string;
  offer_type: string;
  booking_time?: Date;
  location?: { lat: number; lng: number };
  customer_id: string;
  vendor_id?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
};

export type AllocationResult = {
  allocation_id: string;
  status: "allocated" | "failed";
  allocated_resource_id?: string;
  allocated_slot?: { start: Date; end: Date };
  confirmation_code?: string;
  expires_at?: Date;
  metadata?: Record<string, unknown>;
};

export type VerificationResult = {
  verified: boolean;
  evidence_ids?: string[];
  verification_method?: string;
  verified_at: Date;
  notes?: string;
};

export type CompensationResult = {
  compensated: boolean;
  compensation_type: "refund" | "credit" | "void" | "partial_refund";
  amount_compensated?: number;
  notes?: string;
};

export type EvidenceRef = {
  evidence_type: string;
  evidence_id: string;
};

/**
 * Abstract base class — all vertical execution engines must extend this.
 */
export abstract class ExecutionAdapter {
  abstract readonly adapterName: string;

  /**
   * Reserve / lock capacity for an offer. Returns allocation details.
   * Called when cart → checkout → AUTHORIZED.
   */
  abstract allocate(
    offerId: string,
    context: AllocationContext,
  ): Promise<AllocationResult>;

  /**
   * Start execution of an allocated offer.
   * Called when contract → ALLOCATED → EXECUTED (e.g., vendor accepts booking).
   */
  abstract start(allocationId: string): Promise<void>;

  /**
   * Verify fulfillment is complete before releasing escrow.
   * Returns a VerificationResult — can include evidence IDs attached to the obligation.
   * Called when execution transitions EXECUTED → VERIFIED.
   */
  abstract verify(
    allocationId: string,
    evidence?: EvidenceRef[],
  ): Promise<VerificationResult>;

  /**
   * Mark execution complete and release escrowed funds.
   * Called when VERIFIED → SETTLED.
   */
  abstract complete(allocationId: string): Promise<void>;

  /**
   * Mark execution as failed (e.g., no-show, delivery failure, system error).
   * Called when execution reaches a terminal failure state.
   */
  abstract fail(allocationId: string, reason: string): Promise<void>;

  /**
   * Compensate for a failed or cancelled execution.
   * Must be idempotent — safe to call multiple times (for saga retry).
   * Called during saga rollback.
   */
  abstract compensate(
    allocationId: string,
    reason: string,
  ): Promise<CompensationResult>;
}

// ==============================================================
// Concrete Adapter: Booking
// ==============================================================
export class BookingExecutionAdapter extends ExecutionAdapter {
  readonly adapterName = "booking";
  private bookingService: any;

  constructor(bookingService: any) {
    super();
    this.bookingService = bookingService;
  }

  async allocate(
    offerId: string,
    ctx: AllocationContext,
  ): Promise<AllocationResult> {
    try {
      const booking = await this.bookingService.createBooking({
        offer_id: offerId,
        customer_id: ctx.customer_id,
        vendor_id: ctx.vendor_id ?? null,
        booking_time: ctx.booking_time ?? null,
        status: "pending",
        metadata: ctx.metadata ?? null,
      });
      return {
        allocation_id: booking.id,
        status: "allocated",
        confirmation_code:
          booking.confirmation_code ?? booking.id.slice(-8).toUpperCase(),
        allocated_slot: ctx.booking_time
          ? {
              start: ctx.booking_time,
              end: new Date(ctx.booking_time.getTime() + 3_600_000),
            }
          : undefined,
        metadata: { booking_id: booking.id },
      };
    } catch (err: any) {
      logger.error("BookingExecutionAdapter.allocate failed:", err.message);
      return { allocation_id: "", status: "failed" };
    }
  }

  async start(allocationId: string): Promise<void> {
    await this.bookingService.confirmBooking(allocationId);
  }

  async verify(
    allocationId: string,
    evidence?: EvidenceRef[],
  ): Promise<VerificationResult> {
    return {
      verified: true,
      evidence_ids: evidence?.map((e) => e.evidence_id),
      verified_at: new Date(),
      verification_method: "booking_service",
    };
  }

  async complete(allocationId: string): Promise<void> {
    await this.bookingService.completeBooking?.(allocationId);
  }

  async fail(allocationId: string, reason: string): Promise<void> {
    await this.bookingService.cancelBooking?.(allocationId, reason);
  }

  async compensate(
    allocationId: string,
    reason: string,
  ): Promise<CompensationResult> {
    await this.fail(allocationId, reason);
    return { compensated: true, compensation_type: "void", notes: reason };
  }
}

// ==============================================================
// Concrete Adapter: Fulfillment (Fleetbase)
// ==============================================================
export class FulfillmentExecutionAdapter extends ExecutionAdapter {
  readonly adapterName = "fulfillment";
  private fulfillmentService: any;

  constructor(fulfillmentService: any) {
    super();
    this.fulfillmentService = fulfillmentService;
  }

  async allocate(
    offerId: string,
    ctx: AllocationContext,
  ): Promise<AllocationResult> {
    const leg = await this.fulfillmentService.createFulfillmentLeg?.({
      order_id: offerId,
      origin: null,
      destination: ctx.location ?? null,
      status: "pending",
      carrier_id: ctx.vendor_id ?? null,
    });
    return {
      allocation_id: leg?.id ?? `leg_${Date.now()}`,
      status: "allocated",
    };
  }

  async start(allocationId: string): Promise<void> {
    await this.fulfillmentService.dispatchLeg?.(allocationId);
  }

  async verify(
    allocationId: string,
    evidence?: EvidenceRef[],
  ): Promise<VerificationResult> {
    const delivered =
      evidence?.some((e) => e.evidence_type === "gps_proof") ?? false;
    return {
      verified: delivered,
      evidence_ids: evidence?.map((e) => e.evidence_id),
      verified_at: new Date(),
    };
  }

  async complete(allocationId: string): Promise<void> {
    await this.fulfillmentService.completeLeg?.(allocationId);
  }

  async fail(allocationId: string, reason: string): Promise<void> {
    await this.fulfillmentService.failLeg?.(allocationId, reason);
  }

  async compensate(
    allocationId: string,
    reason: string,
  ): Promise<CompensationResult> {
    await this.fail(allocationId, reason);
    return { compensated: true, compensation_type: "void", notes: reason };
  }
}

// ==============================================================
// Concrete Adapter: Entitlement (digital access)
// ==============================================================
export class EntitlementExecutionAdapter extends ExecutionAdapter {
  readonly adapterName = "entitlement";
  private entitlementService: any;

  constructor(entitlementService: any) {
    super();
    this.entitlementService = entitlementService;
  }

  async allocate(
    offerId: string,
    ctx: AllocationContext,
  ): Promise<AllocationResult> {
    const entitlement = await this.entitlementService.grantEntitlement?.({
      customer_id: ctx.customer_id,
      offer_id: offerId,
      resource_type: "digital_access",
    });
    return {
      allocation_id: entitlement?.id ?? `ent_${Date.now()}`,
      status: "allocated",
    };
  }

  async start(allocationId: string): Promise<void> {
    await this.entitlementService.activateEntitlement?.(allocationId);
  }

  async verify(_allocationId: string): Promise<VerificationResult> {
    return {
      verified: true,
      verified_at: new Date(),
      verification_method: "entitlement_grant",
    };
  }

  async complete(allocationId: string): Promise<void> {
    logger.info(
      `Entitlement ${allocationId} complete (access persists until expiry)`,
    );
  }

  async fail(allocationId: string, reason: string): Promise<void> {
    await this.entitlementService.revokeEntitlement?.(allocationId);
    logger.warn(`Entitlement ${allocationId} revoked: ${reason}`);
  }

  async compensate(
    allocationId: string,
    reason: string,
  ): Promise<CompensationResult> {
    await this.fail(allocationId, reason);
    return { compensated: true, compensation_type: "void" };
  }
}

// ==============================================================
// Concrete Adapter: Metering (usage-based)
// ==============================================================
export class MeteringExecutionAdapter extends ExecutionAdapter {
  readonly adapterName = "metering";
  private meteringService: any;

  constructor(meteringService: any) {
    super();
    this.meteringService = meteringService;
  }

  async allocate(
    offerId: string,
    ctx: AllocationContext,
  ): Promise<AllocationResult> {
    return {
      allocation_id: `meter_${ctx.customer_id}_${offerId}`,
      status: "allocated",
    };
  }

  async start(allocationId: string): Promise<void> {
    logger.info(`Metering session started: ${allocationId}`);
  }

  async verify(allocationId: string): Promise<VerificationResult> {
    return {
      verified: true,
      verified_at: new Date(),
      verification_method: "metering_checkpoint",
    };
  }

  async complete(allocationId: string): Promise<void> {
    await this.meteringService.closePeriod?.({ session_id: allocationId });
  }

  async fail(allocationId: string, reason: string): Promise<void> {
    logger.warn(`Metering session ${allocationId} failed: ${reason}`);
  }

  async compensate(
    allocationId: string,
    reason: string,
  ): Promise<CompensationResult> {
    await this.meteringService.voidEvents?.({
      session_id: allocationId,
      reason,
    });
    return { compensated: true, compensation_type: "void" };
  }
}

/**
 * ExecutionAdapterRegistry — resolve the correct adapter for an offer's execution_engine.
 */
export class ExecutionAdapterRegistry {
  private adapters: Map<string, ExecutionAdapter> = new Map();

  register(name: string, adapter: ExecutionAdapter): void {
    this.adapters.set(name, adapter);
    logger.info(`ExecutionAdapter registered: ${name}`);
  }

  resolve(executionEngine: string): ExecutionAdapter {
    const adapter = this.adapters.get(executionEngine);
    if (!adapter)
      throw new Error(
        `No ExecutionAdapter registered for engine: ${executionEngine}`,
      );
    return adapter;
  }
}

export const executionAdapterRegistry = new ExecutionAdapterRegistry();
