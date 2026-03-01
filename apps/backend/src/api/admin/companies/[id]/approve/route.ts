import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";

const approveCompanySchema = z
  .object({
    credit_limit: z.string().optional(),
    payment_terms_days: z.number().optional(),
  })
  .passthrough();

/**
 * POST /admin/companies/:id/approve
 * Approve a pending company application
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyService = req.scope.resolve("company") as unknown as any;
    const { id } = req.params;
    const adminUserId = req.auth_context?.actor_id;

    const parsed = approveCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    // Get company
    const company = await companyService.retrieveCompany(id);

    if (company.status !== "pending") {
      return res.status(400).json({
        error: "Company must be in pending status to approve",
      });
    }

    // Approve company
    const updated = await companyService.updateCompanies({
      id,
      status: "active",
      approved_at: new Date(),
      approved_by: adminUserId,
      credit_limit: parsed.data.credit_limit || company.credit_limit,
      payment_terms_days:
        parsed.data.payment_terms_days || company.payment_terms_days,
    });

    res.json({ company: updated });
  } catch (error: unknown) {
    handleApiError(res, error, "POST admin companies id approve");
  }
}
