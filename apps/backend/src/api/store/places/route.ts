import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const SEED_PLACES = [
  { id: "place-1", name: "Grand Mosque (Masjid al-Haram)", description: "The largest mosque in the world, surrounding Islam's holiest place, the Kaaba in Mecca.", category: "Religious", rating: 4.9, review_count: 12500, location: "Mecca, Saudi Arabia", thumbnail: "/seed-images/content%2F1586724237569-f3d0c1dee8c6.jpg", latitude: 21.4225, longitude: 39.8262 },
  { id: "place-2", name: "Souq Al-Zal", description: "Historic marketplace in Riyadh known for traditional crafts, antiques, and authentic Arabian goods.", category: "Shopping", rating: 4.5, review_count: 3200, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content%2F1548013146-72479768bada.jpg", latitude: 24.6318, longitude: 46.7133 },
  { id: "place-3", name: "Kingdom Tower", description: "Iconic 99-floor skyscraper with a sky bridge offering panoramic views of Riyadh's skyline.", category: "Landmark", rating: 4.7, review_count: 8900, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content%2F1573164713988-8665fc963095.jpg", latitude: 24.7112, longitude: 46.6744 },
  { id: "place-4", name: "Al Masmak Fort", description: "Historic clay and mud-brick fortress that played a key role in the founding of Saudi Arabia.", category: "Historical", rating: 4.6, review_count: 5600, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content%2F1558171813-4c088753af8f.jpg", latitude: 24.6311, longitude: 46.7135 },
  { id: "place-5", name: "Edge of the World", description: "Dramatic cliff formation northwest of Riyadh offering breathtaking views of the endless desert.", category: "Nature", rating: 4.8, review_count: 4200, location: "Riyadh Province, Saudi Arabia", thumbnail: "/seed-images/content%2F1682687220742-aba13b6e50ba.jpg", latitude: 24.8167, longitude: 46.1503 },
  { id: "place-6", name: "Al-Ula Heritage Village", description: "Ancient village with remarkable rock formations and the UNESCO World Heritage site of Hegra.", category: "Heritage", rating: 4.9, review_count: 6700, location: "Al-Ula, Saudi Arabia", thumbnail: "/seed-images/content%2F1519167758481-83f550bb49b3.jpg", latitude: 26.6073, longitude: 37.9208 },
  { id: "place-7", name: "Jeddah Corniche", description: "Beautiful waterfront promenade stretching along the Red Sea with parks, sculptures, and dining.", category: "Leisure", rating: 4.4, review_count: 7800, location: "Jeddah, Saudi Arabia", thumbnail: "/seed-images/content%2F1578662996442-48f60103fc96.jpg", latitude: 21.5429, longitude: 39.1379 },
  { id: "place-8", name: "Diriyah", description: "Historic seat of the first Saudi state, now a cultural destination with museums and restaurants.", category: "Heritage", rating: 4.7, review_count: 4500, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg", latitude: 24.7342, longitude: 46.5725 },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { category, limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
  let places = SEED_PLACES
  if (category && category !== "all") {
    places = places.filter(p => p.category.toLowerCase() === category.toLowerCase())
  }
  const start = Number(offset)
  const end = start + Number(limit)
  return res.json({
    places: places.slice(start, end),
    count: places.length,
    offset: start,
    limit: Number(limit),
  })
}
