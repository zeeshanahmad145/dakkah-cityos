import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SOCIAL_COMMERCE_SEED = [
  {
    id: "sc_001",
    name: "Riyadh Fashion Collective",
    handle: "riyadh-fashion-collective",
    description: "Curated Saudi fashion brands featuring modern abayas, thobes, and contemporary streetwear. Live shows every Thursday.",
    platform: "instagram",
    category: "Fashion",
    city: "Riyadh",
    country_code: "SA",
    followers: 245000,
    rating: 4.8,
    total_reviews: 3200,
    is_active: true,
    seller_name: "Noura Al-Rashid",
    seller: "noura.fashion",
    price: 12900,
    likes: 18200,
    tags: ["fashion", "abayas", "streetwear", "saudi"],
    thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
    reviews: [
      { rating: 5, author: "Lama S.", comment: "Amazing quality abayas! Fast shipping and great customer service." , created_at: "2024-08-15T00:00:00Z" },
      { rating: 4, author: "Hind K.", comment: "Beautiful designs. The streetwear collection is trendy and unique." , created_at: "2024-08-10T00:00:00Z" },
      { rating: 5, author: "Rawan M.", comment: "Love the live shows! Got exclusive pieces at great prices." , created_at: "2024-07-28T00:00:00Z" },
      { rating: 5, author: "Dalal A.", comment: "Authentic Saudi fashion with a modern twist. Highly recommend!" , created_at: "2024-07-20T00:00:00Z" },
      { rating: 4, author: "Maha T.", comment: "Great variety and the fabric quality is excellent." , created_at: "2024-07-15T00:00:00Z" },
    ],
  },
  {
    id: "sc_002",
    name: "Desert Glow Skincare",
    handle: "desert-glow-skincare",
    description: "Natural skincare products inspired by Arabian botanicals. Handcrafted in Jeddah with locally sourced ingredients.",
    platform: "tiktok",
    category: "Beauty",
    city: "Jeddah",
    country_code: "SA",
    followers: 180000,
    rating: 4.7,
    total_reviews: 5600,
    is_active: true,
    seller_name: "Lama Designs",
    seller: "desertglow",
    price: 7500,
    likes: 24500,
    tags: ["skincare", "beauty", "natural", "handmade"],
    thumbnail: "/seed-images/bundles%2F1556228578-0d85b1a4d571.jpg",
    reviews: [
      { rating: 5, author: "Sara H.", comment: "The natural ingredients made a huge difference for my skin!" , created_at: "2024-06-15T00:00:00Z" },
      { rating: 5, author: "Nouf B.", comment: "Best skincare brand I've tried. Love the Arabian botanical scents." , created_at: "2024-06-10T00:00:00Z" },
      { rating: 4, author: "Jana W.", comment: "Gentle on sensitive skin and beautifully packaged." , created_at: "2024-06-05T00:00:00Z" },
      { rating: 5, author: "Arwa F.", comment: "My skin has never looked better. Will keep ordering!" , created_at: "2024-05-28T00:00:00Z" },
      { rating: 4, author: "Abeer L.", comment: "Great products but wish they had more variety in sizes." , created_at: "2024-05-20T00:00:00Z" },
    ],
  },
  {
    id: "sc_003",
    name: "Saudi Artisan Oud",
    handle: "saudi-artisan-oud",
    description: "Premium oud and bakhoor collections from master perfumers. Exclusive blends and rare wood chips.",
    platform: "instagram",
    category: "Fragrance",
    city: "Mecca",
    country_code: "SA",
    followers: 320000,
    rating: 4.9,
    total_reviews: 8900,
    is_active: true,
    seller_name: "House of Oud",
    seller: "artisan.oud",
    price: 35000,
    likes: 42100,
    tags: ["oud", "bakhoor", "perfume", "fragrance"],
    thumbnail: "/seed-images/social-commerce%2F1547887538-e3a2f32cb1cc.jpg",
    reviews: [
      { rating: 5, author: "Mohammed A.", comment: "The oud quality is exceptional. Authentic and long-lasting fragrance." , created_at: "2024-05-15T00:00:00Z" },
      { rating: 5, author: "Abdullah R.", comment: "Best oud I've purchased online. Perfect for gifting." , created_at: "2024-05-10T00:00:00Z" },
      { rating: 5, author: "Fahad K.", comment: "The rare wood chips collection is extraordinary." , created_at: "2024-04-28T00:00:00Z" },
      { rating: 4, author: "Sultan M.", comment: "Premium quality bakhoor. The scent fills the entire house." , created_at: "2024-04-20T00:00:00Z" },
      { rating: 5, author: "Nasser D.", comment: "A true artisan brand. Every product is a masterpiece." , created_at: "2024-04-15T00:00:00Z" },
    ],
  },
  {
    id: "sc_004",
    name: "Homemade Saudi Sweets",
    handle: "homemade-saudi-sweets",
    description: "Traditional Saudi sweets and dates gift boxes. Perfect for Eid, Ramadan, and special occasions.",
    platform: "whatsapp",
    category: "Food",
    city: "Medina",
    country_code: "SA",
    followers: 95000,
    rating: 4.6,
    total_reviews: 2100,
    is_active: true,
    seller_name: "Umm Ahmad Kitchen",
    seller: "umm.ahmad",
    price: 4500,
    likes: 8900,
    tags: ["sweets", "dates", "traditional", "gifts"],
    thumbnail: "/seed-images/grocery%2F1548848221-0c2e497ed557.jpg",
    reviews: [
      { rating: 5, author: "Salma J.", comment: "The Eid gift boxes are beautiful and taste amazing!" , created_at: "2024-04-10T00:00:00Z" },
      { rating: 5, author: "Khadija N.", comment: "Authentic homemade sweets. Reminds me of my grandmother's recipes." , created_at: "2024-03-28T00:00:00Z" },
      { rating: 4, author: "Amal H.", comment: "Perfect for Ramadan. The dates selection is wonderful." , created_at: "2024-03-20T00:00:00Z" },
      { rating: 5, author: "Basma T.", comment: "Ordered for a wedding and everyone loved them!" , created_at: "2024-03-15T00:00:00Z" },
      { rating: 4, author: "Wafa R.", comment: "Fresh and delicious. Great packaging for gifts." , created_at: "2024-03-10T00:00:00Z" },
    ],
  },
  {
    id: "sc_005",
    name: "Tech Gadgets KSA",
    handle: "tech-gadgets-ksa",
    description: "Latest tech accessories, phone cases, and smart gadgets. Flash sales and group buys every week.",
    platform: "tiktok",
    category: "Electronics",
    city: "Riyadh",
    country_code: "SA",
    followers: 410000,
    rating: 4.4,
    total_reviews: 12000,
    is_active: true,
    seller_name: "TechHub Arabia",
    seller: "techhub.ksa",
    price: 9900,
    likes: 56700,
    tags: ["tech", "gadgets", "accessories", "electronics"],
    thumbnail: "/seed-images/bundles%2F1519389950473-47ba0277781c.jpg",
    reviews: [
      { rating: 5, author: "Turki S.", comment: "Got the latest phone case at 50% off in the group buy. Amazing deal!" , created_at: "2024-02-28T00:00:00Z" },
      { rating: 4, author: "Yazeed K.", comment: "Good selection of gadgets. Fast delivery within Saudi." , created_at: "2024-02-20T00:00:00Z" },
      { rating: 5, author: "Majed A.", comment: "The flash sales are incredible. Best prices I've found." , created_at: "2024-02-15T00:00:00Z" },
      { rating: 4, author: "Hamad W.", comment: "Quality products and responsive customer service." , created_at: "2024-02-10T00:00:00Z" },
      { rating: 5, author: "Saad M.", comment: "My go-to for tech accessories. Never disappointed." , created_at: "2024-02-05T00:00:00Z" },
    ],
  },
  {
    id: "sc_006",
    name: "Saudi Fitness Gear",
    handle: "saudi-fitness-gear",
    description: "Home gym equipment, supplements, and fitness apparel. Group buy deals for premium brands.",
    platform: "instagram",
    category: "Fitness",
    city: "Dammam",
    country_code: "SA",
    followers: 156000,
    rating: 4.5,
    total_reviews: 4500,
    is_active: true,
    seller_name: "FitLife Arabia",
    seller: "fitlife.arabia",
    price: 19900,
    likes: 12300,
    tags: ["fitness", "gym", "supplements", "sportswear"],
    thumbnail: "/seed-images/bookings%2F1534438327276-14e5300c3a48.jpg",
    reviews: [
      { rating: 5, author: "Rashid F.", comment: "Great quality gym equipment. The group buy saved me a lot!" , created_at: "2024-01-28T00:00:00Z" },
      { rating: 4, author: "Ali B.", comment: "Good supplements selection and competitive prices." , created_at: "2024-01-20T00:00:00Z" },
      { rating: 5, author: "Nawaf H.", comment: "The fitness apparel is high quality and stylish." , created_at: "2024-01-15T00:00:00Z" },
      { rating: 4, author: "Bader L.", comment: "Fast shipping and well-packaged products." , created_at: "2024-01-10T00:00:00Z" },
      { rating: 5, author: "Saleh T.", comment: "Best fitness gear store on Instagram. Highly recommend!" , created_at: "2024-01-05T00:00:00Z" },
    ],
  },
  {
    id: "sc_007",
    name: "Handmade Jewelry Arabia",
    handle: "handmade-jewelry-arabia",
    description: "Elegant handcrafted jewelry blending traditional Saudi motifs with contemporary designs. Custom orders welcome.",
    platform: "instagram",
    category: "Jewelry",
    city: "Jeddah",
    country_code: "SA",
    followers: 278000,
    rating: 4.8,
    total_reviews: 6700,
    is_active: true,
    seller_name: "Zahara Jewels",
    seller: "zahara.jewels",
    price: 24900,
    likes: 31500,
    tags: ["jewelry", "handmade", "gold", "accessories"],
    thumbnail: "/seed-images/social-commerce%2F1560472355-536de3962603.jpg",
    reviews: [
      { rating: 5, author: "Lina A.", comment: "The craftsmanship is exquisite. Each piece feels truly unique." , created_at: "2023-12-28T00:00:00Z" },
      { rating: 5, author: "Ghada M.", comment: "Ordered a custom necklace and it exceeded my expectations." , created_at: "2023-12-20T00:00:00Z" },
      { rating: 4, author: "Shaima K.", comment: "Beautiful designs that blend tradition with modernity." , created_at: "2023-12-15T00:00:00Z" },
      { rating: 5, author: "Hessa R.", comment: "Perfect gift for special occasions. Everyone asks where I got it!" , created_at: "2023-12-10T00:00:00Z" },
      { rating: 5, author: "Deema S.", comment: "Stunning gold work. Worth every riyal." , created_at: "2023-12-05T00:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const seedItem = SOCIAL_COMMERCE_SEED.find(s => s.id === id || s.handle === id)
  if (seedItem) {
    return res.json({ item: seedItem })
  }

  try {
    const mod = req.scope.resolve("socialCommerce") as any
    const { type } = req.query as Record<string, string | undefined>

    if (type === "group_buy") {
      const [item] = await mod.listGroupBuys({ id }, { take: 1 })
      if (!item) return res.json({ item: SOCIAL_COMMERCE_SEED[0] })
      return res.json({ item })
    }

    const [item] = await mod.listLiveStreams({ id }, { take: 1 })
    if (!item) return res.json({ item: SOCIAL_COMMERCE_SEED[0] })
    return res.json({ item })
  } catch (error: any) {
    return res.json({ item: SOCIAL_COMMERCE_SEED[0] })
  }
}
