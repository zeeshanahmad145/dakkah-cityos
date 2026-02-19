import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateCommissionRuleSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["percentage", "flat"]).optional(),
  value: z.number().min(0).optional(),
  vendor_id: z.string().optional(),
  category_id: z.string().optional(),
  product_id: z.string().optional(),
  min_order_value: z.number().min(0).optional(),
  max_order_value: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    const { data: rules } = await query.graph({
      entity: "commission_rule",
      fields: ["*", "vendor.*"],
      filters: { id }
    })
    
    if (!rules?.[0]) {
      return res.status(404).json({ message: "Commission rule not found" })
    }
    
    res.json({ commission_rule: rules[0] })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-COMMISSION-RULES-ID")}
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const commissionService = req.scope.resolve("commission") as any
  
  try {
    const parsed = updateCommissionRuleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { name, type, value, vendor_id, category_id, product_id, min_order_value, max_order_value, is_active, priority } = parsed.data
    
    if (type === "percentage" && value !== undefined && (value < 0 || value > 100)) {
      return res.status(400).json({ message: "percentage value must be between 0 and 100" })
    }
    
    const updateData: Record<string, any> = { id }
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (vendor_id !== undefined) updateData.vendor_id = vendor_id
    if (category_id !== undefined) updateData.category_id = category_id
    if (product_id !== undefined) updateData.product_id = product_id
    if (min_order_value !== undefined) updateData.min_order_value = min_order_value
    if (max_order_value !== undefined) updateData.max_order_value = max_order_value
    if (is_active !== undefined) updateData.is_active = is_active
    if (priority !== undefined) updateData.priority = priority
    
    const rule = await commissionService.updateCommissionRules(updateData)
    
    res.json({ commission_rule: rule })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-COMMISSION-RULES-ID")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const commissionService = req.scope.resolve("commission") as any
  
  try {
    await commissionService.deleteCommissionRules(id)
    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-COMMISSION-RULES-ID")}
}

