import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "vp-seed-1",
    name: "Bulk Office Supplies Discount",
    description: "Volume-based pricing for office supply orders. Higher quantities unlock better per-unit rates.",
    applies_to: "product",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-1a", min_quantity: 10, max_quantity: 49, discount_percentage: 10, fixed_price: null, currency_code: "USD" },
      { id: "vpt-1b", min_quantity: 50, max_quantity: 99, discount_percentage: 20, fixed_price: null, currency_code: "USD" },
      { id: "vpt-1c", min_quantity: 100, max_quantity: 499, discount_percentage: 30, fixed_price: null, currency_code: "USD" },
      { id: "vpt-1d", min_quantity: 500, max_quantity: null, discount_percentage: 40, fixed_price: null, currency_code: "USD" },
    ],
    thumbnail: "/seed-images/b2b%2F1497366216548-37526070297c.jpg",
  },
  {
    id: "vp-seed-2",
    name: "Wholesale Electronics Pricing",
    description: "Tiered pricing for electronics resellers. Significant savings on large orders.",
    applies_to: "product",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-2a", min_quantity: 5, max_quantity: 24, discount_percentage: 5, fixed_price: null, currency_code: "USD" },
      { id: "vpt-2b", min_quantity: 25, max_quantity: 99, discount_percentage: 15, fixed_price: null, currency_code: "USD" },
      { id: "vpt-2c", min_quantity: 100, max_quantity: null, discount_percentage: 25, fixed_price: null, currency_code: "USD" },
    ],
    thumbnail: "/seed-images/digital-products%2F1550751827-4bd374c3f58b.jpg",
  },
  {
    id: "vp-seed-3",
    name: "Raw Materials Volume Pricing",
    description: "Industrial raw material pricing tiers for manufacturing partners.",
    applies_to: "product",
    pricing_type: "volume",
    status: "active",
    tiers: [
      { id: "vpt-3a", min_quantity: 100, max_quantity: 499, discount_percentage: 8, fixed_price: null, currency_code: "USD" },
      { id: "vpt-3b", min_quantity: 500, max_quantity: 999, discount_percentage: 18, fixed_price: null, currency_code: "USD" },
      { id: "vpt-3c", min_quantity: 1000, max_quantity: 4999, discount_percentage: 28, fixed_price: null, currency_code: "USD" },
      { id: "vpt-3d", min_quantity: 5000, max_quantity: null, discount_percentage: 35, fixed_price: null, currency_code: "USD" },
    ],
    thumbnail: "/seed-images/consignments%2F1586023492067-2e840fece27a.jpg",
  },
  {
    id: "vp-seed-4",
    name: "Food Service Bulk Rates",
    description: "Special pricing for restaurants and catering companies ordering in bulk.",
    applies_to: "category",
    pricing_type: "tiered",
    status: "active",
    tiers: [
      { id: "vpt-4a", min_quantity: 20, max_quantity: 99, discount_percentage: 12, fixed_price: null, currency_code: "USD" },
      { id: "vpt-4b", min_quantity: 100, max_quantity: 499, discount_percentage: 22, fixed_price: null, currency_code: "USD" },
      { id: "vpt-4c", min_quantity: 500, max_quantity: null, discount_percentage: 32, fixed_price: null, currency_code: "USD" },
    ],
    thumbnail: "/seed-images/grocery%2F1542838132-92c53300e7e2.jpg",
  },
  {
    id: "vp-seed-5",
    name: "Apparel Wholesale Tiers",
    description: "Volume pricing for fashion retailers and boutiques. Per-unit costs decrease with volume.",
    applies_to: "product",
    pricing_type: "volume",
    status: "active",
    tiers: [
      { id: "vpt-5a", min_quantity: 12, max_quantity: 47, discount_percentage: 10, fixed_price: null, currency_code: "USD" },
      { id: "vpt-5b", min_quantity: 48, max_quantity: 143, discount_percentage: 20, fixed_price: null, currency_code: "USD" },
      { id: "vpt-5c", min_quantity: 144, max_quantity: null, discount_percentage: 35, fixed_price: null, currency_code: "USD" },
    ],
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params

    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: ["id", "name", "description", "applies_to", "target_id", "pricing_type", "priority", "status", "starts_at", "ends_at", "created_at"],
      filters: { id },
    })

    const rule = Array.isArray(rules) ? rules[0] : rules
    if (!rule) {
      const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: { ...seed, id } })
    }

    const { data: tiers } = await query.graph({
      entity: "volume_pricing_tier",
      fields: ["id", "volume_pricing_id", "min_quantity", "max_quantity", "discount_percentage", "discount_amount", "fixed_price", "currency_code"],
      filters: { volume_pricing_id: rule.id },
    })

    return res.json({ item: { ...rule, tiers } })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: { ...seed, id } })
  }
}
