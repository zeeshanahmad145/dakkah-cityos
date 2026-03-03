import { MedusaService } from "@medusajs/framework/utils";
import { Resource } from "./models/resource";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:resource");

class ResourceModuleService extends MedusaService({ Resource }) {
  /**
   * Register a vertical module entity as a universal resource.
   * Called when inventory/booking/subscription records are created.
   */
  async registerResource(params: {
    resourceType: string;
    capacityModel: "fixed" | "time_slot" | "pool" | "metered" | "unlimited";
    ownershipModel: "owned" | "leased" | "licensed" | "pooled";
    transferability: "transferable" | "non_transferable" | "restricted";
    availabilityEngine:
      | "booking"
      | "inventory"
      | "subscription"
      | "metering"
      | "manual";
    totalCapacity?: number;
    sourceModule: string;
    sourceId: string;
    expiryAt?: Date;
    tenantId?: string;
    vendorId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    // Dedup
    const existing = (await this.listResources({
      source_module: params.sourceModule,
      source_id: params.sourceId,
    })) as any[];
    if (existing.length > 0) return existing[0];

    return this.createResources({
      resource_type: params.resourceType,
      capacity_model: params.capacityModel,
      ownership_model: params.ownershipModel,
      transferability: params.transferability,
      availability_engine: params.availabilityEngine,
      total_capacity: params.totalCapacity ?? null,
      available_capacity: params.totalCapacity ?? null,
      source_module: params.sourceModule,
      source_id: params.sourceId,
      expiry_at: params.expiryAt ?? null,
      is_active: true,
      tenant_id: params.tenantId ?? null,
      vendor_id: params.vendorId ?? null,
      metadata: params.metadata ?? null,
    } as any);
  }

  /**
   * Update available capacity (after a booking or purchase).
   */
  async consumeCapacity(resourceId: string, amount: number): Promise<any> {
    const resource = (await this.retrieveResource(resourceId)) as any;
    if (resource.capacity_model === "unlimited") return resource;

    const available = (resource.available_capacity ?? 0) - amount;
    if (available < 0)
      throw new Error(
        `Insufficient capacity for resource ${resourceId}: requested ${amount}, available ${resource.available_capacity}`,
      );

    return this.updateResources({
      id: resourceId,
      available_capacity: available,
    } as any);
  }

  /**
   * Release capacity (on cancellation or expiry).
   */
  async releaseCapacity(resourceId: string, amount: number): Promise<any> {
    const resource = (await this.retrieveResource(resourceId)) as any;
    const released = Math.min(
      resource.total_capacity ?? 0,
      (resource.available_capacity ?? 0) + amount,
    );
    return this.updateResources({
      id: resourceId,
      available_capacity: released,
    } as any);
  }
}

export default ResourceModuleService;
