import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "vd-seed-1",
    name: "Premium Ballpoint Pens",
    description: "Smooth-writing metal ballpoint pens with ergonomic grip. Blue ink. Ideal for corporate gifts.",
    category: "office",
    thumbnail: "/seed-images/freelance%2F1532094349884-543bc11b234d.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 15, price: 499 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 30, price: 399 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 40, price: 299 }],
    max_savings: 40,
  },
  {
    id: "vd-seed-2",
    name: "Reusable Shopping Bags",
    description: "Eco-friendly non-woven bags, full-color printing available. Perfect for retail promotions.",
    category: "retail",
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 20, price: 350 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 40, price: 250 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 57, price: 150 }],
    max_savings: 57,
  },
  {
    id: "vd-seed-3",
    name: "USB Flash Drives 32GB",
    description: "Compact USB 3.0 flash drives with custom logo area. Bulk pricing for events and conferences.",
    category: "electronics",
    thumbnail: "/seed-images/auctions%2F1526170375885-4d8ecf77b99f.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 10, price: 899 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 25, price: 699 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 45, price: 499 }],
    max_savings: 45,
  },
  {
    id: "vd-seed-4",
    name: "Cotton Face Towels",
    description: "500 GSM premium cotton towels. Machine washable, quick-drying. Hotel and spa grade quality.",
    category: "hospitality",
    thumbnail: "/seed-images/trade-in%2F1524758631624-e2822e304c36.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 15, price: 699 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 30, price: 549 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 43, price: 399 }],
    max_savings: 43,
  },
  {
    id: "vd-seed-5",
    name: "Corrugated Shipping Boxes",
    description: "Heavy-duty double-wall corrugated boxes. Standard sizes available. Custom sizes on request.",
    category: "packaging",
    thumbnail: "/seed-images/government%2F1450101499163-c8848c66ca85.jpg",
    status: "active",
    tiers: [{ qty: "10+", min_quantity: 10, max_quantity: 49, discount_percentage: 20, price: 299 }, { qty: "50+", min_quantity: 50, max_quantity: 99, discount_percentage: 40, price: 199 }, { qty: "100+", min_quantity: 100, max_quantity: null, discount_percentage: 57, price: 129 }],
    max_savings: 57,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { product_id, limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = { status: "active" }
    if (product_id) {
      filters.target_id = product_id
      filters.applies_to = "product"
    }
    const { data: rules } = await query.graph({
      entity: "volume_pricing",
      fields: ["id", "name", "description", "applies_to", "target_id", "pricing_type", "priority", "status", "starts_at", "ends_at", "created_at"],
      filters,
    })
    const enrichedRules = await Promise.all((rules || []).map(async (rule: Record<string, unknown>) => {
      const { data: tiers } = await query.graph({
        entity: "volume_pricing_tier",
        fields: ["id", "volume_pricing_id", "min_quantity", "max_quantity", "discount_percentage", "discount_amount", "fixed_price", "currency_code"],
        filters: { volume_pricing_id: rule.id },
      })
      return { ...rule, tiers }
    }))
    const results = Array.isArray(enrichedRules) && enrichedRules.length > 0 ? enrichedRules : SEED_DATA
    res.json({ items: results, count: results.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-VOLUME-DEALS")
  }
}
