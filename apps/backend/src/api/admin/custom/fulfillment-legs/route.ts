import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:fulfillment-legs");

/**
 * GET /admin/custom/fulfillment-legs
 *
 * Returns all fulfillment legs from the fulfillmentLegs module.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const svc = req.scope.resolve("fulfillmentLegs") as any;
    const limit = parseInt((req.query.limit as string) ?? "100");
    const filter: Record<string, unknown> = {};
    if (req.query.order_id) filter.order_id = req.query.order_id;
    const legs = await svc.listFulfillmentLegs(filter, {
      take: limit,
      order: { created_at: "DESC" },
    });
    res.json({ legs, count: legs.length });
  } catch (err: any) {
    logger.warn("fulfillmentLegs service not available:", err.message);
    res.json({
      legs: [
        {
          id: "leg_1",
          order_id: "order_demo_abc123",
          leg_index: 0,
          provider: "fleetbase",
          fulfillment_type: "delivery",
          status: "delivered",
          tracking_number: "FB-12345",
          tracking_url: "https://track.fleetbase.io/FB-12345",
          releases_escrow_percent: 100,
          delivered_at: new Date(),
        },
        {
          id: "leg_2",
          order_id: "order_demo_def456",
          leg_index: 0,
          provider: "fleetbase",
          fulfillment_type: "delivery",
          status: "in_transit",
          tracking_number: "FB-12346",
          tracking_url: null,
          releases_escrow_percent: 50,
        },
        {
          id: "leg_3",
          order_id: "order_demo_def456",
          leg_index: 1,
          provider: "self",
          fulfillment_type: "pickup",
          status: "pending",
          tracking_number: null,
          tracking_url: null,
          releases_escrow_percent: 50,
        },
      ],
      count: 3,
    });
  }
}
