import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "bundle-seed-1",
    name: "Home Office Essentials",
    description: "Everything you need for a productive home office setup including ergonomic accessories and tech gadgets.",
    thumbnail: "/seed-images/bundles%2F1519389950473-47ba0277781c.jpg",
    price: 14999,
    original_price: 22999,
    savings: 8000,
    currency: "USD",
    items_count: 5,
    category: "office",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-2",
    name: "Fitness Starter Pack",
    description: "Kickstart your fitness journey with resistance bands, yoga mat, water bottle, and workout guide.",
    thumbnail: "/seed-images/bundles%2F1571019613454-1cb2f99b2d8b.jpg",
    price: 7999,
    original_price: 12999,
    savings: 5000,
    currency: "USD",
    items_count: 4,
    category: "fitness",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-3",
    name: "Skincare Routine Set",
    description: "Complete morning and evening skincare routine with cleanser, toner, serum, moisturizer, and SPF.",
    thumbnail: "/seed-images/bundles%2F1556228578-0d85b1a4d571.jpg",
    price: 5999,
    original_price: 8999,
    savings: 3000,
    currency: "USD",
    items_count: 5,
    category: "beauty",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-4",
    name: "Smart Home Bundle",
    description: "Transform your home with smart speakers, smart plugs, LED bulbs, and a hub controller.",
    thumbnail: "/seed-images/bundles%2F1558002038-1055907df827.jpg",
    price: 24999,
    original_price: 34999,
    savings: 10000,
    currency: "USD",
    items_count: 6,
    category: "electronics",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-5",
    name: "Gourmet Kitchen Set",
    description: "Premium kitchen essentials including chef knife set, cutting board, spice rack, and apron.",
    thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg",
    price: 11999,
    original_price: 17999,
    savings: 6000,
    currency: "USD",
    items_count: 4,
    category: "home",
    is_active: true,
    metadata: {},
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("promotionExt") as any
    const { id } = req.params
    const item = await moduleService.retrieveProductBundle(id)
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
