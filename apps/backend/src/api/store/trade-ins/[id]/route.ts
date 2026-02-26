import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "ti-seed-1",
    name: "iPhone 15 Pro",
    category: "phones",
    thumbnail: "/seed-images/auctions%2F1523275335684-37898b6baf30.jpg",
    description: "Trade in your iPhone 15 Pro for store credit. All storage sizes accepted.",
    condition_requirements: "Powers on, no cracks, iCloud unlocked",
    trade_in_min: 35000,
    trade_in_max: 65000,
  },
  {
    id: "ti-seed-2",
    name: "MacBook Pro 14\"",
    category: "laptops",
    thumbnail: "/seed-images/digital-products%2F1517694712202-14dd9538aa97.jpg",
    description: "Trade in your MacBook Pro for instant credit. M1, M2, and M3 models accepted.",
    condition_requirements: "Functional display, keyboard works, no water damage",
    trade_in_min: 45000,
    trade_in_max: 120000,
  },
  {
    id: "ti-seed-3",
    name: "iPad Air / Pro",
    category: "tablets",
    thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg",
    description: "Get credit for your used iPad. All generations and sizes welcome.",
    condition_requirements: "Screen intact, charges properly, factory reset",
    trade_in_min: 15000,
    trade_in_max: 55000,
  },
  {
    id: "ti-seed-4",
    name: "PlayStation 5",
    category: "gaming",
    thumbnail: "/seed-images/trade-in%2F1593642532744-d377ab507dc8.jpg",
    description: "Trade your PS5 console for credit towards new gaming gear.",
    condition_requirements: "Disc drive works (if applicable), controller included",
    trade_in_min: 20000,
    trade_in_max: 35000,
  },
  {
    id: "ti-seed-5",
    name: "Samsung Galaxy S24 Ultra",
    category: "phones",
    thumbnail: "/seed-images/trade-in%2F1542291026-7eec264c27ff.jpg",
    description: "Trade in your Galaxy S24 Ultra. Unlocked and carrier models accepted.",
    condition_requirements: "Screen works, no cracks, Google account removed",
    trade_in_min: 30000,
    trade_in_max: 55000,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const automotiveService = req.scope.resolve("automotive") as any
    const { id } = req.params
    const item = await automotiveService.retrieveTradeIn(id)
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
