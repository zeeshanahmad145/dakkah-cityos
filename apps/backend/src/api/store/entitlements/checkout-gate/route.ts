import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../../../../modules/entitlements";
import type EntitlementsModuleService from "../../../../modules/entitlements/service";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    product_id,
    customer_id: bodyCustomerId,
    resource_type,
  } = req.body as any;

  if (!product_id || !resource_type) {
    return res
      .status(400)
      .json({
        allowed: false,
        error: "product_id and resource_type are required",
      });
  }

  const customerId = bodyCustomerId ?? (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ allowed: false, error: "Not authenticated" });
  }

  const entitlementsService: EntitlementsModuleService =
    req.scope.resolve(ENTITLEMENTS_MODULE);

  try {
    const result = await entitlementsService.check(
      customerId,
      resource_type,
      product_id,
    );
    res.json({
      allowed: result.entitled,
      entitled: result.entitled,
      in_grace: result.inGrace ?? false,
      expires_at: result.expiresAt ?? null,
      required_entitlement_type: resource_type,
    });
  } catch {
    res.status(500).json({ allowed: false, error: "Entitlement check failed" });
  }
}
