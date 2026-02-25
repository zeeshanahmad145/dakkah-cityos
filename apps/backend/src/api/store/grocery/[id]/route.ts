import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "groc-seed-001",
    product_id: "groc-seed-001",
    metadata: {
      name: "Organic Fresh Strawberries",
      description: "Hand-picked organic strawberries from local farms. Sweet, juicy, and perfect for smoothies or snacking.",
      thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop"],
      price: 1299,
      currency: "SAR",
      category: "fruits",
    },
    organic: true,
    unit_type: "kg",
    storage_type: "refrigerated",
    shelf_life_days: 5,
  },
  {
    id: "groc-seed-002",
    product_id: "groc-seed-002",
    metadata: {
      name: "Artisan Sourdough Bread",
      description: "Freshly baked sourdough bread made with traditional fermentation methods. Crispy crust, soft interior.",
      thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"],
      price: 899,
      currency: "SAR",
      category: "bakery",
    },
    organic: false,
    unit_type: "loaf",
    storage_type: "ambient",
    shelf_life_days: 3,
  },
  {
    id: "groc-seed-003",
    product_id: "groc-seed-003",
    metadata: {
      name: "Farm Fresh Free-Range Eggs",
      description: "Premium free-range eggs from pasture-raised hens. Rich in omega-3 and packed with flavor.",
      thumbnail: "https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=800&h=600&fit=crop"],
      price: 1599,
      currency: "SAR",
      category: "dairy",
    },
    organic: true,
    unit_type: "dozen",
    storage_type: "refrigerated",
    shelf_life_days: 21,
  },
  {
    id: "groc-seed-004",
    product_id: "groc-seed-004",
    metadata: {
      name: "Premium Wagyu Beef Steaks",
      description: "A5 grade Wagyu beef steaks with exceptional marbling. Perfect for grilling or pan-searing.",
      thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"],
      price: 12999,
      currency: "SAR",
      category: "meat",
    },
    organic: false,
    unit_type: "kg",
    storage_type: "frozen",
    shelf_life_days: 90,
  },
  {
    id: "groc-seed-005",
    product_id: "groc-seed-005",
    metadata: {
      name: "Organic Mixed Vegetables Box",
      description: "A curated box of seasonal organic vegetables including tomatoes, peppers, zucchini, and leafy greens.",
      thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
      images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop"],
      price: 2499,
      currency: "SAR",
      category: "vegetables",
    },
    organic: true,
    unit_type: "box",
    storage_type: "refrigerated",
    shelf_life_days: 7,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("grocery") as any
    const { id } = req.params
    const item = await mod.retrieveFreshProduct(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
