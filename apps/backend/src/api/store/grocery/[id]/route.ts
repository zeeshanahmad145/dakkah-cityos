import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "groc-seed-001",
    product_id: "groc-seed-001",
    metadata: {
      name: "Organic Fresh Strawberries",
      description: "Hand-picked organic strawberries from local farms. Sweet, juicy, and perfect for smoothies or snacking.",
      thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg",
      images: ["/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg"],
      price: 1299,
      currency: "SAR",
      category: "fruits",
    },
    organic: true,
    unit_type: "kg",
    storage_type: "refrigerated",
    shelf_life_days: 5,
    nutrition: { calories: "32 per 100g", protein: "0.7g", carbohydrates: "7.7g", fiber: "2g", sugar: "4.9g", fat: "0.3g", vitamin_c: "58.8mg" },
    allergens: [],
    related_products: [
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-002", name: "Artisan Sourdough Bread", price: 899, thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg" },
    ],
    dietary: ["Vegan", "Gluten-Free", "Keto-Friendly", "Paleo"],
  },
  {
    id: "groc-seed-002",
    product_id: "groc-seed-002",
    metadata: {
      name: "Artisan Sourdough Bread",
      description: "Freshly baked sourdough bread made with traditional fermentation methods. Crispy crust, soft interior.",
      thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg",
      images: ["/seed-images/bundles%2F1504674900247-0877df9cc836.jpg"],
      price: 899,
      currency: "SAR",
      category: "bakery",
    },
    organic: false,
    unit_type: "loaf",
    storage_type: "ambient",
    shelf_life_days: 3,
    nutrition: { calories: "259 per 100g", protein: "8.5g", carbohydrates: "51g", fiber: "2.7g", sugar: "3.5g", fat: "1.2g", sodium: "500mg" },
    allergens: ["Wheat", "Gluten"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-004", name: "Premium Wagyu Beef Steaks", price: 12999, thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg" },
    ],
    dietary: ["Vegetarian", "Vegan", "Dairy-Free"],
  },
  {
    id: "groc-seed-003",
    product_id: "groc-seed-003",
    metadata: {
      name: "Farm Fresh Free-Range Eggs",
      description: "Premium free-range eggs from pasture-raised hens. Rich in omega-3 and packed with flavor.",
      thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg",
      images: ["/seed-images/grocery%2F1548848221-0c2e497ed557.jpg"],
      price: 1599,
      currency: "SAR",
      category: "dairy",
    },
    organic: true,
    unit_type: "dozen",
    storage_type: "refrigerated",
    shelf_life_days: 21,
    nutrition: { calories: "155 per 2 eggs", protein: "13g", carbohydrates: "1.1g", fiber: "0g", sugar: "1.1g", fat: "11g", cholesterol: "373mg" },
    allergens: ["Eggs"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-002", name: "Artisan Sourdough Bread", price: 899, thumbnail: "/seed-images/bundles%2F1504674900247-0877df9cc836.jpg" },
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
    ],
    dietary: ["Gluten-Free", "Keto-Friendly", "Paleo", "Vegetarian"],
  },
  {
    id: "groc-seed-004",
    product_id: "groc-seed-004",
    metadata: {
      name: "Premium Wagyu Beef Steaks",
      description: "A5 grade Wagyu beef steaks with exceptional marbling. Perfect for grilling or pan-searing.",
      thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg",
      images: ["/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg"],
      price: 12999,
      currency: "SAR",
      category: "meat",
    },
    organic: false,
    unit_type: "kg",
    storage_type: "frozen",
    shelf_life_days: 90,
    nutrition: { calories: "250 per 100g", protein: "17g", carbohydrates: "0g", fiber: "0g", sugar: "0g", fat: "20g", iron: "2.6mg" },
    allergens: ["Soy"],
    related_products: [
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-005", name: "Organic Mixed Vegetables Box", price: 2499, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
    ],
    dietary: ["Gluten-Free", "Keto-Friendly", "Paleo", "Low-Carb"],
  },
  {
    id: "groc-seed-005",
    product_id: "groc-seed-005",
    metadata: {
      name: "Organic Mixed Vegetables Box",
      description: "A curated box of seasonal organic vegetables including tomatoes, peppers, zucchini, and leafy greens.",
      thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg",
      images: ["/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg"],
      price: 2499,
      currency: "SAR",
      category: "vegetables",
    },
    organic: true,
    unit_type: "box",
    storage_type: "refrigerated",
    shelf_life_days: 7,
    nutrition: { calories: "25 per 100g", protein: "1.5g", carbohydrates: "5g", fiber: "2.5g", sugar: "3g", fat: "0.2g", vitamin_a: "42% DV" },
    allergens: ["Celery", "Mustard"],
    related_products: [
      { id: "groc-seed-001", name: "Organic Fresh Strawberries", price: 1299, thumbnail: "/seed-images/grocery%2F1540189549336-e6e99c3679fe.jpg" },
      { id: "groc-seed-004", name: "Premium Wagyu Beef Steaks", price: 12999, thumbnail: "/seed-images/grocery%2F1414235077428-338989a2e8c0.jpg" },
      { id: "groc-seed-003", name: "Farm Fresh Free-Range Eggs", price: 1599, thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg" },
    ],
    dietary: ["Vegan", "Gluten-Free", "Keto-Friendly", "Paleo", "Whole30"],
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
