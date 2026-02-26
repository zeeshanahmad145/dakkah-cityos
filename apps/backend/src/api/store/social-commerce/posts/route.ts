import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "sc_001",
    name: "Riyadh Fashion Collective",
    handle: "riyadh-fashion-collective",
    description: "Curated Saudi fashion brands featuring modern abayas, thobes, and contemporary streetwear.",
    platform: "instagram",
    category: "Fashion",
    city: "Riyadh",
    country_code: "SA",
    followers: 245000,
    rating: 4.8,
    total_reviews: 3200,
    is_active: true,
    metadata: { thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg" },
  },
  {
    id: "sc_002",
    name: "Desert Glow Skincare",
    handle: "desert-glow-skincare",
    description: "Natural skincare products inspired by Arabian botanicals. Handcrafted in Jeddah.",
    platform: "tiktok",
    category: "Beauty",
    city: "Jeddah",
    country_code: "SA",
    followers: 180000,
    rating: 4.7,
    total_reviews: 5600,
    is_active: true,
    metadata: { thumbnail: "/seed-images/bundles/1556228578-0d85b1a4d571.jpg" },
  },
  {
    id: "sc_003",
    name: "Saudi Artisan Oud",
    handle: "saudi-artisan-oud",
    description: "Premium oud and bakhoor collections from master perfumers. Exclusive blends.",
    platform: "instagram",
    category: "Fragrance",
    city: "Mecca",
    country_code: "SA",
    followers: 320000,
    rating: 4.9,
    total_reviews: 8900,
    is_active: true,
    metadata: { thumbnail: "/seed-images/social-commerce/1547887538-e3a2f32cb1cc.jpg" },
  },
  {
    id: "sc_004",
    name: "Homemade Saudi Sweets",
    handle: "homemade-saudi-sweets",
    description: "Traditional Saudi sweets and dates gift boxes for Eid, Ramadan, and special occasions.",
    platform: "whatsapp",
    category: "Food",
    city: "Medina",
    country_code: "SA",
    followers: 95000,
    rating: 4.6,
    total_reviews: 2100,
    is_active: true,
    metadata: { thumbnail: "/seed-images/grocery/1548848221-0c2e497ed557.jpg" },
  },
  {
    id: "sc_005",
    name: "Tech Gadgets KSA",
    handle: "tech-gadgets-ksa",
    description: "Latest tech accessories, phone cases, and smart gadgets. Flash sales every week.",
    platform: "tiktok",
    category: "Electronics",
    city: "Riyadh",
    country_code: "SA",
    followers: 410000,
    rating: 4.4,
    total_reviews: 12000,
    is_active: true,
    metadata: { thumbnail: "/seed-images/bundles/1519389950473-47ba0277781c.jpg" },
  },
  {
    id: "sc_006",
    name: "Saudi Fitness Gear",
    handle: "saudi-fitness-gear",
    description: "Home gym equipment, supplements, and fitness apparel. Group buy deals.",
    platform: "instagram",
    category: "Fitness",
    city: "Dammam",
    country_code: "SA",
    followers: 156000,
    rating: 4.5,
    total_reviews: 4500,
    is_active: true,
    metadata: { thumbnail: "/seed-images/bookings/1534438327276-14e5300c3a48.jpg" },
  },
  {
    id: "sc_007",
    name: "Handmade Jewelry Arabia",
    handle: "handmade-jewelry-arabia",
    description: "Elegant handcrafted jewelry blending traditional Saudi motifs with contemporary designs.",
    platform: "instagram",
    category: "Jewelry",
    city: "Jeddah",
    country_code: "SA",
    followers: 278000,
    rating: 4.8,
    total_reviews: 6700,
    is_active: true,
    metadata: { thumbnail: "/seed-images/social-commerce/1547887538-e3a2f32cb1cc.jpg" },
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit = "20", offset = "0", platform, category, search } = req.query as Record<string, string | undefined>

  let items = [...SEED_DATA]

  if (platform) {
    items = items.filter(i => i.platform.toLowerCase() === platform.toLowerCase())
  }
  if (category) {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase())
  }
  if (search) {
    const q = search.toLowerCase()
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    )
  }

  const start = Number(offset)
  const end = start + Number(limit)
  const paged = items.slice(start, end)

  res.json({ items: paged, count: items.length, limit: Number(limit), offset: start })
}
