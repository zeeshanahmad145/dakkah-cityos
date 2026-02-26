import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"
import { sanitizeList } from "../../../lib/image-sanitizer"

const SEED_VENDORS = [
  { id: "v-1", handle: "tech-haven", business_name: "Tech Haven Electronics", description: "Premium consumer electronics, gadgets, and accessories from top global brands.", logo_url: "/seed-images/vendors%2F1531297484001-80022131f5a1.jpg", banner_url: "/seed-images/vendors%2F1518770660439-4636190af475.jpg", is_verified: true, total_products: 245, total_orders: 1820, rating: 4.8, review_count: 342, categories: ["Electronics", "Gadgets"], verticals: ["retail"], created_at: "2025-01-15T00:00:00Z" },
  { id: "v-2", handle: "green-living", business_name: "Green Living Co.", description: "Eco-friendly home products, organic goods, and sustainable lifestyle essentials.", logo_url: "/seed-images/vendors%2F1542601906990-b4d3fb778b09.jpg", banner_url: "/seed-images/vendors%2F1441974231531-c6227db76b6e.jpg", is_verified: true, total_products: 180, total_orders: 960, rating: 4.7, review_count: 215, categories: ["Home", "Sustainability"], verticals: ["retail"], created_at: "2025-02-20T00:00:00Z" },
  { id: "v-3", handle: "artisan-crafts", business_name: "Artisan Crafts Market", description: "Handmade jewelry, pottery, textiles, and artisanal goods from local craftspeople.", logo_url: "/seed-images/vendors%2F1513364776144-60967b0f800f.jpg", banner_url: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", is_verified: false, total_products: 120, total_orders: 540, rating: 4.9, review_count: 178, categories: ["Handmade", "Art"], verticals: ["retail"], created_at: "2025-03-10T00:00:00Z" },
  { id: "v-4", handle: "fashion-forward", business_name: "Fashion Forward Boutique", description: "Curated fashion collections featuring contemporary designs and trending styles.", logo_url: "/seed-images/vendors%2F1558171813-4c088753af8f.jpg", banner_url: "/seed-images/vendors%2F1441984904996-e0b6ba687e04.jpg", is_verified: true, total_products: 350, total_orders: 2100, rating: 4.6, review_count: 410, categories: ["Fashion", "Accessories"], verticals: ["retail"], created_at: "2025-01-05T00:00:00Z" },
  { id: "v-5", handle: "gourmet-delights", business_name: "Gourmet Delights", description: "Premium specialty foods, artisan ingredients, and curated gourmet gift baskets.", logo_url: "/seed-images/vendors%2F1504674900247-0877df9cc836.jpg", banner_url: "/seed-images/vendors%2F1555244162-803834f70033.jpg", is_verified: true, total_products: 95, total_orders: 720, rating: 4.8, review_count: 156, categories: ["Food", "Gourmet"], verticals: ["retail"], created_at: "2025-04-01T00:00:00Z" },
]

/**
 * GET /store/vendors
 * List all public vendors
 * Supports filtering by tenant_id or marketplace_id via TenantRelationship
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorModule = req.scope.resolve("vendor") as any
  const tenantModule = req.scope.resolve("tenant") as any
  
  const { 
    offset = 0, 
    limit = 50,
    category,
    is_verified,
    sort_by = "business_name",
    order = "ASC",
    tenant_id,
    marketplace_id,
  } = req.query

  const headerTenantId = req.headers["x-tenant-id"] as string | undefined
  
  try {
    const filters: Record<string, unknown> = {
      status: "active",
    }
    
    if (is_verified === "true") filters.is_verified = true

    const effectiveMarketplaceId = marketplace_id || headerTenantId
    if (effectiveMarketplaceId) {
      try {
        const marketplace = await tenantModule.retrieveTenant(effectiveMarketplaceId)
        
        if (!marketplace) {
          return res.status(404).json({
            message: "Marketplace not found",
            error: `Marketplace with ID ${effectiveMarketplaceId} does not exist`,
          })
        }
        
        const canHostVendors = marketplace.can_host_vendors === true || 
                               marketplace.tenant_type === "marketplace" || 
                               marketplace.tenant_type === "platform"
        
        if (!canHostVendors) {
          return res.status(400).json({
            message: "Invalid marketplace configuration",
            error: "Specified tenant is not configured to host vendors",
          })
        }
        
        const relationships = await tenantModule.listTenantRelationships({
          host_tenant_id: effectiveMarketplaceId,
          status: "active",
        })
        const relList = Array.isArray(relationships) ? relationships : [relationships].filter(Boolean)
        const vendorTenantIds = relList.map((r: any) => r.vendor_tenant_id)
        
        if (vendorTenantIds.length === 0) {
          return res.json({ vendors: [], count: 0, offset: Number(offset), limit: Number(limit) })
        }
        
        filters.tenant_id = vendorTenantIds
      } catch (error: any) {
        return handleApiError(res, error, "STORE-VENDORS")
      }
    } else if (tenant_id) {
      filters.tenant_id = tenant_id
    }
    
    const vendors = await vendorModule.listVendors(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { [sort_by as string]: order },
    })
    
    const vendorList = Array.isArray(vendors) ? vendors : [vendors].filter(Boolean)
    
    const publicVendors = vendorList.map((vendor: any) => ({
      id: vendor.id,
      handle: vendor.handle,
      business_name: vendor.business_name,
      description: vendor.description,
      logo_url: vendor.logo_url,
      banner_url: vendor.banner_url,
      is_verified: vendor.is_verified,
      total_products: vendor.total_products,
      total_orders: vendor.total_orders,
      rating: vendor.rating || 0,
      review_count: vendor.review_count || 0,
      categories: vendor.categories || [],
      verticals: vendor.verticals || [],
      created_at: vendor.created_at,
    }))
    
    const result = publicVendors.length > 0 ? sanitizeList(publicVendors, "vendors") : SEED_VENDORS
    res.json({
      vendors: result,
      items: result,
      count: result.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error: any) {
    return res.json({ vendors: SEED_VENDORS, items: SEED_VENDORS, count: SEED_VENDORS.length, offset: 0, limit: 50 })
  }
}

