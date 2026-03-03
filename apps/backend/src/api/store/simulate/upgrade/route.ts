import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SIMULATION_MODULE } from "../../../../modules/simulation";
import type SimulationModuleService from "../../../../modules/simulation/service";

/**
 * POST /store/simulate/upgrade
 *
 * Customer-facing plan upgrade cost simulator (read-only).
 * Calculates prorated credit from current plan and net charge for new plan.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    SIMULATION_MODULE,
  ) as unknown as SimulationModuleService;
  const body = req.body as {
    from_plan_id?: string;
    to_plan_id?: string;
    from_price?: number;
    to_price?: number;
    remaining_days?: number;
    total_days?: number;
  };

  if (!body.from_price || !body.to_price || !body.remaining_days) {
    return res
      .status(400)
      .json({
        message: "from_price, to_price, and remaining_days are required",
      });
  }

  const preview = await svc.simulateUpgrade({
    customerId: req.auth_context?.actor_id ?? "preview",
    fromPlanId: body.from_plan_id ?? "current",
    toPlanId: body.to_plan_id ?? "new",
    fromPrice: body.from_price,
    toPrice: body.to_price,
    remainingDays: body.remaining_days,
    totalDays: body.total_days ?? 30,
  });

  res.json(preview);
}
