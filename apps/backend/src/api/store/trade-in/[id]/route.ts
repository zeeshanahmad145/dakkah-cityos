import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_ITEMS = [
  { id: "ti-seed-1", name: "iPhone 15 Pro", category: "phones", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop", description: "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.", condition_requirements: "Powers on, no cracks, all buttons functional", estimated_value_min: 150000, estimated_value_max: 280000, currency: "SAR", status: "active" },
  { id: "ti-seed-2", name: "Samsung Galaxy S24 Ultra", category: "phones", thumbnail: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop", description: "Trade in your Samsung Galaxy S24 Ultra for instant store credit.", condition_requirements: "Powers on, screen intact, no water damage", estimated_value_min: 120000, estimated_value_max: 250000, currency: "SAR", status: "active" },
  { id: "ti-seed-3", name: "MacBook Pro M3", category: "laptops", thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop", description: "Get top value for your MacBook Pro M3. All configurations accepted.", condition_requirements: "Boots normally, keyboard functional, no dents", estimated_value_min: 350000, estimated_value_max: 650000, currency: "SAR", status: "active" },
  { id: "ti-seed-4", name: "iPad Pro 12.9\"", category: "tablets", thumbnail: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop", description: "Trade in your iPad Pro for store credit towards new devices.", condition_requirements: "Powers on, touch screen responsive, no cracks", estimated_value_min: 100000, estimated_value_max: 200000, currency: "SAR", status: "active" },
  { id: "ti-seed-5", name: "Sony PS5", category: "gaming", thumbnail: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop", description: "Trade in your PlayStation 5 console for store credit.", condition_requirements: "Powers on, controllers included, no disc read errors", estimated_value_min: 80000, estimated_value_max: 150000, currency: "SAR", status: "active" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const mod = req.scope.resolve("tradeIn") as any
    const item = await mod.retrieveTradeInRequest(id)
    if (item) return res.json({ item })
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0]
    return res.json({ item: { ...seed, id } })
  } catch {
    const { id } = req.params
    const seed = SEED_ITEMS.find((s) => s.id === id) || SEED_ITEMS[0]
    return res.json({ item: { ...seed, id } })
  }
}
