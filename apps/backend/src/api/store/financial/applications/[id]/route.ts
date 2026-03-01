import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../../lib/api-error-handler";
import { enrichDetailItem } from "../../../../../lib/detail-enricher";

/**
 * GET   /store/financial/applications/:id  — get application status + repayment schedule
 * PATCH /store/financial/applications/:id  — withdraw application
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const financialService = req.scope.resolve("financialProduct") as unknown as any;
    const customerId = req.auth_context?.actor_id;
    const applicationId = req.params.id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application =
      await financialService.retrieveLoanApplication(applicationId);

    // Ownership check
    if (application.customer_id && application.customer_id !== customerId) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this application" });
    }

    // Assessment and optional repayment schedule for approved apps
    const assessment = await financialService.assessApplication(applicationId);
    let repaymentSchedule = null;

    if (
      application.status === "approved" &&
      application.amount &&
      application.term_months
    ) {
      try {
        const product = await financialService.retrieveLoanProduct(
          application.product_id,
        );
        repaymentSchedule = financialService.calculateRepaymentSchedule(
          Number(application.amount),
          Number(product.interest_rate || 8),
          Number(application.term_months),
        );
      } catch {
        // Optional — skip if product not found
      }
    }

    return res.json({
      application: enrichDetailItem(application, "financial-products"),
      assessment,
      repaymentSchedule,
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-APPLICATION-GET");
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
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

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending applications can be withdrawn" });
    }

    const updated = await financialService.rejectApplication(
      applicationId,
      "Withdrawn by customer",
    );

    return res.json({ application: updated, message: "Application withdrawn" });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-FINANCIAL-APPLICATION-PATCH");
  }
}
