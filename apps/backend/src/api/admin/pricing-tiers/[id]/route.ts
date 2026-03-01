// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateTierSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  discount_percentage: z.number().optional(),
  min_order_value: z.number().optional(),
  priority: z.number().optional(),
}).passthrough()

// GET - Get pricing tier by ID
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query") as unknown as any

    const { data: tiers } = await query.graph({
      entity: "pricing_tier",
      fields: [
        "id",
        "name",
        "description",
        "discount_percentage",
        "price_list_id",
        "min_order_value",
        "priority",
        "created_at",
        "updated_at"
      ],
      filters: { id }
    })

    if (!tiers.length) {
      return res.status(404).json({ message: "Pricing tier not found" })
    }

    // Get companies in this tier
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name", "email"],
      filters: { pricing_tier_id: id }
    })

    res.json({
      tier: tiers[0],
      companies
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET admin pricing-tiers id")}
}

// PUT - Update pricing tier
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const parsed = updateTierSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const {
      name,
      description,
      discount_percentage,
      min_order_value,
      priority
    } = parsed.data

    const companyService = req.scope.resolve("companyModuleService") as unknown as any

    await companyService.updatePricingTiers({
      selector: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(discount_percentage !== undefined && { discount_percentage }),
        ...(min_order_value !== undefined && { min_order_value }),
        ...(priority !== undefined && { priority })
      }
    })

    const query = req.scope.resolve("query") as unknown as any
    const { data: tiers } = await query.graph({
      entity: "pricing_tier",
      fields: ["id", "name", "discount_percentage", "min_order_value", "priority"],
      filters: { id }
    })

    res.json({ tier: tiers[0] })

  } catch (error: unknown) {
    handleApiError(res, error, "PUT admin pricing-tiers id")}
}

// DELETE - Delete pricing tier
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const query = req.scope.resolve("query") as unknown as any

    // Check if any companies use this tier
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id"],
      filters: { pricing_tier_id: id }
    })

    if (companies.length > 0) {
      return res.status(400).json({
        message: "Cannot delete tier: companies are still assigned to it",
        company_count: companies.length
      })
    }

    const companyService = req.scope.resolve("companyModuleService") as unknown as any
    await companyService.deletePricingTiers(id)

    res.json({ message: "Pricing tier deleted", id })

  } catch (error: unknown) {
    handleApiError(res, error, "DELETE admin pricing-tiers id")}
}

