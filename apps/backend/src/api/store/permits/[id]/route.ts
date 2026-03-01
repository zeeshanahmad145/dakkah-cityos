import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../lib/detail-enricher";

/**
 * GET /store/permits/:id  — get permit status and decision
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const governmentService = req.scope.resolve("government") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const permitId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const permit = await governmentService.retrievePermit(permitId);

    // Ownership check
    if (permit.applicant_id && permit.applicant_id !== customerId) {
      return res
        .status(403)
        .json({ error: "This permit does not belong to you" });
    }

    return res.json({ permit: enrichDetailItem(permit, "government") });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-PERMIT-GET");
  }
}
