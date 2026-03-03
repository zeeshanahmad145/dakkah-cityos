import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { IDENTITY_GATE_MODULE } from "../../../../modules/identity-gate";
import type IdentityGateModuleService from "../../../../modules/identity-gate/service";

/**
 * POST /store/identity/verify-checkout
 *
 * Call before checkout when cart contains restricted product types.
 * Body: {
 *   customer_id: string
 *   product_types: string[]        // e.g. ["alcohol", "financial"]
 *   verified_credentials?: string[] // already-known credentials (from session)
 *   vp_jwt?: string                 // walt.id Verifiable Presentation JWT
 * }
 *
 * Returns:
 *   { allowed: true, warnings: [] }           → proceed to checkout
 *   { allowed: false, violations: [], warnings: [] } → blocked
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const identityGateService = req.scope.resolve(
    IDENTITY_GATE_MODULE,
  ) as unknown as IdentityGateModuleService;

  const body = req.body as {
    customer_id: string;
    product_types?: string[];
    verified_credentials?: string[];
    vp_jwt?: string;
  };

  if (!body.customer_id) {
    return res.status(400).json({ error: "customer_id is required" });
  }

  const productTypes = body.product_types ?? [];
  if (productTypes.length === 0) {
    return res.json({ allowed: true, violations: [], warnings: [] });
  }

  const result = await identityGateService.checkRequirements(
    body.customer_id,
    productTypes,
    {
      verified_credentials: body.verified_credentials ?? [],
      vp_jwt: body.vp_jwt,
    },
  );

  res.status(result.allowed ? 200 : 403).json(result);
}
