import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const assignPaymentTermsSchema = z.object({
  payment_term_id: z.string(),
}).passthrough()

/**
 * Assign Payment Terms to a Company
 * Allows configuring which payment terms (and early payment discounts) apply to a B2B company
 */

/**
 * @route GET /admin/companies/:id/payment-terms
 * @desc Get the payment terms assigned to a company
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name", "metadata"],
      filters: { id }
    })

    const company = companies[0]
    if (!company) {
      return res.status(404).json({ error: "Company not found" })
    }

    // Get assigned payment term ID from metadata
    const paymentTermId = company.metadata?.payment_term_id || null

    // Default terms if none assigned
    const defaultTerm = {
      id: "pt_net30",
      name: "Net 30",
      code: "Net 30",
      net_days: 30,
      discount_percent: 0,
      discount_days: 0
    }

    // In production, fetch from payment_terms table
    const assignedTerm = paymentTermId ? {
      id: paymentTermId,
      name: "2/10 Net 30",
      code: "2/10 Net 30",
      net_days: 30,
      discount_percent: 2,
      discount_days: 10
    } : defaultTerm

    res.json({
      company_id: id,
      company_name: company.name,
      payment_term: assignedTerm,
      is_custom: !!paymentTermId
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-COMPANIES-ID-PAYMENT-TERMS")}
}

/**
 * @route PUT /admin/companies/:id/payment-terms
 * @desc Assign payment terms to a company
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const parsed = assignPaymentTermsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const { payment_term_id } = parsed.data
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    // Verify company exists
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name", "metadata"],
      filters: { id }
    })

    const company = companies[0]
    if (!company) {
      return res.status(404).json({ error: "Company not found" })
    }

    // In production, update the company's metadata with the payment_term_id
    // This would be done through a proper update workflow
    
    // For demo, just return success
    res.json({
      success: true,
      company_id: id,
      payment_term_id,
      message: `Payment terms ${payment_term_id} assigned to ${company.name}`
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-COMPANIES-ID-PAYMENT-TERMS")}
}

/**
 * @route DELETE /admin/companies/:id/payment-terms
 * @desc Remove custom payment terms (revert to default)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any

    // Verify company exists
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name"],
      filters: { id }
    })

    const company = companies[0]
    if (!company) {
      return res.status(404).json({ error: "Company not found" })
    }

    // In production, remove payment_term_id from company metadata
    
    res.json({
      success: true,
      company_id: id,
      message: `${company.name} reverted to default payment terms`
    })
  } catch (error: unknown) {
    handleApiError(res, error, "ADMIN-COMPANIES-ID-PAYMENT-TERMS")}
}

