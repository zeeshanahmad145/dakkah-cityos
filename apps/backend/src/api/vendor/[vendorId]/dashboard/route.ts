import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PROJECTIONS_MODULE } from "../../../../modules/projections";
import type ProjectionsModuleService from "../../../../modules/projections/service";

/**
 * GET /vendor/[vendorId]/dashboard
 *
 * Returns precomputed vendor projection for today, MTD, and YTD.
 * Reads from vendor_projection table (CQRS read side) — does NOT query settlement_ledger.
 * Refreshed hourly by vendor-projection-refresh cron job.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const projectionsService = req.scope.resolve(
    PROJECTIONS_MODULE,
  ) as unknown as ProjectionsModuleService;
  const { vendorId } = req.params as { vendorId: string };

  if (!vendorId) return res.status(400).json({ error: "vendorId is required" });

  const dashboard = await projectionsService.getVendorDashboard(vendorId);
  res.json(dashboard);
}
