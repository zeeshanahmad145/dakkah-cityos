import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getFlashSalesSeedData() {
  const now = Date.now()
  return [
    { id: "fs-1", name: "Wireless Noise-Cancelling Headphones", category: "electronics", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop", original_price: 29999, sale_price: 14999, discount_percentage: 50, end_date: new Date(now + 3 * 60 * 60 * 1000).toISOString(), stock_remaining: 12, description: "Premium ANC headphones with 30hr battery life" },
    { id: "fs-2", name: "Smart Fitness Watch Pro", category: "electronics", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop", original_price: 19999, sale_price: 9999, discount_percentage: 50, end_date: new Date(now + 5 * 60 * 60 * 1000).toISOString(), stock_remaining: 8, description: "Heart rate, GPS, and sleep tracking" },
    { id: "fs-3", name: "Designer Leather Handbag", category: "fashion", thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=600&fit=crop", original_price: 24999, sale_price: 12499, discount_percentage: 50, end_date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), stock_remaining: 5, description: "Italian genuine leather, limited edition" },
    { id: "fs-4", name: "Organic Skincare Bundle", category: "beauty", thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop", original_price: 8999, sale_price: 3599, discount_percentage: 60, end_date: new Date(now + 8 * 60 * 60 * 1000).toISOString(), stock_remaining: 23, description: "5-piece set with cleanser, toner, serum, moisturizer & mask" },
    { id: "fs-5", name: "Premium Coffee Machine", category: "home", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop", original_price: 44999, sale_price: 22499, discount_percentage: 50, end_date: new Date(now + 1 * 60 * 60 * 1000).toISOString(), stock_remaining: 3, description: "Espresso, cappuccino & latte with built-in grinder" },
  ]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id } = req.params

    const { data: promos } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "code",
        "is_automatic",
        "type",
        "status",
        "starts_at",
        "ends_at",
        "campaign_id",
        "application_method.type",
        "application_method.value",
        "application_method.target_type",
      ],
      filters: { id },
    })

    const item = Array.isArray(promos) ? promos[0] : promos
    if (!item) {
      const seed = getFlashSalesSeedData()
      const seedItem = seed.find(i => i.id === id) || seed[0]
      return res.json({ item: seedItem })
    }

    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = getFlashSalesSeedData()
    const seedItem = seed.find(i => i.id === id) || seed[0]
    return res.json({ item: seedItem })
  }
}
