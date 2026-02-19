// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateVolumePricingSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  applies_to: z.string().optional(),
  target_id: z.string().optional(),
  pricing_type: z.string().optional(),
  company_id: z.string().optional(),
  company_tier: z.string().optional(),
  priority: z.number().optional(),
  status: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  tiers: z.array(z.object({
    id: z.string().optional(),
    min_quantity: z.number(),
    max_quantity: z.number().optional(),
    discount_percentage: z.number().optional(),
    discount_amount: z.number().optional(),
    fixed_price: z.number().optional(),
    currency_code: z.string().optional(),
  }).passthrough()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// GET /admin/volume-pricing/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params
  
    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: ["*"],
      filters: { id },
    })
  
    if (!rules.length) {
      return res.status(404).json({ message: "Volume pricing rule not found" })
    }
  
    const rule = rules[0]
  
    // Fetch tiers
    const { data: tiers } = await query.graph({
      entity: "volume_pricing_tier",
      fields: ["*"],
      filters: { volume_pricing_id: id },
    })
  
    res.json({ rule: { ...rule, tiers } })

  } catch (error: any) {
    handleApiError(res, error, "GET admin volume-pricing id")}
}

// PUT /admin/volume-pricing/:id
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const volumePricingModule = req.scope.resolve("volumePricing")
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params
  
    const parsed = updateVolumePricingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const {
      name,
      description,
      applies_to,
      target_id,
      pricing_type,
      company_id,
      company_tier,
      priority,
      status,
      starts_at,
      ends_at,
      tiers,
      metadata,
    } = parsed.data
  
    // Update rule
    const updateData: Record<string, unknown> = { id }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (applies_to !== undefined) updateData.applies_to = applies_to
    if (target_id !== undefined) updateData.target_id = target_id
    if (pricing_type !== undefined) updateData.pricing_type = pricing_type
    if (company_id !== undefined) updateData.company_id = company_id
    if (company_tier !== undefined) updateData.company_tier = company_tier
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (starts_at !== undefined) updateData.starts_at = starts_at ? new Date(starts_at) : null
    if (ends_at !== undefined) updateData.ends_at = ends_at ? new Date(ends_at) : null
    if (metadata !== undefined) updateData.metadata = metadata
  
    const rule = await volumePricingModule.updateVolumePricings(updateData)
  
    // Update tiers if provided
    if (tiers) {
      // Delete existing tiers
      const { data: existingTiers } = await query.graph({
        entity: "volume_pricing_tier",
        fields: ["id"],
        filters: { volume_pricing_id: id },
      })
    
      for (const tier of existingTiers) {
        await volumePricingModule.deleteVolumePricingTiers(tier.id)
      }
    
      // Create new tiers
      for (const tier of tiers) {
        await volumePricingModule.createVolumePricingTiers({
          volume_pricing_id: id,
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          discount_percentage: tier.discount_percentage,
          discount_amount: tier.discount_amount,
          fixed_price: tier.fixed_price,
          currency_code: tier.currency_code || "usd",
        })
      }
    }
  
    // Fetch updated tiers
    const { data: updatedTiers } = await query.graph({
      entity: "volume_pricing_tier",
      fields: ["*"],
      filters: { volume_pricing_id: id },
    })
  
    res.json({ rule: { ...rule, tiers: updatedTiers } })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin volume-pricing id")}
}

// DELETE /admin/volume-pricing/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const volumePricingModule = req.scope.resolve("volumePricing")
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params
  
    // Delete tiers first
    const { data: tiers } = await query.graph({
      entity: "volume_pricing_tier",
      fields: ["id"],
      filters: { volume_pricing_id: id },
    })
  
    for (const tier of tiers) {
      await volumePricingModule.deleteVolumePricingTiers(tier.id)
    }
  
    // Delete rule
    await volumePricingModule.deleteVolumePricings(id)
  
    res.json({ success: true })

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin volume-pricing id")}
}

