import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SIMULATION_MODULE } from "../../../../modules/simulation";
import type SimulationModuleService from "../../../../modules/simulation/service";

/**
 * POST /store/simulate/refund
 *
 * Customer-facing refund impact simulation (read-only).
 * Returns itemised breakdown of refund, commission clawback, and loyalty reversal.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SIMULATION_MODULE,
  ) as unknown as SimulationModuleService;
  const body = req.body as { order_id?: string; refund_amount?: number };

  if (!body.refund_amount || body.refund_amount <= 0) {
    return res
      .status(400)
      .json({ message: "refund_amount is required and must be positive" });
  }

  const preview = await svc.simulateRefund({
    orderId: body.order_id ?? "preview",
    refundAmount: body.refund_amount,
  });

  res.json(preview);
}
