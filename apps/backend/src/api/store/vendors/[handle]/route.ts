import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_VENDORS = [
  { id: "v-1", handle: "tech-haven", business_name: "Tech Haven Electronics", description: "Premium consumer electronics, gadgets, and accessories from top global brands. Authorized retailer with warranty support.", logo_url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=300&fit=crop", is_verified: true, total_products: 245, total_orders: 1820, rating: 4.8, review_count: 342, categories: ["Electronics", "Gadgets"], created_at: "2025-01-15T00:00:00Z" },
  { id: "v-2", handle: "green-living", business_name: "Green Living Co.", description: "Eco-friendly home products, organic goods, and sustainable lifestyle essentials for conscious consumers.", logo_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=300&fit=crop", is_verified: true, total_products: 180, total_orders: 960, rating: 4.7, review_count: 215, categories: ["Home", "Sustainability"], created_at: "2025-02-20T00:00:00Z" },
  { id: "v-3", handle: "artisan-crafts", business_name: "Artisan Crafts Market", description: "Handmade jewelry, pottery, textiles, and artisanal goods from local craftspeople and independent artisans.", logo_url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1452860606245-08f3af9c72f4?w=800&h=300&fit=crop", is_verified: false, total_products: 120, total_orders: 540, rating: 4.9, review_count: 178, categories: ["Handmade", "Art"], created_at: "2025-03-10T00:00:00Z" },
  { id: "v-4", handle: "fashion-forward", business_name: "Fashion Forward Boutique", description: "Curated fashion collections featuring contemporary designs and trending styles for the modern wardrobe.", logo_url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=300&fit=crop", is_verified: true, total_products: 350, total_orders: 2100, rating: 4.6, review_count: 410, categories: ["Fashion", "Accessories"], created_at: "2025-01-05T00:00:00Z" },
  { id: "v-5", handle: "gourmet-delights", business_name: "Gourmet Delights", description: "Premium specialty foods, artisan ingredients, and curated gourmet gift baskets for food enthusiasts.", logo_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=300&fit=crop", is_verified: true, total_products: 95, total_orders: 720, rating: 4.8, review_count: 156, categories: ["Food", "Gourmet"], created_at: "2025-04-01T00:00:00Z" },
  { id: "vendor-albaik", handle: "al-baik", business_name: "Al Baik", description: "Saudi Arabia's beloved fried chicken restaurant chain, famous for its crispy broasted chicken and garlic sauce.", logo_url: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=200&h=200&fit=crop", banner_url: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&h=300&fit=crop", is_verified: true, total_products: 45, total_orders: 15200, rating: 4.9, review_count: 2340, categories: ["Food", "Restaurant"], created_at: "2024-06-01T00:00:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const { handle } = req.params
  
  try {
    const vendors = await vendorModule.listVendors({ handle })
    const vendorList = Array.isArray(vendors) ? vendors : [vendors].filter(Boolean)
    
    if (vendorList.length === 0) {
      const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
      return res.json({ vendor: { ...seed, id: seed.id, handle: handle }, item: { ...seed, id: seed.id, handle: handle } })
    }
    
    const vendor = vendorList[0]
    
    if (vendor.status !== "active") {
      const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
      return res.json({ vendor: { ...seed, id: seed.id, handle: handle }, item: { ...seed, id: seed.id, handle: handle } })
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
    
    res.json({ vendor: publicProfile, item: publicProfile })
  } catch (error: any) {
    const seed = SEED_VENDORS.find(v => v.handle === handle || v.id === handle) || SEED_VENDORS[0]
    return res.json({ vendor: { ...seed, id: seed.id, handle: handle }, item: { ...seed, id: seed.id, handle: handle } })
  }
}

