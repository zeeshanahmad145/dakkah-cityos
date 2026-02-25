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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
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
    metadata: { thumbnail: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop" },
    thumbnail: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
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
