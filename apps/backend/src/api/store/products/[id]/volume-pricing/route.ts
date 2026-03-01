import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../lib/api-error-handler"

// GET - Get volume pricing tiers for a product
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    const { variant_id, customer_group_id } = req.query as {
      variant_id?: string
      customer_group_id?: string
    }

    const query = req.scope.resolve("query") as unknown as any

    // Build filters
    const filters: Record<string, any> = {
      $or: [
        { product_id: id },
        { variant_id: variant_id }
      ],
      status: "active"
    }

    // Get volume pricing rules
    const { data: pricingRules } = await query.graph({
      entity: "volume_pricing",
      fields: [
        "id",
        "product_id",
        "variant_id",
        "collection_id",
        "customer_group_id",
        "currency_code",
        "valid_from",
        "valid_until",
        "tiers.id",
        "tiers.min_quantity",
        "tiers.max_quantity",
        "tiers.price",
        "tiers.discount_percentage"
      ],
      filters
    })

    // Filter by validity dates
    const now = new Date()
    const validRules = pricingRules.filter((rule: any) => {
      const validFrom = rule.valid_from ? new Date(rule.valid_from) : null
      const validUntil = rule.valid_until ? new Date(rule.valid_until) : null
    
      if (validFrom && now < validFrom) return false
      if (validUntil && now > validUntil) return false
    
      // Filter by customer group if specified
      if (customer_group_id && rule.customer_group_id && rule.customer_group_id !== customer_group_id) {
        return false
      }
    
      return true
    })

    // Get the most specific rule (variant > product > collection)
    let applicableRule = validRules.find((r: any) => r.variant_id === variant_id) ||
                         validRules.find((r: any) => r.product_id === id && !r.variant_id) ||
                         validRules[0]

    if (!applicableRule) {
      return res.json({
        product_id: id,
        has_volume_pricing: false,
        tiers: []
      })
    }

    // Sort tiers by min_quantity
    const sortedTiers = (applicableRule.tiers || [])
      .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
      .map((tier: any) => ({
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        price: tier.price,
        discount_percentage: tier.discount_percentage,
        savings_message: tier.discount_percentage 
          ? `Save ${tier.discount_percentage}%`
          : null
      }))

    res.json({
      product_id: id,
      variant_id: applicableRule.variant_id,
      has_volume_pricing: true,
      currency_code: applicableRule.currency_code || "usd",
      tiers: sortedTiers
    })

  } catch (error: unknown) {
    handleApiError(res, error, "GET store products id volume-pricing")}
}

