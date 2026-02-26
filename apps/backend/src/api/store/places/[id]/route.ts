import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const SEED_PLACES = [
  { id: "place-1", name: "Grand Mosque (Masjid al-Haram)", description: "The largest mosque in the world, surrounding Islam's holiest place, the Kaaba in Mecca. Millions of Muslims visit annually for Hajj and Umrah pilgrimages.", category: "Religious", rating: 4.9, review_count: 12500, location: "Mecca, Saudi Arabia", thumbnail: "/seed-images/content/1586724237569-f3d0c1dee8c6.jpg", latitude: 21.4225, longitude: 39.8262, highlights: ["UNESCO World Heritage", "Holiest site in Islam", "Capacity: 1.5 million"], amenities: ["Wheelchair access", "Prayer areas", "Water stations"], hours: "Open 24 hours" },
  { id: "place-2", name: "Souq Al-Zal", description: "Historic marketplace in Riyadh known for traditional crafts, antiques, and authentic Arabian goods. One of the oldest souqs in the Kingdom.", category: "Shopping", rating: 4.5, review_count: 3200, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content/1548013146-72479768bada.jpg", latitude: 24.6318, longitude: 46.7133, highlights: ["Traditional crafts", "Antique collectibles", "Local spices"], amenities: ["Parking", "ATM", "Restaurants nearby"], hours: "Sat-Thu: 9AM-12PM, 4PM-10PM" },
  { id: "place-3", name: "Kingdom Tower", description: "Iconic 99-floor skyscraper with a sky bridge offering panoramic views of Riyadh's skyline. Home to luxury shopping and dining.", category: "Landmark", rating: 4.7, review_count: 8900, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content/1573164713988-8665fc963095.jpg", latitude: 24.7112, longitude: 46.6744, highlights: ["Sky Bridge observation deck", "Luxury shopping mall", "Five-star hotel"], amenities: ["Valet parking", "Restaurants", "Shopping"], hours: "Daily: 9:30AM-11:30PM" },
  { id: "place-4", name: "Al Masmak Fort", description: "Historic clay and mud-brick fortress that played a key role in the founding of Saudi Arabia by King Abdulaziz in 1902.", category: "Historical", rating: 4.6, review_count: 5600, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content/1558171813-4c088753af8f.jpg", latitude: 24.6311, longitude: 46.7135, highlights: ["Museum exhibits", "Historic architecture", "Cultural events"], amenities: ["Free entry", "Guided tours", "Gift shop"], hours: "Sat-Thu: 8AM-9PM" },
  { id: "place-5", name: "Edge of the World", description: "Dramatic cliff formation northwest of Riyadh offering breathtaking views of the endless desert landscape stretching to the horizon.", category: "Nature", rating: 4.8, review_count: 4200, location: "Riyadh Province, Saudi Arabia", thumbnail: "/seed-images/content/1682687220742-aba13b6e50ba.jpg", latitude: 24.8167, longitude: 46.1503, highlights: ["Panoramic desert views", "Hiking trails", "Sunset photography"], amenities: ["Off-road accessible", "Camping areas", "Natural terrain"], hours: "Sunrise to Sunset" },
  { id: "place-6", name: "Al-Ula Heritage Village", description: "Ancient village with remarkable rock formations and the UNESCO World Heritage site of Hegra (Mada'in Salih).", category: "Heritage", rating: 4.9, review_count: 6700, location: "Al-Ula, Saudi Arabia", thumbnail: "/seed-images/content/1519167758481-83f550bb49b3.jpg", latitude: 26.6073, longitude: 37.9208, highlights: ["UNESCO World Heritage", "Nabataean tombs", "Desert canyon scenery"], amenities: ["Visitor center", "Guided tours", "Hotel accommodations"], hours: "Daily: 6AM-6PM" },
  { id: "place-7", name: "Jeddah Corniche", description: "Beautiful waterfront promenade stretching 30km along the Red Sea with parks, sculptures, and dining options.", category: "Leisure", rating: 4.4, review_count: 7800, location: "Jeddah, Saudi Arabia", thumbnail: "/seed-images/content/1578662996442-48f60103fc96.jpg", latitude: 21.5429, longitude: 39.1379, highlights: ["King Fahd Fountain", "Outdoor sculptures", "Waterfront dining"], amenities: ["Free access", "Parking", "Restaurants", "Playgrounds"], hours: "Open 24 hours" },
  { id: "place-8", name: "Diriyah", description: "Historic seat of the first Saudi state, now a cultural destination with museums, restaurants, and the At-Turaif UNESCO site.", category: "Heritage", rating: 4.7, review_count: 4500, location: "Riyadh, Saudi Arabia", thumbnail: "/seed-images/content/1454165804606-c3d57bc86b40.jpg", latitude: 24.7342, longitude: 46.5725, highlights: ["At-Turaif UNESCO site", "Bujairi Terrace", "Cultural festivals"], amenities: ["Parking", "Restaurants", "Gift shops", "Guided tours"], hours: "Sun-Thu: 9AM-9PM, Fri-Sat: 2PM-11PM" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const placeId = req.params.id
  const place = SEED_PLACES.find(p => p.id === placeId)

  if (!place) {
    return res.status(404).json({ message: `Place ${placeId} not found` })
  }

  const reviews = [
    { id: `rev-${placeId}-1`, author: "Mohammed Al-Rashid", rating: 5, content: "An absolutely stunning place. Must visit when in Saudi Arabia!", created_at: "2026-01-15T10:30:00Z" },
    { id: `rev-${placeId}-2`, author: "Sarah K.", rating: 4, content: "Beautiful and well-maintained. Can get crowded on weekends.", created_at: "2026-01-20T14:00:00Z" },
    { id: `rev-${placeId}-3`, author: "Ahmed Hassan", rating: 5, content: "One of the best experiences I've had. Highly recommended.", created_at: "2026-02-01T09:15:00Z" },
    { id: `rev-${placeId}-4`, author: "Fatima Al-Zahrani", rating: 4, content: "Great atmosphere and friendly staff. Would visit again.", created_at: "2026-02-10T16:45:00Z" },
    { id: `rev-${placeId}-5`, author: "Khalid Al-Dosari", rating: 5, content: "A perfect blend of history and modern facilities.", created_at: "2026-02-18T11:00:00Z" },
  ]

  return res.json({
    place: { ...place, reviews, review_count: place.review_count, total_reviews: reviews.length },
  })
}
