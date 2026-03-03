import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SIMULATION_MODULE } from "../../../../modules/simulation";
import type SimulationModuleService from "../../../../modules/simulation/service";

/**
 * POST /store/simulate/settlement
 *
 * Vendor payout preview. Computes net payout after commission, VAT, and refunds.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SIMULATION_MODULE,
  ) as unknown as SimulationModuleService;
  const body = req.body as {
    gross_revenue?: number;
    commission_pct?: number;
    tax_pct?: number;
    refunds_total?: number;
  };

  if (!body.gross_revenue || body.gross_revenue <= 0) {
    return res
      .status(400)
      .json({ message: "gross_revenue is required and must be positive" });
  }

  const preview = await svc.simulateSettlement({
    vendorId: req.auth_context?.actor_id ?? "preview",
    grossRevenue: body.gross_revenue,
    commissionPct: body.commission_pct ?? 15,
    taxPct: body.tax_pct ?? 15,
    refundsTotal: body.refunds_total ?? 0,
  });

  res.json(preview);
}
