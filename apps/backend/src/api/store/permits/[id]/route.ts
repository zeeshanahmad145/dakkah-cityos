import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher"

/**
 * GET /store/permits/:id  — get permit status and decision
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const governmentService = req.scope.resolve("government") as any;
    const customerId = (req as any).auth_context?.actor_id;
    const permitId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const permit = await (governmentService as any).retrievePermit(permitId);

    // Ownership check
    if (
      (permit as any).applicant_id &&
      (permit as any).applicant_id !== customerId
    ) {
      return res
        .status(403)
        .json({ error: "This permit does not belong to you" });
    }

    return res.json({ permit: enrichDetailItem(permit, "government") });
  } catch (error: any) {
    return handleApiError(res, error, "STORE-PERMIT-GET");
  }
}
