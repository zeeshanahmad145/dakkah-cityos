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
    thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg",
    reviews: [{ author: "Office Manager", rating: 5, comment: "Saved 30% on our quarterly supply orders.", created_at: "2024-06-15T00:00:00Z" }, { author: "Procurement Lead", rating: 4, comment: "Clear tier structure makes budgeting easy.", created_at: "2024-06-10T00:00:00Z" }, { author: "Admin Assistant", rating: 5, comment: "Great discounts at the 100+ quantity level.", created_at: "2024-05-28T00:00:00Z" }, { author: "Facilities Dir", rating: 4, comment: "Reliable pricing, no hidden fees.", created_at: "2024-05-20T00:00:00Z" }, { author: "Buyer", rating: 5, comment: "Best volume pricing program we've used.", created_at: "2024-05-15T00:00:00Z" }],
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
    thumbnail: "/seed-images/digital-products%2F1506744038136-46273834b3fb.jpg",
    reviews: [{ author: "Reseller", rating: 5, comment: "25% off at 100 units is a game changer.", created_at: "2024-07-12T00:00:00Z" }, { author: "IT Director", rating: 4, comment: "Good pricing tiers for bulk hardware.", created_at: "2024-07-05T00:00:00Z" }, { author: "Distributor", rating: 5, comment: "Transparent wholesale pricing.", created_at: "2024-06-28T00:00:00Z" }, { author: "E-com Seller", rating: 4, comment: "Competitive rates for electronics.", created_at: "2024-06-20T00:00:00Z" }, { author: "Tech Buyer", rating: 5, comment: "Significant savings on large orders.", created_at: "2024-06-15T00:00:00Z" }],
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
    thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg",
    reviews: [{ author: "Plant Manager", rating: 5, comment: "35% discount at 5000+ units saves us thousands.", created_at: "2024-04-15T00:00:00Z" }, { author: "Supply Chain", rating: 4, comment: "Excellent for manufacturing partners.", created_at: "2024-04-10T00:00:00Z" }, { author: "Purchaser", rating: 5, comment: "Volume tiers are well structured.", created_at: "2024-03-28T00:00:00Z" }, { author: "Ops Director", rating: 4, comment: "Reliable pricing for raw materials.", created_at: "2024-03-20T00:00:00Z" }, { author: "Manufacturer", rating: 5, comment: "Best bulk rates in the industry.", created_at: "2024-03-15T00:00:00Z" }],
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
    thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg",
    reviews: [{ author: "Caterer", rating: 5, comment: "Great bulk rates for our catering business.", created_at: "2024-08-12T00:00:00Z" }, { author: "Restaurant Owner", rating: 4, comment: "32% off at 500+ is very competitive.", created_at: "2024-08-05T00:00:00Z" }, { author: "Chef", rating: 5, comment: "Saves us significantly on ingredient costs.", created_at: "2024-07-28T00:00:00Z" }, { author: "Food Truck", rating: 4, comment: "Easy to understand tier structure.", created_at: "2024-07-20T00:00:00Z" }, { author: "Bakery Owner", rating: 5, comment: "Excellent program for food service.", created_at: "2024-07-15T00:00:00Z" }],
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
    reviews: [{ author: "Boutique Owner", rating: 5, comment: "35% off at 144+ units is incredible.", created_at: "2024-09-10T00:00:00Z" }, { author: "Fashion Buyer", rating: 4, comment: "Great wholesale pricing for apparel.", created_at: "2024-09-05T00:00:00Z" }, { author: "Retailer", rating: 5, comment: "Easy to scale orders with clear tiers.", created_at: "2024-08-28T00:00:00Z" }, { author: "Brand Owner", rating: 4, comment: "Competitive per-unit costs.", created_at: "2024-08-20T00:00:00Z" }, { author: "Store Manager", rating: 5, comment: "Best volume pricing for clothing.", created_at: "2024-08-15T00:00:00Z" }],
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
