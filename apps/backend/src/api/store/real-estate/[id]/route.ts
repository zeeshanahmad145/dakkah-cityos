import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"


const SEED_DATA = [
  {
    id: "re_seed_1",
    tenant_id: "default",
    title: "Luxury Waterfront Villa",
    description: "Stunning 5-bedroom villa with private pool, landscaped garden, and panoramic sea views. Premium finishes throughout with smart home technology.",
    listing_type: "sale",
    property_type: "villa",
    status: "active",
    price: 85000000,
    currency_code: "SAR",
    address_line1: "Al Shati District",
    city: "Jeddah",
    bedrooms: 5,
    bathrooms: 6,
    area_sqm: 650,
    metadata: { thumbnail: "/seed-images/real-estate%2F1600596542815-ffad4c1539a9.jpg" },
    thumbnail: "/seed-images/real-estate%2F1600596542815-ffad4c1539a9.jpg",
    amenities: ["Private pool", "Landscaped garden", "Smart home system", "Private garage", "Sea views", "Maid's room", "Central A/C", "Security system"],
  },
  {
    id: "re_seed_2",
    tenant_id: "default",
    title: "Modern Downtown Apartment",
    description: "Sleek 2-bedroom apartment in the heart of the city with floor-to-ceiling windows, modern kitchen, and access to rooftop pool and gym.",
    listing_type: "rent",
    property_type: "apartment",
    status: "active",
    price: 12000000,
    currency_code: "SAR",
    address_line1: "King Fahd Road",
    city: "Riyadh",
    bedrooms: 2,
    bathrooms: 2,
    area_sqm: 120,
    metadata: { thumbnail: "/seed-images/financial-products%2F1560518883-ce09059eeffa.jpg" },
    thumbnail: "/seed-images/financial-products%2F1560518883-ce09059eeffa.jpg",
    amenities: ["Rooftop pool", "Gym", "Concierge", "Underground parking", "Floor-to-ceiling windows", "Modern kitchen", "Balcony"],
  },
  {
    id: "re_seed_3",
    tenant_id: "default",
    title: "Premium Commercial Office Space",
    description: "Class A office space spanning 500 sqm with dedicated parking, meeting rooms, and high-speed connectivity in prime business district.",
    listing_type: "rent",
    property_type: "office",
    status: "active",
    price: 25000000,
    currency_code: "SAR",
    address_line1: "Business Gate",
    city: "Riyadh",
    bedrooms: 0,
    bathrooms: 4,
    area_sqm: 500,
    metadata: { thumbnail: "/seed-images/government%2F1564013799919-ab600027ffc6.jpg" },
    thumbnail: "/seed-images/government%2F1564013799919-ab600027ffc6.jpg",
    amenities: ["Dedicated parking", "Meeting rooms", "High-speed internet", "Reception area", "24/7 access", "Pantry", "Prayer room"],
  },
  {
    id: "re_seed_4",
    tenant_id: "default",
    title: "Waterfront Penthouse Suite",
    description: "Exclusive penthouse with 360-degree views, private terrace, chef's kitchen, and dedicated elevator access. The pinnacle of luxury living.",
    listing_type: "sale",
    property_type: "apartment",
    status: "active",
    price: 120000000,
    currency_code: "SAR",
    address_line1: "Corniche Road",
    city: "Jeddah",
    bedrooms: 4,
    bathrooms: 5,
    area_sqm: 450,
    metadata: { thumbnail: "/seed-images/real-estate%2F1600585154340-be6161a56a0c.jpg" },
    thumbnail: "/seed-images/real-estate%2F1600585154340-be6161a56a0c.jpg",
    amenities: ["360-degree views", "Private terrace", "Chef's kitchen", "Dedicated elevator", "Wine cellar", "Home theater", "Heated pool", "Smart home"],
  },
  {
    id: "re_seed_5",
    tenant_id: "default",
    title: "Spacious Family Townhouse",
    description: "Beautiful 4-bedroom townhouse in a gated community with shared pool, playground, and 24/7 security. Perfect for families.",
    listing_type: "sale",
    property_type: "villa",
    status: "active",
    price: 35000000,
    currency_code: "SAR",
    address_line1: "Al Narjis District",
    city: "Riyadh",
    bedrooms: 4,
    bathrooms: 4,
    area_sqm: 320,
    metadata: { thumbnail: "/seed-images/real-estate%2F1502672260266-1c1ef2d93688.jpg" },
    thumbnail: "/seed-images/real-estate%2F1502672260266-1c1ef2d93688.jpg",
    amenities: ["Shared pool", "Playground", "24/7 security", "Gated community", "Garden", "Covered parking", "Mosque nearby", "Community center"],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("realEstate") as any
    const { id } = req.params
    const item = await mod.retrievePropertyListing(id)
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
