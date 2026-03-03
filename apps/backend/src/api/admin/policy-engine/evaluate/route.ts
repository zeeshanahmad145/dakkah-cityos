import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { POLICY_ENGINE_MODULE } from "../../../../modules/policy-engine";
import type PolicyEngineModuleService from "../../../../modules/policy-engine/service";

/**
 * POST /admin/policy-engine/evaluate
 *
 * Evaluate active policy rules for a given offer + actor + context.
 * Returns: { granted, decisions, reasoning_chain, modified_price, levies, required_credentials }
 *
 * Body:
 * {
 *   offer: { id, offer_type, base_price, source_module }
 *   customer: { id, credentials: ["kyc_verified","age_21"], type: "customer" }
 *   context: { ip_country, jurisdiction, node_id }
 *   actor: { type: "customer", id }
 *   dry_run?: boolean
 * }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const policyService = req.scope.resolve(
    POLICY_ENGINE_MODULE,
  ) as unknown as PolicyEngineModuleService;

  const body = req.body as {
    offer?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    cart?: Record<string, unknown>;
    context?: Record<string, unknown>;
    actor?: Record<string, unknown>;
    dry_run?: boolean;
  };

  const result = await policyService.evaluate(
    {
      offer: body.offer as any,
      customer: body.customer as any,
      cart: body.cart as any,
      context: body.context as any,
      actor: body.actor as any,
    },
    { dryRun: body.dry_run ?? false },
  );

  res.json(result);
}
