// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const assignCompaniesSchema = z.object({
  company_ids: z.array(z.string()),
}).passthrough()

// POST - Assign companies to pricing tier
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const parsed = assignCompaniesSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const { company_ids } = parsed.data

    const companyService = req.scope.resolve("companyModuleService")

    // Update companies to use this tier
    for (const companyId of company_ids) {
      await companyService.updateCompanies({
        selector: { id: companyId },
        data: { pricing_tier_id: id }
      })
    }

    res.json({
      message: `Assigned ${company_ids.length} companies to tier`,
      tier_id: id,
      company_ids
    })

  } catch (error: any) {
    handleApiError(res, error, "POST admin pricing-tiers id companies")}
}

// DELETE - Remove companies from pricing tier
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { company_ids } = req.body as { company_ids: string[] }

    const companyService = req.scope.resolve("companyModuleService")

    // Remove tier from companies
    for (const companyId of company_ids) {
      await companyService.updateCompanies({
        selector: { id: companyId },
        data: { pricing_tier_id: null }
      })
    }

    res.json({
      message: `Removed ${company_ids.length} companies from tier`,
      tier_id: id,
      company_ids
    })

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin pricing-tiers id companies")}
}

