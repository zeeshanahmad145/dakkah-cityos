import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ENTITLEMENTS_MODULE } from "../../../../modules/entitlements";
import type EntitlementsModuleService from "../../../../modules/entitlements/service";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    event_id,
    facility_id,
    customer_id: bodyCustomerId,
    ticket_id,
  } = req.body as any;

  const resourceId = event_id ?? facility_id;
  const resourceType = event_id ? "event_ticket" : "facility_access";

  if (!resourceId) {
    return res
      .status(400)
      .json({ admitted: false, error: "event_id or facility_id is required" });
  }

  const customerId = bodyCustomerId ?? (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res
      .status(401)
      .json({ admitted: false, error: "Not authenticated" });
  }

  const entitlementsService: EntitlementsModuleService =
    req.scope.resolve(ENTITLEMENTS_MODULE);

  try {
    const result = await entitlementsService.check(
      customerId,
      resourceType,
      resourceId,
    );

    if (!result.entitled) {
      return res
        .status(403)
        .json({
          admitted: false,
          reason: result.inGrace ? "grace_expired" : "no_entitlement",
        });
    }

    // Mark as checked in
    const entitlements = (await entitlementsService.listEntitlements({
      customer_id: customerId,
      resource_type: resourceType,
      resource_id: resourceId,
      status: "active",
    })) as any[];

    if (entitlements.length > 0) {
      const ent = entitlements[0];

      // Check max_uses
      if (ent.max_uses != null && (ent.uses_remaining ?? ent.max_uses) <= 0) {
        return res
          .status(403)
          .json({ admitted: false, reason: "uses_exhausted" });
      }

      await entitlementsService.updateEntitlements({
        id: ent.id,
        checked_in_at: new Date(),
        ...(ent.max_uses != null
          ? {
              uses_remaining: Math.max(
                0,
                (ent.uses_remaining ?? ent.max_uses) - 1,
              ),
            }
          : {}),
      } as any);
    }

    res.json({
      admitted: true,
      customer_id: customerId,
      resource_id: resourceId,
      ticket_id: ticket_id ?? null,
    });
  } catch {
    res
      .status(500)
      .json({ admitted: false, error: "Check-in validation failed" });
  }
}
