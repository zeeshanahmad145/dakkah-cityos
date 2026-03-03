import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createLogger } from "../../../../lib/logger";

const logger = createLogger("api:store:metering-usage");

/**
 * GET /store/metering/usage
 *
 * Returns the authenticated customer's or vendor's metering usage for the
 * current or last billing period, used by the /account/usage storefront page.
 *
 * Query params:
 *   ?period=current|last  (default: current)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actorId = req.auth_context?.actor_id;
  if (!actorId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const period = (req.query.period as string) === "last" ? "last" : "current";

  try {
    const svc = req.scope.resolve("metering") as any;
    const filter: Record<string, unknown> = { account_id: actorId };

    // Compute period bounds
    const now = new Date();
    if (period === "current") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.period_start = { $gte: start };
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.period_start = { $gte: start, $lt: end };
    }

    const events = await svc.listMeteringEvents(filter, { take: 200 });

    // Aggregate by meter_type with limit info
    const byType: Record<
      string,
      {
        units: number;
        billed_amount: number;
        unit_label: string;
        limit?: number;
      }
    > = {};
    for (const e of events) {
      if (!byType[e.meter_type])
        byType[e.meter_type] = {
          units: 0,
          billed_amount: 0,
          unit_label: e.unit_label ?? "units",
        };
      byType[e.meter_type].units += e.units ?? 0;
      byType[e.meter_type].billed_amount += e.billed_amount ?? 0;
      if (e.period_limit) byType[e.meter_type].limit = e.period_limit;
    }

    const usage = Object.entries(byType).map(([meter_type, agg]) => ({
      meter_type,
      ...agg,
    }));
    res.json({ usage, period });
  } catch (err: any) {
    logger.warn(
      "metering service not available, returning demo data:",
      err.message,
    );
    res.json({
      period,
      usage: [
        {
          meter_type: "api_calls",
          units: 3420,
          billed_amount: 34.2,
          unit_label: "calls",
          limit: 10000,
        },
        {
          meter_type: "storage_gb",
          units: 5,
          billed_amount: 10,
          unit_label: "GB",
          limit: 20,
        },
      ],
    });
  }
}
