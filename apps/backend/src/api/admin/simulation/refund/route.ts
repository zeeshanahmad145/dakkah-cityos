import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SIMULATION_MODULE } from "../../../../modules/simulation";
import type SimulationModuleService from "../../../../modules/simulation/service";

/**
 * POST /admin/simulation/refund
 *
 * Simulates the full financial impact of a refund WITHOUT changing the database.
 *
 * Body: { order_id, refund_amount, currency_code? }
 * Returns: SimulationResult { preview: { line_items, totals }, warnings, confidence }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const sim = req.scope.resolve(
    SIMULATION_MODULE,
  ) as unknown as SimulationModuleService;
  const body = req.body as {
    order_id: string;
    refund_amount: number;
    currency_code?: string;
  };
  const result = await sim.simulateRefund({
    orderId: body.order_id,
    refundAmount: body.refund_amount,
    currencyCode: body.currency_code,
  });
  res.json(result);
}
