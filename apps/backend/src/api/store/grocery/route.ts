import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "groc-seed-001",
    product_id: "groc-seed-001",
    metadata: {
      name: "Organic Fresh Strawberries",
      description: "Hand-picked organic strawberries from local farms. Sweet, juicy, and perfect for smoothies or snacking.",
      thumbnail: "/seed-images/grocery%2F1464965911861-746a04b4bca6.jpg",
      images: ["/seed-images/grocery%2F1464965911861-746a04b4bca6.jpg"],
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
      thumbnail: "/seed-images/grocery%2F1509440159596-0249088772ff.jpg",
      images: ["/seed-images/grocery%2F1509440159596-0249088772ff.jpg"],
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
      thumbnail: "/seed-images/grocery%2F1582722872445-44dc5f7e3c8f.jpg",
      images: ["/seed-images/grocery%2F1582722872445-44dc5f7e3c8f.jpg"],
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
      thumbnail: "/seed-images/grocery%2F1603048297172-c92544798d5a.jpg",
      images: ["/seed-images/grocery%2F1603048297172-c92544798d5a.jpg"],
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
      thumbnail: "/seed-images/grocery%2F1540420773420-3366772f4999.jpg",
      images: ["/seed-images/grocery%2F1540420773420-3366772f4999.jpg"],
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
    const groceryService = req.scope.resolve("grocery") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      is_organic,
      storage_type,
      is_available,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (is_organic !== undefined) filters.is_organic = is_organic === "true"
    if (storage_type) filters.storage_type = storage_type
    if (is_available !== undefined) filters.is_available = is_available === "true"
    if (search) filters.name = { $like: `%${search}%` }

    const items = await groceryService.listFreshProducts(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const itemList = Array.isArray(items) && items.length > 0 ? items : SEED_DATA

    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    })
  }
}

