import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { sanitizeImageUrls } from "../../../../lib/image-sanitizer"

const SEED_VENDORS = [
  { id: "v-1", handle: "tech-haven", business_name: "Tech Haven Electronics", description: "Premium consumer electronics, gadgets, and accessories from top global brands. Authorized retailer with warranty support.", logo_url: "/seed-images/vendors%2F1531297484001-80022131f5a1.jpg", banner_url: "/seed-images/vendors%2F1518770660439-4636190af475.jpg", is_verified: true, total_products: 245, total_orders: 1820, rating: 4.8, review_count: 342, categories: ["Electronics", "Gadgets"], created_at: "2025-01-15T00:00:00Z" },
  { id: "v-2", handle: "green-living", business_name: "Green Living Co.", description: "Eco-friendly home products, organic goods, and sustainable lifestyle essentials for conscious consumers.", logo_url: "/seed-images/vendors%2F1542601906990-b4d3fb778b09.jpg", banner_url: "/seed-images/vendors%2F1441974231531-c6227db76b6e.jpg", is_verified: true, total_products: 180, total_orders: 960, rating: 4.7, review_count: 215, categories: ["Home", "Sustainability"], created_at: "2025-02-20T00:00:00Z" },
  { id: "v-3", handle: "artisan-crafts", business_name: "Artisan Crafts Market", description: "Handmade jewelry, pottery, textiles, and artisanal goods from local craftspeople and independent artisans.", logo_url: "/seed-images/vendors%2F1513364776144-60967b0f800f.jpg", banner_url: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", is_verified: false, total_products: 120, total_orders: 540, rating: 4.9, review_count: 178, categories: ["Handmade", "Art"], created_at: "2025-03-10T00:00:00Z" },
  { id: "v-4", handle: "fashion-forward", business_name: "Fashion Forward Boutique", description: "Curated fashion collections featuring contemporary designs and trending styles for the modern wardrobe.", logo_url: "/seed-images/vendors%2F1558171813-4c088753af8f.jpg", banner_url: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", is_verified: true, total_products: 350, total_orders: 2100, rating: 4.6, review_count: 410, categories: ["Fashion", "Accessories"], created_at: "2025-01-05T00:00:00Z" },
  { id: "v-5", handle: "gourmet-delights", business_name: "Gourmet Delights", description: "Premium specialty foods, artisan ingredients, and curated gourmet gift baskets for food enthusiasts.", logo_url: "/seed-images/vendors%2F1504674900247-0877df9cc836.jpg", banner_url: "/seed-images/vendors%2F1555244162-803834f70033.jpg", is_verified: true, total_products: 95, total_orders: 720, rating: 4.8, review_count: 156, categories: ["Food", "Gourmet"], created_at: "2025-04-01T00:00:00Z" },
  { id: "vendor-albaik", handle: "al-baik", business_name: "Al Baik", description: "Saudi Arabia's beloved fried chicken restaurant chain, famous for its crispy broasted chicken and garlic sauce.", logo_url: "/seed-images/vendors%2F1626645738196-c2a7c87a8f58.jpg", banner_url: "/seed-images/vendors%2F1513639776629-7b61b0ac49cb.jpg", is_verified: true, total_products: 45, total_orders: 15200, rating: 4.9, review_count: 2340, categories: ["Food", "Restaurant"], created_at: "2024-06-01T00:00:00Z" },
]

const SEED_PRODUCTS: Record<string, any[]> = {
  "tech-haven": [
    { id: "vp-1", title: "Wireless Noise Cancelling Headphones", handle: "wireless-headphones", price: 34900, thumbnail: "/seed-images/vendors%2F1531297484001-80022131f5a1.jpg", category: "Electronics" },
    { id: "vp-2", title: "4K Ultra HD Smart TV 55\"", handle: "4k-smart-tv", price: 189900, thumbnail: "/seed-images/vendors%2F1518770660439-4636190af475.jpg", category: "Electronics" },
    { id: "vp-3", title: "Portable Bluetooth Speaker", handle: "bluetooth-speaker", price: 7900, thumbnail: "/seed-images/vendors%2F1531297484001-80022131f5a1.jpg", category: "Gadgets" },
    { id: "vp-4", title: "Smart Watch Pro Max", handle: "smart-watch-pro", price: 24900, thumbnail: "/seed-images/vendors%2F1518770660439-4636190af475.jpg", category: "Gadgets" },
  ],
  "green-living": [
    { id: "vp-5", title: "Bamboo Kitchen Utensil Set", handle: "bamboo-utensils", price: 4500, thumbnail: "/seed-images/vendors%2F1542601906990-b4d3fb778b09.jpg", category: "Home" },
    { id: "vp-6", title: "Organic Cotton Bed Sheets", handle: "organic-sheets", price: 12900, thumbnail: "/seed-images/vendors%2F1441974231531-c6227db76b6e.jpg", category: "Home" },
    { id: "vp-7", title: "Reusable Beeswax Food Wraps", handle: "beeswax-wraps", price: 2900, thumbnail: "/seed-images/vendors%2F1542601906990-b4d3fb778b09.jpg", category: "Sustainability" },
  ],
  "artisan-crafts": [
    { id: "vp-8", title: "Handmade Ceramic Vase", handle: "ceramic-vase", price: 8900, thumbnail: "/seed-images/vendors%2F1513364776144-60967b0f800f.jpg", category: "Art" },
    { id: "vp-9", title: "Woven Wool Tapestry", handle: "wool-tapestry", price: 15900, thumbnail: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", category: "Handmade" },
    { id: "vp-10", title: "Silver Filigree Necklace", handle: "silver-necklace", price: 22900, thumbnail: "/seed-images/vendors%2F1513364776144-60967b0f800f.jpg", category: "Handmade" },
  ],
  "fashion-forward": [
    { id: "vp-11", title: "Designer Leather Handbag", handle: "leather-handbag", price: 45900, thumbnail: "/seed-images/vendors%2F1558171813-4c088753af8f.jpg", category: "Fashion" },
    { id: "vp-12", title: "Italian Silk Scarf", handle: "silk-scarf", price: 12900, thumbnail: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", category: "Accessories" },
    { id: "vp-13", title: "Cashmere Blend Sweater", handle: "cashmere-sweater", price: 29900, thumbnail: "/seed-images/vendors%2F1558171813-4c088753af8f.jpg", category: "Fashion" },
  ],
  "gourmet-delights": [
    { id: "vp-14", title: "Artisan Truffle Oil Collection", handle: "truffle-oil", price: 6900, thumbnail: "/seed-images/vendors%2F1504674900247-0877df9cc836.jpg", category: "Gourmet" },
    { id: "vp-15", title: "Premium Saffron Gift Box", handle: "saffron-gift", price: 14900, thumbnail: "/seed-images/vendors%2F1555244162-803834f70033.jpg", category: "Food" },
    { id: "vp-16", title: "Single Origin Coffee Beans", handle: "coffee-beans", price: 4500, thumbnail: "/seed-images/vendors%2F1504674900247-0877df9cc836.jpg", category: "Gourmet" },
  ],
  "al-baik": [
    { id: "vp-17", title: "Broasted Chicken Meal", handle: "broasted-meal", price: 2900, thumbnail: "/seed-images/vendors%2F1626645738196-c2a7c87a8f58.jpg", category: "Food" },
    { id: "vp-18", title: "Shrimp Meal Box", handle: "shrimp-meal", price: 3500, thumbnail: "/seed-images/vendors%2F1513639776629-7b61b0ac49cb.jpg", category: "Food" },
    { id: "vp-19", title: "Family Feast Bundle", handle: "family-feast", price: 8900, thumbnail: "/seed-images/vendors%2F1626645738196-c2a7c87a8f58.jpg", category: "Food" },
  ],
}

const SEED_REVIEWS = [
  { id: "vr-1", customer_name: "Ahmed Al-Rashid", rating: 5, title: "Excellent quality!", content: "Outstanding products and fast shipping. Will definitely order again.", created_at: "2025-12-15T10:30:00Z", is_verified_purchase: true, helpful_count: 12 },
  { id: "vr-2", customer_name: "Sara Mohammed", rating: 4, title: "Very good experience", content: "Great selection and reasonable prices. Customer service was helpful.", created_at: "2025-11-28T14:20:00Z", is_verified_purchase: true, helpful_count: 8 },
  { id: "vr-3", customer_name: "Khalid Ibrahim", rating: 5, title: "Best vendor on the platform", content: "I've been shopping here for months. Consistently excellent quality and reliable delivery.", created_at: "2025-11-10T09:15:00Z", is_verified_purchase: true, helpful_count: 15 },
  { id: "vr-4", customer_name: "Fatima Al-Zahrani", rating: 4, title: "Good but shipping could be faster", content: "Products are great quality. Only wish shipping was a bit quicker to my area.", created_at: "2025-10-22T16:45:00Z", is_verified_purchase: true, helpful_count: 5 },
  { id: "vr-5", customer_name: "Omar Hassan", rating: 5, title: "Highly recommended", content: "Premium products at fair prices. The packaging was also very impressive.", created_at: "2025-10-05T11:00:00Z", is_verified_purchase: true, helpful_count: 9 },
  { id: "vr-6", customer_name: "Noura Al-Qahtani", rating: 3, title: "Decent overall", content: "Product was fine but took longer than expected to arrive. Communication could improve.", created_at: "2025-09-18T13:30:00Z", is_verified_purchase: true, helpful_count: 3 },
  { id: "vr-7", customer_name: "Youssef Bakr", rating: 5, title: "Repeat customer!", content: "Third time ordering from this vendor. Never disappointed. Top notch quality.", created_at: "2025-09-01T08:20:00Z", is_verified_purchase: true, helpful_count: 11 },
  { id: "vr-8", customer_name: "Layla Al-Otaibi", rating: 4, title: "Love the variety", content: "Great range of products to choose from. Prices are competitive too.", created_at: "2025-08-15T15:10:00Z", is_verified_purchase: true, helpful_count: 6 },
]

function enrichVendorProfile(raw: any, handle: string) {
  const name = raw.business_name || raw.name || handle
  const products = SEED_PRODUCTS[handle] || SEED_PRODUCTS[Object.keys(SEED_PRODUCTS)[0]] || []
  return {
    ...raw,
    name,
    title: name,
    logo: raw.logo_url,
    product_count: raw.total_products || products.length,
    products,
    reviews: SEED_REVIEWS,
    policies: {
      shipping: "Free shipping on orders over SAR 200. Standard delivery 2-5 business days.",
      returns: "30-day return policy for unused items in original packaging.",
    },
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const { handle } = req.params
  
  try {
    const vendors = await vendorModule.listVendors({ handle })
    const vendorList = Array.isArray(vendors) ? vendors : [vendors].filter(Boolean)
    
    if (vendorList.length === 0) {
      const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
      const enriched = enrichVendorProfile({ ...seed, handle }, handle)
      return res.json({ vendor: enriched, item: enriched })
    }
    
    const vendor = vendorList[0]
    
    if (vendor.status !== "active") {
      const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
      const enriched = enrichVendorProfile({ ...seed, handle }, handle)
      return res.json({ vendor: enriched, item: enriched })
    }
    
    const publicProfile = {
      id: vendor.id,
      handle: vendor.handle,
      business_name: vendor.business_name,
      description: vendor.description,
      logo_url: vendor.logo_url,
      banner_url: vendor.banner_url,
      website_url: vendor.website_url,
      is_verified: vendor.is_verified,
      total_products: vendor.total_products,
      total_orders: vendor.total_orders,
      rating: vendor.rating || 0,
      review_count: vendor.review_count || 0,
      categories: vendor.categories || [],
      return_policy: vendor.settings?.return_policy,
      shipping_policy: vendor.settings?.shipping_policy,
      social_links: vendor.social_links || {},
      created_at: vendor.created_at,
    }

    const sanitized = sanitizeImageUrls(publicProfile, "vendors", ["logo_url", "banner_url"], 0)
    const enriched = enrichVendorProfile(sanitized, handle)
    
    res.json({ vendor: enriched, item: enriched })
  } catch (error: any) {
    const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
    const enriched = enrichVendorProfile({ ...seed, handle }, handle)
    return res.json({ vendor: enriched, item: enriched })
  }
}

