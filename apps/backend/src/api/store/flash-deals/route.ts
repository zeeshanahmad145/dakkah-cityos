import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

export const AUTHENTICATE = false

function getFlashDealsSeedData() {
  const now = Date.now()
  return [
    { id: "fd-1", name: "Wireless Noise-Cancelling Headphones", category: "electronics", thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg", original_price: 29999, sale_price: 14999, discount_percentage: 50, end_date: new Date(now + 3 * 60 * 60 * 1000).toISOString(), stock_remaining: 12, description: "Premium ANC headphones with 30hr battery life" },
    { id: "fd-2", name: "Smart Fitness Watch Pro", category: "electronics", thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", original_price: 19999, sale_price: 9999, discount_percentage: 50, end_date: new Date(now + 5 * 60 * 60 * 1000).toISOString(), stock_remaining: 8, description: "Heart rate, GPS, and sleep tracking" },
    { id: "fd-3", name: "Designer Leather Handbag", category: "fashion", thumbnail: "/seed-images/consignments%2F1548036328-c9fa89d128fa.jpg", original_price: 24999, sale_price: 12499, discount_percentage: 50, end_date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), stock_remaining: 5, description: "Italian genuine leather, limited edition" },
    { id: "fd-4", name: "Organic Skincare Bundle", category: "beauty", thumbnail: "/seed-images/bundles%2F1556228578-0d85b1a4d571.jpg", original_price: 8999, sale_price: 3599, discount_percentage: 60, end_date: new Date(now + 8 * 60 * 60 * 1000).toISOString(), stock_remaining: 23, description: "5-piece set with cleanser, toner, serum, moisturizer & mask" },
    { id: "fd-5", name: "Premium Coffee Machine", category: "home", thumbnail: "/seed-images/flash-sales%2F1495474472287-4d71bcdd2085.jpg", original_price: 44999, sale_price: 22499, discount_percentage: 50, end_date: new Date(now + 1 * 60 * 60 * 1000).toISOString(), stock_remaining: 3, description: "Espresso, cappuccino & latte with built-in grinder" },
  ]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>

  try {
    const moduleService = req.scope.resolve("promotionExt") as any
    const promotions = await moduleService.listProductBundles({}, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const list = Array.isArray(promotions) ? promotions : [promotions].filter(Boolean)
    if (list.length > 0) {
      const deals = list.map((p: any) => ({
        ...p,
        thumbnail: p.thumbnail || p.metadata?.thumbnail || "/seed-images/flash-sales%2F1495474472287-4d71bcdd2085.jpg",
      }))
      return res.json({ flash_deals: deals, count: deals.length, offset: Number(offset), limit: Number(limit) })
    }

    const seed = getFlashDealsSeedData()
    return res.json({ flash_deals: seed, count: seed.length, offset: 0, limit: 20 })
  } catch {
    const seed = getFlashDealsSeedData()
    return res.json({ flash_deals: seed, count: seed.length, offset: 0, limit: 20 })
  }
}
