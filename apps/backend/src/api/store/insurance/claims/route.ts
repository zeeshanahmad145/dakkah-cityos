import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { insuranceClaimWorkflow } from "../../../../modules/insurance/workflows/insurance-claim";
import { handleApiError } from "../../../../lib/api-error-handler";

/**
 * POST /store/insurance/claims
 * File a new insurance claim — triggers the insurance-claim workflow.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = req.auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { policy_id, description, claim_amount } = req.body as {
      policy_id: string;
      description: string;
      claim_amount: number;
    };

    if (!policy_id || !description || !claim_amount || claim_amount <= 0) {
      return res.status(400).json({
        error: "policy_id, description, and claim_amount > 0 are required",
      });
    }

    // Run the full insurance-claim workflow (file → assess → payout)
    const { result } = await insuranceClaimWorkflow(req.scope).run({
      input: { policyId: policy_id, description, claimAmount: claim_amount },
    });

    return res.status(201).json({
      message: "Claim filed successfully",
      claim: (result as any)?.filed?.claim,
      assessment: (result as any)?.assessed,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-INSURANCE-CLAIMS-CREATE");
  }
}

