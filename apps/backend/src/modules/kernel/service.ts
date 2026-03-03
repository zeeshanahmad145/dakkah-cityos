import { MedusaService } from "@medusajs/framework/utils";
import { Offer } from "./models/offer";
import { CommerceState, STATE_TRANSITIONS } from "./models/commerce-state";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:kernel");

class KernelModuleService extends MedusaService({ Offer, CommerceState }) {
  /**
   * Register any commerce entity as a universal Offer.
   * Call this from vertical module event subscribers when an entity is created.
   *
   * Example (from booking subscriber):
   *   await kernelService.createOffer({
   *     offerType: "service",
   *     monetizationModel: "one_time",
   *     executionEngine: "booking",
   *     sourceModule: "booking",
   *     sourceEntityId: booking.id,
   *     title: booking.service_name,
   *     basePrice: booking.price,
   *     tenantId: booking.tenant_id,
   *   })
   */
  async createOffer(params: {
    offerType: "good" | "service" | "right" | "access" | "license" | "usage";
    monetizationModel:
      | "one_time"
      | "recurring"
      | "usage"
      | "milestone"
      | "escrow"
      | "auction";
    executionEngine:
      | "booking"
      | "fulfillment"
      | "entitlement"
      | "dispatch"
      | "metering"
      | "digital"
      | "manual";
    settlementModel?: string;
    lifecycleModel?: string;
    sourceModule: string;
    sourceEntityId: string;
    title?: string;
    basePrice?: number;
    currencyCode?: string;
    requiresIdentityVerification?: boolean;
    requiresApproval?: boolean;
    tenantId?: string;
    vendorId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    // Prevent duplicate registrations for the same source entity
    const existing = (await this.listOffers({
      source_module: params.sourceModule,
      source_entity_id: params.sourceEntityId,
    })) as any[];
    if (existing.length > 0) {
      logger.info(
        `Offer already registered for ${params.sourceModule}:${params.sourceEntityId}`,
      );
      return existing[0];
    }

    const offer = await this.createOffers({
      offer_type: params.offerType,
      monetization_model: params.monetizationModel,
      execution_engine: params.executionEngine,
      settlement_model: params.settlementModel ?? null,
      lifecycle_model: params.lifecycleModel ?? null,
      source_module: params.sourceModule,
      source_entity_id: params.sourceEntityId,
      title: params.title ?? null,
      base_price: params.basePrice ?? 0,
      currency_code: params.currencyCode ?? "SAR",
      requires_identity_verification:
        params.requiresIdentityVerification ?? false,
      requires_approval: params.requiresApproval ?? false,
      is_active: true,
      tenant_id: params.tenantId ?? null,
      vendor_id: params.vendorId ?? null,
      metadata: params.metadata ?? null,
    } as any);

    logger.info(
      `Offer created: ${offer.id} [${params.offerType}/${params.monetizationModel}] from ${params.sourceModule}:${params.sourceEntityId}`,
    );
    return offer;
  }

  /**
   * Transition an entity to a new canonical state.
   * Validates against the allowed state transition graph.
   * Throws if the transition is invalid.
   */
  async transition(params: {
    entityType: string;
    entityId: string;
    toState: string;
    actorType?: string;
    actorId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const {
      entityType,
      entityId,
      toState,
      actorType,
      actorId,
      reason,
      metadata,
    } = params;

    // Get current state
    const currentRecord = await this._getCurrentStateRecord(entityId);
    const fromState = currentRecord?.current_state ?? null;

    // Validate transition
    if (fromState) {
      const allowed = STATE_TRANSITIONS[fromState] ?? [];
      if (!allowed.includes(toState)) {
        const err = `Invalid state transition: ${fromState} → ${toState} for ${entityType}:${entityId}. Allowed: [${allowed.join(", ")}]`;
        logger.warn(err);
        throw new Error(err);
      }
    }

    const stateRecord = await this.createCommerceStates({
      entity_type: entityType,
      entity_id: entityId,
      current_state: toState,
      previous_state: fromState,
      actor_type: actorType ?? "system",
      actor_id: actorId ?? null,
      reason: reason ?? null,
      metadata: metadata ?? null,
      transitioned_at: new Date(),
      tenant_id: null,
    } as any);

    logger.info(
      `State transition: ${entityType}:${entityId} ${fromState ?? "(new)"} → ${toState}`,
    );
    return stateRecord;
  }

  /**
   * Get current canonical state for an entity.
   */
  async getState(entityId: string): Promise<string | null> {
    const record = await this._getCurrentStateRecord(entityId);
    return record?.current_state ?? null;
  }

  /**
   * Get full lifecycle history for an entity (immutable audit log).
   */
  async getLifecycleHistory(entityId: string): Promise<any[]> {
    const records = (await this.listCommerceStates({
      entity_id: entityId,
    })) as any[];
    return records.sort(
      (a: any, b: any) =>
        new Date(a.transitioned_at).getTime() -
        new Date(b.transitioned_at).getTime(),
    );
  }

  /**
   * List all offers registered from a given source module.
   * Useful for cross-module querying via Layer 0.
   */
  async listOffersForModule(
    sourceModule: string,
    offerType?: string,
  ): Promise<any[]> {
    return this.listOffers({
      source_module: sourceModule,
      is_active: true,
      ...(offerType ? { offer_type: offerType } : {}),
    }) as Promise<any[]>;
  }

  /**
   * Get the most recent state record for an entity.
   */
  private async _getCurrentStateRecord(entityId: string): Promise<any | null> {
    const records = (await this.listCommerceStates({
      entity_id: entityId,
    })) as any[];
    if (records.length === 0) return null;
    return records.sort(
      (a: any, b: any) =>
        new Date(b.transitioned_at).getTime() -
        new Date(a.transitioned_at).getTime(),
    )[0];
  }
}

export default KernelModuleService;
