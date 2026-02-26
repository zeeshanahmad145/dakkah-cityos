import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"


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
    metadata: { thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg" },
    thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg",
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
    metadata: { thumbnail: "/seed-images/event-ticketing%2F1507525428034-b723cf961d3e.jpg" },
    thumbnail: "/seed-images/event-ticketing%2F1507525428034-b723cf961d3e.jpg",
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
    metadata: { thumbnail: "/seed-images/travel%2F1476514525535-07fb3b4ae5f1.jpg" },
    thumbnail: "/seed-images/travel%2F1476514525535-07fb3b4ae5f1.jpg",
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
    metadata: { thumbnail: "/seed-images/travel%2F1469854523086-cc02fe5d8800.jpg" },
    thumbnail: "/seed-images/travel%2F1469854523086-cc02fe5d8800.jpg",
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
    metadata: { thumbnail: "/seed-images/travel%2F1476514525535-07fb3b4ae5f1.jpg" },
    thumbnail: "/seed-images/travel%2F1476514525535-07fb3b4ae5f1.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("travel") as any
    const { id } = req.params
    const [item] = await mod.listTravelProperties({ id }, { take: 1 })
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: { ...seedItem, room_types: [] } })
    }
    const roomTypes = await mod.listRoomTypes({ property_id: id }, { take: 100 })
    return res.json({ item: { ...item, room_types: roomTypes } })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: { ...seedItem, room_types: [] } })
  }
}
