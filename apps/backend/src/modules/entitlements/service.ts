import { MedusaService } from "@medusajs/framework/utils";
import { Entitlement, EntitlementPolicy } from "./models/entitlement";

class EntitlementsModuleService extends MedusaService({
  Entitlement,
  EntitlementPolicy,
}) {
  /**
   * Grant an entitlement to a customer from a source module.
   */
  async grant(params: {
    customerId: string;
    sourceModule: string;
    sourceId: string;
    resourceType: string;
    resourceId?: string | null;
    validFrom?: Date;
    validUntil?: Date | null;
    graceDays?: number;
  }): Promise<any> {
    const {
      customerId,
      sourceModule,
      sourceId,
      resourceType,
      resourceId,
      validFrom,
      validUntil,
      graceDays = 3,
    } = params;

    return this.createEntitlements({
      customer_id: customerId,
      source_module: sourceModule,
      source_id: sourceId,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      status: "active",
      valid_from: validFrom ?? new Date(),
      valid_until: validUntil ?? null,
      grace_until: validUntil
        ? new Date(validUntil.getTime() + graceDays * 86400000)
        : null,
    } as any);
  }

  /**
   * Revoke an entitlement (with optional grace period).
   */
  async revoke(
    entitlementId: string,
    reason: string,
    immediate = false,
  ): Promise<void> {
    const ent = (await this.retrieveEntitlement(entitlementId)) as any;

    if (immediate || !ent.grace_until) {
      await this.updateEntitlements({
        id: entitlementId,
        status: "revoked",
        revoked_at: new Date(),
        revoke_reason: reason,
      } as any);
    } else {
      await this.updateEntitlements({
        id: entitlementId,
        status: "grace",
        revoke_reason: reason,
      } as any);
    }
  }

  /**
   * Check if a customer has a valid entitlement for a resource.
   */
  async check(
    customerId: string,
    resourceType: string,
    resourceId?: string,
  ): Promise<{
    entitled: boolean;
    entitlement?: any;
    expiresAt?: Date | null;
    inGrace?: boolean;
  }> {
    const filter: any = {
      customer_id: customerId,
      resource_type: resourceType,
    };
    const all = (await this.listEntitlements(filter)) as any[];
    const now = new Date();

    // Find active or grace entitlement
    const active = all.find((e) => {
      if (e.status === "revoked" || e.status === "expired") return false;
      if (resourceId && e.resource_id && e.resource_id !== resourceId)
        return false;
      if (e.valid_until && new Date(e.valid_until) < now) {
        return e.grace_until && new Date(e.grace_until) >= now; // grace period check
      }
      return true;
    });

    if (!active) return { entitled: false };

    const inGrace =
      active.status === "grace" ||
      (active.valid_until && new Date(active.valid_until) < now);
    return {
      entitled: true,
      entitlement: active,
      expiresAt: active.valid_until,
      inGrace: !!inGrace,
    };
  }

  /**
   * Expire entitlements past their valid_until + grace_until.
   */
  async expireStale(): Promise<number> {
    const all = (await this.listEntitlements({ status: "active" })) as any[];
    const now = new Date();
    let count = 0;

    for (const e of all) {
      const gracePassed = e.grace_until && new Date(e.grace_until) < now;
      const validPassed = e.valid_until && new Date(e.valid_until) < now;
      if (validPassed && gracePassed) {
        await this.updateEntitlements({ id: e.id, status: "expired" } as any);
        count++;
      }
    }
    return count;
  }
}

export default EntitlementsModuleService;
