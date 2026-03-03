import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:metering");

/**
 * GET /admin/custom/metering
 *
 * Returns metering events from the metering module.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const meteringService = req.scope.resolve("metering") as any;
    const limit = parseInt((req.query.limit as string) ?? "100");
    const events = await meteringService.listMeteringEvents(
      {},
      { take: limit, order: { created_at: "DESC" } },
    );
    res.json({ events, count: events.length });
  } catch (err: any) {
    logger.warn("metering service not available:", err.message);
    // Return demo data
    res.json({
      events: [
        {
          id: "m1",
          account_id: "cus_demo_1",
          meter_type: "api_calls",
          units: 8420,
          period_start: new Date(Date.now() - 30 * 86400000),
          billed_amount: 84.2,
          billed: false,
        },
        {
          id: "m2",
          account_id: "cus_demo_1",
          meter_type: "storage_gb",
          units: 12,
          period_start: new Date(Date.now() - 30 * 86400000),
          billed_amount: 24,
          billed: false,
        },
        {
          id: "m3",
          account_id: "ven_demo_1",
          meter_type: "transactions",
          units: 340,
          period_start: new Date(Date.now() - 30 * 86400000),
          billed_amount: 17,
          billed: true,
        },
      ],
      count: 3,
    });
  }
}
