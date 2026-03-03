import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SIMULATION_MODULE } from "../../../../modules/simulation";
import type SimulationModuleService from "../../../../modules/simulation/service";

/**
 * POST /admin/simulation/settlement
 *
 * Previews the settlement payout for a vendor WITHOUT committing.
 *
 * Body: { vendor_id, gross_revenue, commission_pct?, tax_pct?, refunds_total?, currency_code? }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const sim = req.scope.resolve(
    SIMULATION_MODULE,
  ) as unknown as SimulationModuleService;
  const body = req.body as {
    vendor_id: string;
    gross_revenue: number;
    commission_pct?: number;
    tax_pct?: number;
    refunds_total?: number;
    currency_code?: string;
  };
  const result = await sim.simulateSettlement({
    vendorId: body.vendor_id,
    grossRevenue: body.gross_revenue,
    commissionPct: body.commission_pct,
    taxPct: body.tax_pct,
    refundsTotal: body.refunds_total,
    currencyCode: body.currency_code,
  });
  res.json(result);
}
