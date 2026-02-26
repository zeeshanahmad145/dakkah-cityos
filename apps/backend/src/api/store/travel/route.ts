import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "travel_seed_1",
    tenant_id: "default",
    name: "The Ritz-Carlton Riyadh",
    description: "Experience unparalleled luxury at The Ritz-Carlton Riyadh. Featuring elegant suites, world-class dining, a full-service spa, and stunning gardens.",
    property_type: "hotel",
    star_rating: 5,
    city: "Riyadh",
    country_code: "SA",
    price: 250000,
    currency: "SAR",
    currency_code: "SAR",
    amenities: ["Spa", "Pool", "Fine Dining", "Fitness Center", "Concierge", "Valet Parking"],
    rating: 4.9,
    review_count: 342,
    is_active: true,
    metadata: { thumbnail: "/seed-images/travel/1566073771259-6a8506099945.jpg" },
    thumbnail: "/seed-images/travel/1566073771259-6a8506099945.jpg",
  },
  {
    id: "travel_seed_2",
    tenant_id: "default",
    name: "Coral Beach Resort Jeddah",
    description: "Beachfront resort on the Red Sea with private beach, water sports, multiple restaurants, and family-friendly entertainment.",
    property_type: "resort",
    star_rating: 4,
    city: "Jeddah",
    country_code: "SA",
    price: 180000,
    currency: "SAR",
    currency_code: "SAR",
    amenities: ["Private Beach", "Water Sports", "Kids Club", "Pool", "Restaurant"],
    rating: 4.6,
    review_count: 218,
    is_active: true,
    metadata: { thumbnail: "/seed-images/travel/1520250497591-112f2f40a3f4.jpg" },
    thumbnail: "/seed-images/travel/1520250497591-112f2f40a3f4.jpg",
  },
  {
    id: "travel_seed_3",
    tenant_id: "default",
    name: "AlUla Heritage Hostel",
    description: "Charming boutique hostel near the historic sites of AlUla. Rooftop terrace with desert views, communal kitchen, and guided tour services.",
    property_type: "hostel",
    star_rating: 3,
    city: "AlUla",
    country_code: "SA",
    price: 35000,
    currency: "SAR",
    currency_code: "SAR",
    amenities: ["Rooftop Terrace", "Free WiFi", "Tour Desk", "Shared Kitchen"],
    rating: 4.4,
    review_count: 96,
    is_active: true,
    metadata: { thumbnail: "/seed-images/travel/1596436889106-be35e843f974.jpg" },
    thumbnail: "/seed-images/travel/1596436889106-be35e843f974.jpg",
  },
  {
    id: "travel_seed_4",
    tenant_id: "default",
    name: "KAFD Luxury Serviced Apartment",
    description: "Modern fully-furnished apartment in the King Abdullah Financial District. High-speed internet, gym access, and daily housekeeping included.",
    property_type: "apartment",
    star_rating: 4,
    city: "Riyadh",
    country_code: "SA",
    price: 120000,
    currency: "SAR",
    currency_code: "SAR",
    amenities: ["Kitchen", "Gym", "Housekeeping", "Business Center", "Parking"],
    rating: 4.7,
    review_count: 154,
    is_active: true,
    metadata: { thumbnail: "/seed-images/travel/1522708323590-d24dbb6b0267.jpg" },
    thumbnail: "/seed-images/travel/1522708323590-d24dbb6b0267.jpg",
  },
  {
    id: "travel_seed_5",
    tenant_id: "default",
    name: "Desert Oasis Private Villa",
    description: "Exclusive private villa on the edge of the Rub' al Khali desert. Infinity pool, outdoor dining, stargazing deck, and personal butler service.",
    property_type: "villa",
    star_rating: 5,
    city: "NEOM",
    country_code: "SA",
    price: 450000,
    currency: "SAR",
    currency_code: "SAR",
    amenities: ["Private Pool", "Butler Service", "Desert Safari", "Stargazing", "Gourmet Dining"],
    rating: 4.9,
    review_count: 67,
    is_active: true,
    metadata: { thumbnail: "/seed-images/travel/1613977257363-707ba9348227.jpg" },
    thumbnail: "/seed-images/travel/1613977257363-707ba9348227.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("travel") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      city,
      property_type,
      destination,
      duration,
      min_price,
      max_price,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (city) filters.city = city
    if (property_type) filters.property_type = property_type
    if (destination) filters.destination = destination
    if (duration) filters.duration = Number(duration)
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (search) filters.search = search
    filters.is_active = true

    const dbItems = await mod.listTravelProperties(filters, { skip: Number(offset), take: Number(limit) })
    const items = Array.isArray(dbItems) && dbItems.length > 0 ? dbItems : SEED_DATA
    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-TRAVEL")}
}

