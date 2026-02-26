import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "tby_001",
    name: "Premium Noise-Cancelling Headphones",
    title: "Premium Noise-Cancelling Headphones",
    description: "Experience world-class ANC with 30hr battery life. Try them for 14 days risk-free before you commit.",
    category: "electronics",
    trial_period: 14,
    deposit: 4999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/auctions%2F1505740420928-5e560c06d30e.jpg",
    included: ["Free shipping both ways", "14-day risk-free trial", "Full refund if returned", "Original packaging included"],
  },
  {
    id: "tby_002",
    name: "Ergonomic Office Chair",
    title: "Ergonomic Office Chair",
    description: "Adjustable lumbar support, breathable mesh, and 4D armrests. Perfect for your home office setup.",
    category: "furniture",
    trial_period: 30,
    deposit: 9999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/classifieds%2F1555041469-a586c61ea9bc.jpg",
    included: ["Free delivery and pickup", "30-day home trial", "No questions asked returns", "Assembly service included"],
  },
  {
    id: "tby_003",
    name: "Smart Fitness Tracker",
    title: "Smart Fitness Tracker",
    description: "Track steps, heart rate, sleep quality, and 20+ workout modes. Water-resistant to 50m.",
    category: "electronics",
    trial_period: 14,
    deposit: 2499,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/bundles%2F1571019613454-1cb2f99b2d8b.jpg",
    included: ["Free shipping both ways", "14-day trial period", "Charging cable and dock", "Quick start guide"],
  },
  {
    id: "tby_004",
    name: "Designer Sunglasses",
    title: "Designer Sunglasses",
    description: "Polarized lenses with UV400 protection. Italian acetate frames with titanium hinges.",
    category: "fashion",
    trial_period: 7,
    deposit: 3499,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/trade-in%2F1542291026-7eec264c27ff.jpg",
    included: ["Free express shipping", "7-day home trial", "Protective case included", "Free return shipping label"],
  },
  {
    id: "tby_005",
    name: "Professional Espresso Machine",
    title: "Professional Espresso Machine",
    description: "Dual boiler system with PID temperature control. Barista-grade coffee at home.",
    category: "home",
    trial_period: 30,
    deposit: 14999,
    currency_code: "usd",
    status: "approved",
    thumbnail: "/seed-images/trade-in%2F1524758631624-e2822e304c36.jpg",
    included: ["Free white-glove delivery", "30-day trial period", "All accessories and portafilter", "Barista starter kit with beans"],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorService = req.scope.resolve("vendor") as any
    const { id } = req.params
    const item = await vendorService.retrieveVendorProduct(id)
    if (!item) {
      const seedItem = SEED_DATA.find(s => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find(s => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
