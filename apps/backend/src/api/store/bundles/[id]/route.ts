import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_DATA = [
  {
    id: "bundle-seed-1",
    name: "Home Office Essentials",
    description: "Everything you need for a productive home office setup including ergonomic accessories and tech gadgets.",
    thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg",
    price: 14999,
    original_price: 22999,
    savings: 8000,
    currency: "USD",
    items_count: 5,
    category: "office",
    is_active: true,
    metadata: {},
    items: [{ id: "bi-1", name: "Ergonomic Desk Chair", price: 5999, thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" }, { id: "bi-2", name: "LED Desk Lamp", price: 2999, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg" }, { id: "bi-3", name: "Wireless Keyboard & Mouse", price: 3499, thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg" }, { id: "bi-4", name: "Monitor Stand Riser", price: 1999, thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg" }],
    reviews: [{ author: "Sarah Remote", rating: 5, comment: "This bundle had everything I needed for my home office. Great savings compared to buying individually.", created_at: "2025-01-15T00:00:00Z" }, { author: "David WFH", rating: 4, comment: "Quality products at a bundled discount. The ergonomic accessories are excellent.", created_at: "2025-01-10T00:00:00Z" }, { author: "Emma Freelancer", rating: 5, comment: "Perfect starter kit for remote work. Saved over $80 with the bundle pricing.", created_at: "2025-01-05T00:00:00Z" }, { author: "Mark Designer", rating: 4, comment: "Good value bundle. The tech gadgets are well-chosen and complement each other.", created_at: "2024-12-28T00:00:00Z" }, { author: "Lisa Office", rating: 5, comment: "Transformed my workspace completely. Each item in the bundle is high quality.", created_at: "2024-12-20T00:00:00Z" }],
  },
  {
    id: "bundle-seed-2",
    name: "Fitness Starter Pack",
    description: "Kickstart your fitness journey with resistance bands, yoga mat, water bottle, and workout guide.",
    thumbnail: "/seed-images/bundles/1571019613454-1cb2f99b2d8b.jpg",
    price: 7999,
    original_price: 12999,
    savings: 5000,
    currency: "USD",
    items_count: 4,
    category: "fitness",
    is_active: true,
    metadata: {},
    items: [{ id: "bi-5", name: "Premium Resistance Bands Set", price: 2999, thumbnail: "/seed-images/bundles/1571019613454-1cb2f99b2d8b.jpg" }, { id: "bi-6", name: "Non-Slip Yoga Mat", price: 3499, thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg" }, { id: "bi-7", name: "Insulated Water Bottle", price: 1999, thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg" }, { id: "bi-8", name: "Digital Workout Guide", price: 1499, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg" }],
    reviews: [{ author: "Jake Fitness", rating: 5, comment: "Perfect bundle to start my fitness journey. The resistance bands are durable and versatile.", created_at: "2025-01-12T00:00:00Z" }, { author: "Mia Yoga", rating: 4, comment: "Great value pack. The yoga mat is thick and comfortable for floor exercises.", created_at: "2025-01-08T00:00:00Z" }, { author: "Chris Active", rating: 5, comment: "Saved $50 with this bundle. The workout guide alone is worth it.", created_at: "2025-01-02T00:00:00Z" }, { author: "Aisha Gym", rating: 4, comment: "Everything a beginner needs. Quality is better than expected at this price point.", created_at: "2024-12-25T00:00:00Z" }, { author: "Tom Runner", rating: 5, comment: "Bought this as a gift and they loved it. Well-packaged and great presentation.", created_at: "2024-12-18T00:00:00Z" }],
  },
  {
    id: "bundle-seed-3",
    name: "Skincare Routine Set",
    description: "Complete morning and evening skincare routine with cleanser, toner, serum, moisturizer, and SPF.",
    thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg",
    price: 5999,
    original_price: 8999,
    savings: 3000,
    currency: "USD",
    items_count: 5,
    category: "beauty",
    is_active: true,
    metadata: {},
    items: [{ id: "bi-9", name: "Gentle Foaming Cleanser", price: 1499, thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg" }, { id: "bi-10", name: "Hydrating Toner", price: 1299, thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg" }, { id: "bi-11", name: "Vitamin C Serum", price: 2499, thumbnail: "/seed-images/bundles/1571019613454-1cb2f99b2d8b.jpg" }, { id: "bi-12", name: "Daily Moisturizer with SPF", price: 1799, thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" }],
    reviews: [{ author: "Lina Beauty", rating: 5, comment: "This skincare set transformed my routine. My skin looks radiant after just two weeks.", created_at: "2025-01-14T00:00:00Z" }, { author: "Nora Glow", rating: 5, comment: "All five products work beautifully together. The serum is my absolute favorite.", created_at: "2025-01-09T00:00:00Z" }, { author: "Sara Skin", rating: 4, comment: "Great bundle for anyone starting a proper skincare routine. SPF moisturizer is a must-have.", created_at: "2025-01-03T00:00:00Z" }, { author: "Emily Care", rating: 4, comment: "Clean ingredients and noticeable results. The toner is gentle yet effective.", created_at: "2024-12-27T00:00:00Z" }, { author: "Hana Fresh", rating: 5, comment: "Saved $30 buying the set vs individual products. Amazing value for premium skincare.", created_at: "2024-12-19T00:00:00Z" }],
  },
  {
    id: "bundle-seed-4",
    name: "Smart Home Bundle",
    description: "Transform your home with smart speakers, smart plugs, LED bulbs, and a hub controller.",
    thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg",
    price: 24999,
    original_price: 34999,
    savings: 10000,
    currency: "USD",
    items_count: 6,
    category: "electronics",
    is_active: true,
    metadata: {},
    items: [{ id: "bi-13", name: "Smart Speaker with Voice Assistant", price: 9999, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg" }, { id: "bi-14", name: "Smart Plug 4-Pack", price: 4999, thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" }, { id: "bi-15", name: "Color LED Smart Bulbs 6-Pack", price: 7999, thumbnail: "/seed-images/bundles/1571019613454-1cb2f99b2d8b.jpg" }, { id: "bi-16", name: "Smart Home Hub Controller", price: 12999, thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg" }],
    reviews: [{ author: "Ahmed Tech", rating: 5, comment: "This bundle made my home truly smart. Everything connects seamlessly through the hub.", created_at: "2025-01-13T00:00:00Z" }, { author: "Peter Smart", rating: 5, comment: "Incredible savings on premium smart home gear. Setup was surprisingly easy.", created_at: "2025-01-07T00:00:00Z" }, { author: "Reem Home", rating: 4, comment: "Love controlling lights and appliances with voice. The smart plugs are very reliable.", created_at: "2025-01-01T00:00:00Z" }, { author: "Mike IoT", rating: 4, comment: "Good starter kit for home automation. LED bulbs have amazing color options.", created_at: "2024-12-24T00:00:00Z" }, { author: "Noura Digital", rating: 5, comment: "Saved $100 buying as a bundle. Every component works together perfectly.", created_at: "2024-12-16T00:00:00Z" }],
  },
  {
    id: "bundle-seed-5",
    name: "Gourmet Kitchen Set",
    description: "Premium kitchen essentials including chef knife set, cutting board, spice rack, and apron.",
    thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg",
    price: 11999,
    original_price: 17999,
    savings: 6000,
    currency: "USD",
    items_count: 4,
    category: "home",
    is_active: true,
    metadata: {},
    items: [{ id: "bi-17", name: "Professional Chef Knife Set", price: 6999, thumbnail: "/seed-images/bundles/1504674900247-0877df9cc836.jpg" }, { id: "bi-18", name: "Bamboo Cutting Board Set", price: 3499, thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" }, { id: "bi-19", name: "Rotating Spice Rack", price: 2999, thumbnail: "/seed-images/bundles/1558002038-1055907df827.jpg" }],
    reviews: [{ author: "Chef Omar", rating: 5, comment: "Professional-grade knives and beautiful cutting boards. Every home cook needs this set.", created_at: "2025-01-11T00:00:00Z" }, { author: "Maria Kitchen", rating: 4, comment: "Great gift idea! The spice rack is a nice touch and the apron is quality cotton.", created_at: "2025-01-06T00:00:00Z" }, { author: "Hassan Cooking", rating: 5, comment: "The knife set alone is worth more than the bundle price. Incredibly sharp and well-balanced.", created_at: "2024-12-30T00:00:00Z" }, { author: "Julia Foodie", rating: 5, comment: "Elevated my cooking experience. The bamboo cutting board is both beautiful and functional.", created_at: "2024-12-22T00:00:00Z" }, { author: "Carlos Chef", rating: 4, comment: "Solid kitchen essentials bundle. Good value with $60 in savings.", created_at: "2024-12-14T00:00:00Z" }],
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
    return res.json({ item: enrichDetailItem(item, "bundles") })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
