import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../../lib/api-error-handler"

const updateSpendingLimitSchema = z.object({
  user_id: z.string(),
  spending_limit: z.number().optional(),
  can_approve: z.boolean().optional(),
}).passthrough()

// Get spending limits for company users
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
    const { id } = req.params
  
    const { data: [company] } = await query.graph({
      entity: "company",
      fields: [
        "id",
        "name",
        "auto_approve_limit",
        "requires_approval",
      ],
      filters: { id },
    })
  
    if (!company) {
      return res.status(404).json({ message: "Company not found" })
    }
  
    // Get company users with their spending limits
    const { data: users } = await query.graph({
      entity: "company_user",
      fields: ["*"],
      filters: { company_id: id },
    })
  
    res.json({
      company_id: id,
      company_auto_approve_limit: company.auto_approve_limit,
      requires_approval: company.requires_approval,
      users: users.map((user: any) => ({
        id: user.id,
        customer_id: user.customer_id,
        role: user.role,
        spending_limit: user.spending_limit,
        can_approve: user.can_approve,
      })),
    })

  } catch (error: any) {
    handleApiError(res, error, "GET admin companies id spending-limits")}
}

// Update spending limit for a user
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModuleService = req.scope.resolve("companyModuleService") as any
    const { id } = req.params
    const parsed = updateSpendingLimitSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }
    const { user_id, spending_limit, can_approve } = parsed.data
  
    const updateData: Record<string, any> = { id: user_id }
    if (spending_limit !== undefined) updateData.spending_limit = spending_limit.toString()
    if (can_approve !== undefined) updateData.can_approve = can_approve
  
    const user = await companyModuleService.updateCompanyUsers(updateData)
  
    res.json({ user })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin companies id spending-limits")}
}

