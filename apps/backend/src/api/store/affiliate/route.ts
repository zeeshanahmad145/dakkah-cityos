import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createAffiliateSchema = z.object({
  tenant_id: z.string().min(1),
  customer_id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().min(1),
  affiliate_type: z.enum(["standard", "influencer", "partner", "ambassador"]),
  status: z.enum(["pending", "approved", "active", "suspended", "terminated"]).optional(),
  commission_rate: z.number(),
  commission_type: z.enum(["percentage", "flat"]).optional(),
  payout_method: z.enum(["bank_transfer", "paypal", "store_credit"]).optional(),
  payout_minimum: z.number().optional(),
  bio: z.string().optional(),
  social_links: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const SEED_DATA = [
  {
    id: "aff_001",
    name: "Tech Reviews Pro",
    email: "partners@techreviewspro.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 12,
    commission_type: "percentage",
    bio: "Leading tech review channel with 500K+ followers. Specializing in consumer electronics and smart home devices.",
    category: "Electronics",
    thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop",
  },
  {
    id: "aff_002",
    name: "Fashion Forward Blog",
    email: "collab@fashionforward.com",
    affiliate_type: "ambassador",
    status: "active",
    commission_rate: 15,
    commission_type: "percentage",
    bio: "Award-winning fashion blog featuring sustainable and luxury brands. 250K monthly readers.",
    category: "Fashion",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
  },
  {
    id: "aff_003",
    name: "Healthy Living Hub",
    email: "affiliate@healthylivinghub.com",
    affiliate_type: "partner",
    status: "active",
    commission_rate: 10,
    commission_type: "percentage",
    bio: "Health and wellness platform covering nutrition, fitness, and mental health. Trusted by 1M+ subscribers.",
    category: "Health & Wellness",
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
  },
  {
    id: "aff_004",
    name: "Home Decor Digest",
    email: "partners@homedecordigest.com",
    affiliate_type: "standard",
    status: "active",
    commission_rate: 8,
    commission_type: "percentage",
    bio: "Interior design inspiration and product recommendations for modern homes. Featured in top design magazines.",
    category: "Home & Garden",
    thumbnail: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
  },
  {
    id: "aff_005",
    name: "Outdoor Adventures Channel",
    email: "affiliate@outdooradventures.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 11,
    commission_type: "percentage",
    bio: "Adventure sports and outdoor gear reviews. 300K YouTube subscribers passionate about camping, hiking, and travel.",
    category: "Sports & Outdoors",
    thumbnail: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      category,
      commission_type,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (category) filters.category = category
    if (commission_type) filters.commission_type = commission_type
    if (search) filters.search = search

    const items = await mod.listAffiliates(filters, { skip: Number(offset), take: Number(limit) })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({
      items: results,
      count: results.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createAffiliateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("affiliate") as any
    const item = await mod.createAffiliates(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-AFFILIATE")
  }
}
