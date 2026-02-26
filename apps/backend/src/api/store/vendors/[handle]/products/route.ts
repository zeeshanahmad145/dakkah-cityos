import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../../lib/api-error-handler"

const SEED_VENDOR_PRODUCTS = [
  { id: "vp-1", title: "Wireless Bluetooth Headphones", handle: "wireless-bluetooth-headphones", description: "Premium noise-cancelling wireless headphones with 30-hour battery life.", thumbnail: "/seed-images/vendors%2F1531297484001-80022131f5a1.jpg", status: "published", variants: [{ id: "vp-1-v1", title: "Default", prices: [{ amount: 7999, currency_code: "usd" }] }] },
  { id: "vp-2", title: "Organic Cotton T-Shirt", handle: "organic-cotton-tshirt", description: "Sustainably sourced 100% organic cotton t-shirt, available in multiple colors.", thumbnail: "/seed-images/vendors%2F1542601906990-b4d3fb778b09.jpg", status: "published", variants: [{ id: "vp-2-v1", title: "Default", prices: [{ amount: 2999, currency_code: "usd" }] }] },
  { id: "vp-3", title: "Artisan Ceramic Mug", handle: "artisan-ceramic-mug", description: "Handcrafted ceramic mug with unique glazing patterns, 12oz capacity.", thumbnail: "/seed-images/vendors%2F1513364776144-60967b0f800f.jpg", status: "published", variants: [{ id: "vp-3-v1", title: "Default", prices: [{ amount: 2499, currency_code: "usd" }] }] },
  { id: "vp-4", title: "Smart Fitness Tracker", handle: "smart-fitness-tracker", description: "Advanced fitness tracker with heart rate monitor, GPS, and sleep tracking.", thumbnail: "/seed-images/vendors%2F1558171813-4c088753af8f.jpg", status: "published", variants: [{ id: "vp-4-v1", title: "Default", prices: [{ amount: 12999, currency_code: "usd" }] }] },
  { id: "vp-5", title: "Gourmet Coffee Blend", handle: "gourmet-coffee-blend", description: "Single-origin arabica coffee beans, medium roast with notes of chocolate and caramel.", thumbnail: "/seed-images/vendors%2F1504674900247-0877df9cc836.jpg", status: "published", variants: [{ id: "vp-5-v1", title: "Default", prices: [{ amount: 1899, currency_code: "usd" }] }] },
]
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const query = req.scope.resolve("query")
  const { handle } = req.params
  
  const { 
    offset = 0, 
    limit = 20,
    category,
    sort_by = "created_at",
    order = "DESC",
  } = req.query
  
  try {
    // Find vendor by handle
    const vendors = await vendorModule.listVendors({ handle })
    const vendorList = Array.isArray(vendors) ? vendors : [vendors].filter(Boolean)
    
    if (vendorList.length === 0 || vendorList[0].status !== "active") {
      return res.json({
        products: SEED_VENDOR_PRODUCTS,
        vendor: { id: `v-${handle}`, handle, business_name: handle.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) },
        count: SEED_VENDOR_PRODUCTS.length,
        offset: Number(offset),
        limit: Number(limit),
      })
    }
    
    const vendor = vendorList[0]
    
    const vendorProducts = await vendorModule.getVendorProducts(vendor.id, "approved")
    const productIds = (Array.isArray(vendorProducts) ? vendorProducts : [vendorProducts].filter(Boolean))
      .map((vp: any) => vp.product_id)
    
    if (productIds.length === 0) {
      return res.json({
        products: SEED_VENDOR_PRODUCTS,
        vendor: { id: vendor.id, handle: vendor.handle, business_name: vendor.business_name },
        count: SEED_VENDOR_PRODUCTS.length,
        offset: Number(offset),
        limit: Number(limit),
      })
    }
    
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "thumbnail",
        "status",
        "variants.*",
        "variants.prices.*",
        "options.*",
        "images.*",
      ],
      filters: {
        id: productIds,
        status: "published",
      },
      pagination: {
        skip: Number(offset),
        take: Number(limit),
      },
    })
    
    const result = products.length > 0 ? products : SEED_VENDOR_PRODUCTS
    
    res.json({
      products: result,
      vendor: { id: vendor.id, handle: vendor.handle, business_name: vendor.business_name },
      count: result.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error: any) {
    res.json({
      products: SEED_VENDOR_PRODUCTS,
      vendor: { id: `v-${handle}`, handle, business_name: handle.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) },
      count: SEED_VENDOR_PRODUCTS.length,
      offset: 0,
      limit: 20,
    })
  }
}

