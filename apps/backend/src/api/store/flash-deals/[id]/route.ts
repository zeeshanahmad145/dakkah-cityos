import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const SEED_DETAILS: Record<string, any> = {
  "fd-1": { id: "fd-1", name: "Wireless Noise-Cancelling Headphones", category: "electronics", thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg", original_price: 29999, sale_price: 14999, discount_percentage: 50, description: "Premium ANC headphones with 30hr battery life, plush ear cups, and active noise cancellation.", features: ["Active Noise Cancellation", "30-hour battery", "Bluetooth 5.3", "Foldable design"], reviews: [{ author: "Khalid M.", rating: 5, comment: "Best headphones I've ever owned.", created_at: "2026-01-15T00:00:00Z" }, { author: "Sara A.", rating: 4, comment: "Great sound quality, comfortable fit.", created_at: "2026-01-10T00:00:00Z" }, { author: "Omar H.", rating: 5, comment: "The noise cancellation is incredible.", created_at: "2026-01-05T00:00:00Z" }, { author: "Layla R.", rating: 4, comment: "Worth every riyal at this price.", created_at: "2025-12-28T00:00:00Z" }, { author: "Ahmed S.", rating: 5, comment: "Perfect for flights and commutes.", created_at: "2025-12-20T00:00:00Z" }] },
  "fd-2": { id: "fd-2", name: "Smart Fitness Watch Pro", category: "electronics", thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", original_price: 19999, sale_price: 9999, discount_percentage: 50, description: "Advanced fitness tracker with heart rate monitoring, GPS, and sleep analysis.", features: ["Heart Rate Monitor", "Built-in GPS", "Sleep Tracking", "Water Resistant IP68"], reviews: [{ author: "Fatima K.", rating: 5, comment: "Tracks everything perfectly!", created_at: "2026-01-12T00:00:00Z" }, { author: "Nasser J.", rating: 4, comment: "Great value for the features.", created_at: "2026-01-08T00:00:00Z" }, { author: "Maha L.", rating: 5, comment: "Love the sleep tracking feature.", created_at: "2026-01-03T00:00:00Z" }, { author: "Faisal W.", rating: 4, comment: "Battery lasts about 5 days.", created_at: "2025-12-25T00:00:00Z" }, { author: "Dana Y.", rating: 5, comment: "Excellent for daily workouts.", created_at: "2025-12-18T00:00:00Z" }] },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const detail = SEED_DETAILS[id]
  if (detail) return res.json({ flash_deal: detail })

  try {
    const moduleService = req.scope.resolve("promotionExt") as any
    const item = await moduleService.retrieveProductBundle(id)
    const enriched = {
      ...item,
      thumbnail: item.thumbnail || item.metadata?.thumbnail || "/seed-images/flash-sales%2F1495474472287-4d71bcdd2085.jpg",
      reviews: [
        { author: "Khalid M.", rating: 5, comment: "Amazing deal, couldn't pass it up!", created_at: "2026-01-15T00:00:00Z" },
        { author: "Sara A.", rating: 4, comment: "Great value at the flash sale price.", created_at: "2026-01-10T00:00:00Z" },
        { author: "Omar H.", rating: 5, comment: "Product quality exceeded expectations.", created_at: "2026-01-05T00:00:00Z" },
        { author: "Layla R.", rating: 4, comment: "Worth every riyal at this price.", created_at: "2025-12-28T00:00:00Z" },
        { author: "Ahmed S.", rating: 5, comment: "Fast shipping too. Highly recommend.", created_at: "2025-12-20T00:00:00Z" },
      ],
    }
    return res.json({ flash_deal: enriched })
  } catch {
    return res.status(404).json({ message: "Flash deal not found" })
  }
}
