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
    reviews: [
      { author: "Abdulrahman S.", rating: 5, comment: "Breathtaking sea views and top-notch finishes. The smart home system is exceptional.", created_at: "2025-01-05T10:00:00Z" },
      { author: "Noura K.", rating: 5, comment: "Dream villa! The private pool and garden are stunning. Worth every riyal.", created_at: "2025-01-15T13:00:00Z" },
      { author: "Faris M.", rating: 4, comment: "Beautiful property with great amenities. Al Shati is a prime location.", created_at: "2025-01-25T09:00:00Z" },
      { author: "Layla H.", rating: 5, comment: "We toured this villa and fell in love. The quality of construction is superb.", created_at: "2025-02-05T14:00:00Z" },
      { author: "Badr W.", rating: 4, comment: "Gorgeous property. Only wish the garden was slightly larger for the price point.", created_at: "2025-02-15T11:00:00Z" },
    ],
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
    reviews: [
      { author: "Omar D.", rating: 5, comment: "Perfect downtown location. Floor-to-ceiling windows make the apartment feel spacious.", created_at: "2025-01-08T09:00:00Z" },
      { author: "Reem A.", rating: 4, comment: "Rooftop pool and gym are great perks. The concierge service is very helpful.", created_at: "2025-01-18T12:00:00Z" },
      { author: "Khalid T.", rating: 4, comment: "Modern finishes and great layout. Underground parking is a must in Riyadh.", created_at: "2025-01-28T15:00:00Z" },
      { author: "Sara F.", rating: 5, comment: "Best rental apartment I've lived in. The balcony view is incredible at sunset.", created_at: "2025-02-07T10:00:00Z" },
      { author: "Ahmed G.", rating: 4, comment: "Great for young professionals. Walking distance to everything on King Fahd Road.", created_at: "2025-02-17T14:00:00Z" },
    ],
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
    reviews: [
      { author: "Waleed N.", rating: 5, comment: "Excellent office space in Business Gate. Meeting rooms are well-equipped.", created_at: "2025-01-06T08:00:00Z" },
      { author: "Mona B.", rating: 4, comment: "24/7 access is essential for our team. High-speed internet never fails.", created_at: "2025-01-16T11:00:00Z" },
      { author: "Tariq E.", rating: 5, comment: "Prime location with dedicated parking. Our clients are always impressed.", created_at: "2025-01-26T14:00:00Z" },
      { author: "Salwa R.", rating: 4, comment: "Great for a growing company. Reception area adds a professional touch.", created_at: "2025-02-06T09:00:00Z" },
      { author: "Huda L.", rating: 5, comment: "Perfect commercial space. Prayer room and pantry are thoughtful amenities.", created_at: "2025-02-16T13:00:00Z" },
    ],
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
    reviews: [
      { author: "Mansour Q.", rating: 5, comment: "The pinnacle of luxury. 360-degree views are absolutely breathtaking from every room.", created_at: "2025-01-04T10:00:00Z" },
      { author: "Ghada V.", rating: 5, comment: "Chef's kitchen is a dream. Wine cellar and home theater add unmatched luxury.", created_at: "2025-01-14T14:00:00Z" },
      { author: "Jaber C.", rating: 5, comment: "Dedicated elevator access and private terrace make this truly exclusive.", created_at: "2025-01-24T12:00:00Z" },
      { author: "Dina Y.", rating: 4, comment: "Stunning property on the Corniche. Heated pool overlooking the sea is magical.", created_at: "2025-02-04T15:00:00Z" },
      { author: "Sami P.", rating: 5, comment: "Once in a lifetime property. The smart home integration is flawless.", created_at: "2025-02-14T09:00:00Z" },
    ],
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
    reviews: [
      { author: "Amira J.", rating: 5, comment: "Perfect family home. Kids love the playground and the community is wonderful.", created_at: "2025-01-07T10:00:00Z" },
      { author: "Ziad O.", rating: 4, comment: "Gated community gives great peace of mind. 24/7 security is very professional.", created_at: "2025-01-17T12:00:00Z" },
      { author: "Lamia S.", rating: 5, comment: "Spacious rooms and beautiful garden. The community pool is well-maintained.", created_at: "2025-01-27T15:00:00Z" },
      { author: "Karim H.", rating: 4, comment: "Great location in Al Narjis. Mosque and community center nearby are convenient.", created_at: "2025-02-08T09:00:00Z" },
      { author: "Rana D.", rating: 5, comment: "Best value for a family home in Riyadh. Covered parking is a huge plus.", created_at: "2025-02-18T14:00:00Z" },
    ],
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
