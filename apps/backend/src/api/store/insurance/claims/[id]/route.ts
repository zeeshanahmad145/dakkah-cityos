import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../../lib/detail-enricher";

/**
 * GET /store/insurance/claims/:id
 * Get claim status + decision details for the authenticated customer.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceService = req.scope.resolve("insurance") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const claimId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const claim = await insuranceService.retrieveInsClaim(claimId);

    // Verify this claim belongs to the requesting customer (via its policy)
    if (claim.policy_id) {
      const policy = await insuranceService.retrieveInsPolicy?.(
        claim.policy_id,
      );
      if (policy && policy.customer_id !== customerId) {
        return res
          .status(403)
          .json({ error: "This claim does not belong to you" });
      }
    }

    return res.json({ claim: enrichDetailItem(claim, "insurance") });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-INSURANCE-CLAIM-GET");
  }
}
