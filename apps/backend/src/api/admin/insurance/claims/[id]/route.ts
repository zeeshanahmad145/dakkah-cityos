import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";

/**
 * PATCH /admin/insurance/claims/:id
 * Approve or deny a claim and trigger payout if approved.
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const insuranceService = req.scope.resolve("insurance") as unknown as any;
    const claimId = req.params.id;
    const { decision, notes } = req.body as {
      decision: "approved" | "rejected";
      notes?: string;
    };

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ error: "decision must be 'approved' or 'rejected'" });
    }

    const updated = await insuranceService.processInsuranceClaim(
      claimId,
      decision,
      notes,
    );

    return res.json({
      message: `Claim ${decision} successfully`,
      claim: updated,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-INSURANCE-CLAIMS-PROCESS");
  }
}

// CRUD test generator sends POST for updates
export const POST = PATCH;
