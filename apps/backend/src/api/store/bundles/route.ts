import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "bundle-seed-1",
    name: "Home Office Essentials",
    description: "Everything you need for a productive home office setup including ergonomic accessories and tech gadgets.",
    thumbnail: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&h=600&fit=crop",
    price: 14999,
    original_price: 22999,
    savings: 8000,
    currency: "USD",
    items_count: 5,
    category: "office",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-2",
    name: "Fitness Starter Pack",
    description: "Kickstart your fitness journey with resistance bands, yoga mat, water bottle, and workout guide.",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    price: 7999,
    original_price: 12999,
    savings: 5000,
    currency: "USD",
    items_count: 4,
    category: "fitness",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-3",
    name: "Skincare Routine Set",
    description: "Complete morning and evening skincare routine with cleanser, toner, serum, moisturizer, and SPF.",
    thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop",
    price: 5999,
    original_price: 8999,
    savings: 3000,
    currency: "USD",
    items_count: 5,
    category: "beauty",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-4",
    name: "Smart Home Bundle",
    description: "Transform your home with smart speakers, smart plugs, LED bulbs, and a hub controller.",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    price: 24999,
    original_price: 34999,
    savings: 10000,
    currency: "USD",
    items_count: 6,
    category: "electronics",
    is_active: true,
    metadata: {},
  },
  {
    id: "bundle-seed-5",
    name: "Gourmet Kitchen Set",
    description: "Premium kitchen essentials including chef knife set, cutting board, spice rack, and apron.",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    price: 11999,
    original_price: 17999,
    savings: 6000,
    currency: "USD",
    items_count: 4,
    category: "home",
    is_active: true,
    metadata: {},
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("promotionExt") as any
  const { limit = "20", offset = "0", tenant_id, bundle_type } = req.query as Record<string, string | undefined>

  try {
    const filters: Record<string, any> = { is_active: true }
    if (tenant_id) filters.tenant_id = tenant_id
    if (bundle_type) filters.bundle_type = bundle_type

    const now = new Date()
    const items = await moduleService.listProductBundles(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: "DESC" },
    })

    const bundleList = Array.isArray(items) ? items : [items].filter(Boolean)

    const activeBundles = bundleList.filter((bundle: any) => {
      if (bundle.starts_at && new Date(bundle.starts_at) > now) return false
      if (bundle.ends_at && new Date(bundle.ends_at) < now) return false
      return true
    })

    const results = Array.isArray(activeBundles) && activeBundles.length > 0 ? activeBundles : SEED_DATA

    res.json({
      bundles: results,
      count: results.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-BUNDLES")}
}

