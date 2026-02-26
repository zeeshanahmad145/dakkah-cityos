import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAdPlacementSchema = z.object({
  tenant_id: z.string().min(1),
  name: z.string().min(1),
  placement_type: z.enum([
    "homepage_banner",
    "category_page",
    "search_results",
    "product_page",
    "sidebar",
    "footer",
    "email",
    "push",
  ]),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  max_ads: z.number().optional(),
  price_per_day: z.number().optional(),
  currency_code: z.string().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const SEED_AD_PACKAGES = [
  { id: "ad-1", name: "Homepage Banner", description: "Premium placement on the homepage hero banner. Maximum visibility for your brand.", placement_type: "homepage_banner", dimensions: { width: 1200, height: 400 }, price_per_day: 5000, currency_code: "usd", impressions_estimate: "50,000+/day", is_active: true, thumbnail: "/seed-images/advertising/1454165804606-c3d57bc86b40.jpg", created_at: "2025-01-15T00:00:00Z" },
  { id: "ad-2", name: "Category Page Spotlight", description: "Featured ad placement at the top of category pages. Target shoppers browsing specific categories.", placement_type: "category_page", dimensions: { width: 800, height: 250 }, price_per_day: 2500, currency_code: "usd", impressions_estimate: "25,000+/day", is_active: true, thumbnail: "/seed-images/advertising/1573164713988-8665fc963095.jpg", created_at: "2025-02-01T00:00:00Z" },
  { id: "ad-3", name: "Search Results Promotion", description: "Boost your products to the top of search results. Pay per click or per impression.", placement_type: "search_results", dimensions: { width: 600, height: 150 }, price_per_day: 1500, currency_code: "usd", impressions_estimate: "15,000+/day", is_active: true, thumbnail: "/seed-images/advertising/1504674900247-0877df9cc836.jpg", created_at: "2025-02-15T00:00:00Z" },
  { id: "ad-4", name: "Product Page Sidebar", description: "Display your ads alongside product pages. Great for cross-selling and complementary products.", placement_type: "sidebar", dimensions: { width: 300, height: 600 }, price_per_day: 1000, currency_code: "usd", impressions_estimate: "10,000+/day", is_active: true, thumbnail: "/seed-images/advertising/1454165804606-c3d57bc86b40.jpg", created_at: "2025-03-01T00:00:00Z" },
  { id: "ad-5", name: "Email Newsletter Feature", description: "Get featured in our weekly newsletter sent to 100,000+ subscribers.", placement_type: "email", dimensions: { width: 600, height: 200 }, price_per_day: 3000, currency_code: "usd", impressions_estimate: "100,000+ subscribers", is_active: true, thumbnail: "/seed-images/advertising/1573164713988-8665fc963095.jpg", created_at: "2025-03-15T00:00:00Z" },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as any
    const { limit = "20", offset = "0", tenant_id, placement_type, status } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (placement_type) filters.placement_type = placement_type
    if (status) filters.status = status
    const items = await mod.listAdPlacements(filters, { skip: Number(offset), take: Number(limit) })
    const list = Array.isArray(items) ? items : [items].filter(Boolean)
    const result = list.length > 0 ? list : SEED_AD_PACKAGES
    return res.json({ items: result, count: result.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    return res.json({ items: SEED_AD_PACKAGES, count: SEED_AD_PACKAGES.length, limit: 20, offset: 0 })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAdPlacementSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("advertising") as any
    const item = await mod.createAdPlacements(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-ADVERTISING")}
}
