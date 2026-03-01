import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../../lib/api-error-handler";

/**
 * POST /store/financial/applications/:id/kyc
 * Submit KYC documents for an application (stub — marks kyc_status as 'pending').
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialService = req.scope.resolve("financialProduct") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const applicationId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application =
      await financialService.retrieveLoanApplication(applicationId);
    if (application.customer_id !== customerId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { document_type, document_url } = req.body as {
      document_type: string;
      document_url?: string;
    };

    if (!document_type) {
      return res.status(400).json({ error: "document_type is required" });
    }

    // KYC documents stub — in production this would forward to a KYC provider (Jumio, Onfido, etc.)
    const updated = await financialService.updateLoanApplications({
      id: applicationId,
      kyc_status: "pending",
      kyc_document_type: document_type,
      kyc_submitted_at: new Date(),
      kyc_document_url: document_url || null,
    });

    return res.status(202).json({
      message:
        "KYC documents submitted. Review typically takes 1-3 business days.",
      kyc_status: "pending",
      application_id: applicationId,
      application: updated,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-APPLICATION-KYC");
  }
}
