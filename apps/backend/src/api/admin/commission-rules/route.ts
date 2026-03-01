import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { apiLogger } from "../../../lib/logger"
import { paginationSchema, formatZodErrors } from "../../../lib/validation"
import { handleApiError } from "../../../lib/api-error-handler"

const logger = apiLogger

const createCommissionRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["percentage", "flat"]).default("percentage"),
  value: z.number().min(0, "Value must be non-negative"),
  vendor_id: z.string().optional(),
  category_id: z.string().optional(),
  product_id: z.string().optional(),
  min_order_value: z.number().min(0).optional(),
  max_order_value: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
  priority: z.number().int().default(0),
}).passthrough().refine(
  (data) => {
    if (data.type === "percentage") {
      return data.value <= 100
    }
    return true
  },
  { message: "Percentage value must be between 0 and 100", path: ["value"] }
)

const querySchema = paginationSchema.extend({
  vendor_id: z.string().optional(),
  is_active: z.string().transform(v => v === "true").optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as any
  
  try {
    const parseResult = querySchema.safeParse(req.query)
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: formatZodErrors(parseResult.error)
      })
    }
    
    const { limit, offset, vendor_id, is_active } = parseResult.data
    
    const filters: Record<string, unknown> = {}
    if (vendor_id) filters.vendor_id = vendor_id
    if (is_active !== undefined) filters.is_active = is_active
    
    const { data: rules, metadata } = await query.graph({
      entity: "commission_rule",
      fields: ["*", "vendor.*"],
      filters,
      pagination: {
        skip: offset,
        take: limit
      }
    })
    
    res.json({
      commission_rules: rules,
      count: metadata?.count || rules.length,
      limit,
      offset
    })
  } catch (error: unknown) {
    logger.error("Failed to fetch commission rules", error)
    handleApiError(res, error, "ADMIN-COMMISSION-RULES")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const commissionService = req.scope.resolve("commission") as unknown as any
  
  try {
    const parseResult = createCommissionRuleSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: formatZodErrors(parseResult.error)
      })
    }
    
    const rule = await commissionService.createCommissions(parseResult.data)
    
    logger.info("Commission rule created", { ruleId: rule.id })
    res.status(201).json({ commission_rule: rule })
  } catch (error: unknown) {
    logger.error("Failed to create commission rule", error)
    handleApiError(res, error, "ADMIN-COMMISSION-RULES")}
}

