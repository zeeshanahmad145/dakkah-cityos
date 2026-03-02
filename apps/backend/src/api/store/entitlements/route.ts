import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../../../modules/entitlements";
import type EntitlementsModuleService from "../../../modules/entitlements/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { resource_type, resource_id } = req.query as Record<string, string>;

  if (!resource_type) {
    return res
      .status(400)
      .json({ entitled: false, error: "resource_type is required" });
  }

  // Get customer from session
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res
      .status(401)
      .json({ entitled: false, error: "Not authenticated" });
  }

  const entitlementsService: EntitlementsModuleService =
    req.scope.resolve(ENTITLEMENTS_MODULE);

  try {
    const result = await entitlementsService.check(
      customerId,
      resource_type,
      resource_id,
    );
    res.json(result);
  } catch {
    res
      .status(500)
      .json({ entitled: false, error: "Failed to check entitlement" });
  }
}
