import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ECONOMIC_HEALTH_MODULE } from "../../../modules/economic-health";
import type EconomicHealthModuleService from "../../../modules/economic-health/service";

/**
 * GET /admin/economic-health
 *
 * Returns the full 7-metric economic health graph for the platform.
 * All metrics are computed in parallel from existing module data (read-only).
 *
 * Response: EconomicHealthGraph {
 *   computed_at, liquidity_exposure, refund_risk_index,
 *   settlement_backlog, subscription_liability,
 *   vendor_payout_exposure, credit_outstanding_risk, chargeback_rate
 * }
 *
 * Each metric has a status field: "healthy" | "elevated" | "critical"
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const healthService = req.scope.resolve(
    ECONOMIC_HEALTH_MODULE,
  ) as unknown as EconomicHealthModuleService;
  const graph = await healthService.computeHealthGraph();
  res.json(graph);
}
