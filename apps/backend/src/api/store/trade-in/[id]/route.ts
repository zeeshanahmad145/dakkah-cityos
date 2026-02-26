import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_ITEMS = [
  { id: "ti-seed-1", name: "iPhone 15 Pro", category: "phones", thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg", description: "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.", condition_requirements: "Powers on, no cracks, all buttons functional", estimated_value_min: 150000, estimated_value_max: 280000, currency: "SAR", status: "active", requirements: ["Item must be in working condition", "Original charger and cable included", "No cracks or major scratches on screen", "Factory reset completed before trade-in"] },
  { id: "ti-seed-2", name: "Samsung Galaxy S24 Ultra", category: "phones", thumbnail: "/seed-images/trade-in%2F1610945415295-d9bbf067e59c.jpg", description: "Trade in your Samsung Galaxy S24 Ultra for instant store credit.", condition_requirements: "Powers on, screen intact, no water damage", estimated_value_min: 120000, estimated_value_max: 250000, currency: "SAR", status: "active", requirements: ["Device powers on and holds charge", "Screen intact with no dead pixels", "No water damage indicators triggered", "All buttons and ports functional"] },
  { id: "ti-seed-3", name: "MacBook Pro M3", category: "laptops", thumbnail: "/seed-images/classifieds%2F1517336714731-489689fd1ca8.jpg", description: "Get top value for your MacBook Pro M3. All configurations accepted.", condition_requirements: "Boots normally, keyboard functional, no dents", estimated_value_min: 350000, estimated_value_max: 650000, currency: "SAR", status: "active", requirements: ["Boots normally to desktop", "Keyboard and trackpad fully functional", "No significant dents or cosmetic damage", "Battery health above 70%"] },
  { id: "ti-seed-4", name: "iPad Pro 12.9\"", category: "tablets", thumbnail: "/seed-images/trade-in%2F1544244015-0df4b3ffc6b0.jpg", description: "Trade in your iPad Pro for store credit towards new devices.", condition_requirements: "Powers on, touch screen responsive, no cracks", estimated_value_min: 100000, estimated_value_max: 200000, currency: "SAR", status: "active", requirements: ["Touch screen fully responsive", "No cracks on screen or body", "Apple Pencil support functional if applicable", "Signed out of iCloud before submission"] },
  { id: "ti-seed-5", name: "Sony PS5", category: "gaming", thumbnail: "/seed-images/trade-in%2F1606144042614-b2417e99c4e3.jpg", description: "Trade in your PlayStation 5 console for store credit.", condition_requirements: "Powers on, controllers included, no disc read errors", estimated_value_min: 80000, estimated_value_max: 150000, currency: "SAR", status: "active", requirements: ["Console powers on without errors", "At least one controller included", "No disc read errors or overheating issues", "All cables and power adapter included"] },
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
