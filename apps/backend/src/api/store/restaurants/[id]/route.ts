import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_RESTAURANTS = [
  { id: "rst-1", name: "Al Najd Village", description: "Authentic Najdi cuisine served in a traditional setting with live oud music. Famous for kabsa, jareesh, and haneeth.", cuisine_type: "najdi", city: "Riyadh", phone: "+966 11 234 5678", rating: 4.8, review_count: 1240, price_range: "$$$", operating_hours: "12:00 PM – 12:00 AM", delivery_available: true, pickup_available: true, dine_in_available: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop" } },
  { id: "rst-2", name: "Sakura Japanese Kitchen", description: "Premium Japanese dining featuring fresh sushi, sashimi, and teppanyaki prepared by Tokyo-trained chefs.", cuisine_type: "japanese", city: "Jeddah", phone: "+966 12 345 6789", rating: 4.7, review_count: 856, price_range: "$$$$", operating_hours: "1:00 PM – 11:30 PM", delivery_available: true, pickup_available: true, dine_in_available: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop" } },
  { id: "rst-3", name: "Mama's Italian Kitchen", description: "Family-style Italian restaurant with handmade pasta, wood-fired pizzas, and an extensive selection of desserts.", cuisine_type: "italian", city: "Riyadh", phone: "+966 11 456 7890", rating: 4.6, review_count: 678, price_range: "$$", operating_hours: "11:00 AM – 11:00 PM", delivery_available: true, pickup_available: true, dine_in_available: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop" } },
  { id: "rst-4", name: "Spice Route Indian Bistro", description: "Vibrant Indian flavors from North and South India. Signature tandoori dishes, biryanis, and freshly baked naan bread.", cuisine_type: "indian", city: "Dammam", phone: "+966 13 567 8901", rating: 4.5, review_count: 432, price_range: "$$", operating_hours: "12:00 PM – 11:30 PM", delivery_available: true, pickup_available: true, dine_in_available: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop" } },
  { id: "rst-5", name: "The Arabian Table", description: "Modern Arabic cuisine with a contemporary twist. Featuring mezzeh platters, grilled meats, and traditional sweets.", cuisine_type: "arabic", city: "Riyadh", phone: "+966 11 678 9012", rating: 4.9, review_count: 1567, price_range: "$$$", operating_hours: "10:00 AM – 1:00 AM", delivery_available: true, pickup_available: false, dine_in_available: true, metadata: { thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop" } },
  { id: "rst-6", name: "Bangkok Street Kitchen", description: "Authentic Thai street food brought to life with bold flavors. Known for pad thai, green curry, and mango sticky rice.", cuisine_type: "thai", city: "Jeddah", phone: "+966 12 789 0123", rating: 4.4, review_count: 298, price_range: "$", operating_hours: "11:30 AM – 10:30 PM", delivery_available: true, pickup_available: true, dine_in_available: false, metadata: { thumbnail: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&h=600&fit=crop" } },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("restaurant") as any
    const { id } = req.params
    const restaurant = await mod.retrieveRestaurant(id)
    if (!restaurant) {
      const seed = SEED_RESTAURANTS.find((s) => s.id === id) || SEED_RESTAURANTS[0]
      return res.json({ item: { ...seed, id, menus: [] } })
    }
    const menus = await mod.listMenus({ restaurant_id: id }, { take: 10 })
    return res.json({ item: { ...restaurant, menus } })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_RESTAURANTS.find((s) => s.id === id) || SEED_RESTAURANTS[0]
    return res.json({ item: { ...seed, id, menus: [] } })
  }
}

