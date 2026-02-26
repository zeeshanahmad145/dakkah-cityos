import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_RULES = [
  {
    id: "vp-seed-1",
    thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg",
    name: "Bulk Office Supplies Discount",
    description: "Volume-based pricing for office supply orders.",
    applies_to: "product",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-1a", min_quantity: 10, max_quantity: 49, discount_percentage: 10 },
      { id: "vpt-1b", min_quantity: 50, max_quantity: 99, discount_percentage: 20 },
      { id: "vpt-1c", min_quantity: 100, max_quantity: null, discount_percentage: 30 },
    ],
  },
  {
    id: "vp-seed-2",
    thumbnail: "/seed-images/b2b/1551288049-bebda4e38f71.jpg",
    name: "Wholesale Electronics Pricing",
    description: "Tiered pricing for electronics resellers.",
    applies_to: "product",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-2a", min_quantity: 5, max_quantity: 24, discount_percentage: 5 },
      { id: "vpt-2b", min_quantity: 25, max_quantity: 99, discount_percentage: 15 },
      { id: "vpt-2c", min_quantity: 100, max_quantity: null, discount_percentage: 25 },
    ],
  },
  {
    id: "vp-seed-3",
    thumbnail: "/seed-images/b2b/1519494026892-80bbd2d6fd0d.jpg",
    name: "Raw Materials Volume Pricing",
    description: "Industrial raw material pricing tiers.",
    applies_to: "product",
    pricing_type: "volume",
    status: "active",
    tiers: [
      { id: "vpt-3a", min_quantity: 100, max_quantity: 499, discount_percentage: 8 },
      { id: "vpt-3b", min_quantity: 500, max_quantity: 999, discount_percentage: 18 },
      { id: "vpt-3c", min_quantity: 1000, max_quantity: null, discount_percentage: 28 },
    ],
  },
  {
    id: "vp-seed-4",
    thumbnail: "/seed-images/b2b/1606787366850-de6330128bfc.jpg",
    name: "Food Service Bulk Rates",
    description: "Special pricing for restaurants and catering companies.",
    applies_to: "category",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-4a", min_quantity: 20, max_quantity: 99, discount_percentage: 12 },
      { id: "vpt-4b", min_quantity: 100, max_quantity: null, discount_percentage: 22 },
    ],
  },
  {
    id: "vp-seed-5",
    thumbnail: "/seed-images/b2b/1497435334941-8c899ee9e8e9.jpg",
    name: "Apparel Wholesale Tiers",
    description: "Volume pricing for fashion retailers and boutiques.",
    applies_to: "product",
    pricing_type: "volume",
    status: "active",
    tiers: [
      { id: "vpt-5a", min_quantity: 12, max_quantity: 47, discount_percentage: 10 },
      { id: "vpt-5b", min_quantity: 48, max_quantity: 143, discount_percentage: 20 },
      { id: "vpt-5c", min_quantity: 144, max_quantity: null, discount_percentage: 35 },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { product_id } = req.query as Record<string, string | undefined>
    if (!product_id) {
      return res.json({ rules: SEED_RULES })
    }
    const filters: Record<string, any> = { target_id: product_id, applies_to: "product", status: "active" }
    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: ["id", "name", "description", "applies_to", "target_id", "pricing_type", "priority", "status", "starts_at", "ends_at", "created_at"],
      filters,
    })
    const enrichedRules = await Promise.all(rules.map(async (rule: Record<string, unknown>) => {
      const { data: tiers } = await query.graph({
        entity: "volume_pricing_tier",
        fields: ["id", "volume_pricing_id", "min_quantity", "max_quantity", "discount_percentage", "discount_amount", "fixed_price", "currency_code"],
        filters: { volume_pricing_id: rule.id },
      })
      return { ...rule, tiers }
    }))
    res.json({ rules: enrichedRules.length > 0 ? enrichedRules : SEED_RULES })
  } catch (error: any) {
    return res.json({ rules: SEED_RULES })
  }
}
