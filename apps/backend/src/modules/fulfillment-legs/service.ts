import { MedusaService } from "@medusajs/framework/utils";
import { FulfillmentLeg } from "./models/fulfillment-leg";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:fulfillment-legs");

const FLEETBASE_URL = process.env.FLEETBASE_API_URL ?? "";
const FLEETBASE_KEY = process.env.FLEETBASE_API_KEY ?? "";

class FulfillmentLegsModuleService extends MedusaService({ FulfillmentLeg }) {
  /**
   * Split a multi-vendor order into fulfillment legs and dispatch each via Fleetbase.
   */
  async createLegsForOrder(
    orderId: string,
    legSpecs: Array<{
      items: Array<{ variant_id: string; quantity: number }>;
      vendor_id?: string;
      warehouse_id?: string;
      fulfillment_type?: string;
      releases_escrow_percent?: number;
      tenant_id?: string;
    }>,
  ): Promise<any[]> {
    const legs: any[] = [];
    for (let i = 0; i < legSpecs.length; i++) {
      const spec = legSpecs[i];
      let providerOrderId: string | null = null;

      // Dispatch to Fleetbase if configured
      if (FLEETBASE_URL && FLEETBASE_KEY) {
        try {
          const resp = await fetch(`${FLEETBASE_URL}/v1/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${FLEETBASE_KEY}`,
            },
            body: JSON.stringify({
              payload: { entities: spec.items },
              meta: {
                order_id: orderId,
                leg_index: i,
                vendor_id: spec.vendor_id,
              },
            }),
          });
          if (resp.ok) {
            const data: any = await resp.json();
            providerOrderId = data?.data?.id ?? null;
          }
        } catch (err) {
          logger.warn(
            `Fleetbase dispatch failed for leg ${i} of order ${orderId}: ${String(err)}`,
          );
        }
      }

      const leg = await this.createFulfillmentLegs({
        order_id: orderId,
        leg_index: i,
        provider: "fleetbase",
        provider_order_id: providerOrderId,
        items: spec.items,
        fulfillment_type: spec.fulfillment_type ?? "delivery",
        status: providerOrderId ? "dispatched" : "pending",
        releases_escrow_percent: spec.releases_escrow_percent ?? 0,
        vendor_id: spec.vendor_id ?? null,
        warehouse_id: spec.warehouse_id ?? null,
        tenant_id: spec.tenant_id ?? null,
        dispatched_at: providerOrderId ? new Date() : null,
      } as any);
      legs.push(leg);
    }

    logger.info(`${legs.length} fulfillment legs created for order ${orderId}`);
    return legs;
  }

  /**
   * Mark a leg as delivered and optionally record proof.
   */
  async markDelivered(
    legId: string,
    proof?: { type: string; url: string },
  ): Promise<any> {
    return this.updateFulfillmentLegs({
      id: legId,
      status: "delivered",
      delivered_at: new Date(),
      ...(proof ? { proof_type: proof.type, proof_url: proof.url } : {}),
    } as any);
  }

  /**
   * Get all legs for an order and compute overall fulfillment status.
   */
  async getOrderFulfillmentStatus(orderId: string): Promise<{
    legs: any[];
    fully_delivered: boolean;
    escrow_release_percent: number;
  }> {
    const legs = (await this.listFulfillmentLegs({
      order_id: orderId,
    })) as any[];
    const deliveredLegs = legs.filter((l: any) => l.status === "delivered");
    const escrowPercent = deliveredLegs.reduce(
      (sum: number, l: any) => sum + (l.releases_escrow_percent ?? 0),
      0,
    );
    return {
      legs,
      fully_delivered: legs.length > 0 && deliveredLegs.length === legs.length,
      escrow_release_percent: Math.min(escrowPercent, 100),
    };
  }
}

export default FulfillmentLegsModuleService;
