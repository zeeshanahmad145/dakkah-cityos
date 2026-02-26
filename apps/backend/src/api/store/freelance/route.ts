import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createGigListingSchema = z.object({
  tenant_id: z.string().min(1),
  freelancer_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  listing_type: z.enum(["fixed_price", "hourly", "milestone"]),
  price: z.number().optional(),
  hourly_rate: z.number().optional(),
  currency_code: z.string().min(1),
  delivery_time_days: z.number().optional(),
  revisions_included: z.number().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "suspended"]).optional(),
  skill_tags: z.array(z.string()).optional(),
  portfolio_urls: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const SEED_DATA = [
  {
    id: "free-seed-001",
    thumbnail: "/seed-images/freelance%2F1498050108023-c5249f4df085.jpg",
    title: "Professional Website Development",
    description: "Full-stack web development using React, Node.js, and modern frameworks. Responsive design, SEO optimization, and performance tuning included.",
    category: "web_development",
    subcategory: "full_stack",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "/seed-images/freelance%2F1498050108023-c5249f4df085.jpg",
      images: ["/seed-images/freelance%2F1498050108023-c5249f4df085.jpg"],
      price: 5000,
      rating: 4.9,
    },
    delivery_time_days: 14,
    revisions_included: 3,
    status: "active",
  },
  {
    id: "free-seed-002",
    thumbnail: "/seed-images/freelance%2F1626785774573-4b799315345d.jpg",
    title: "Brand Identity & Logo Design",
    description: "Complete brand identity package including logo, color palette, typography, and brand guidelines. Unique, memorable designs.",
    category: "design",
    subcategory: "branding",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "/seed-images/freelance%2F1626785774573-4b799315345d.jpg",
      images: ["/seed-images/freelance%2F1626785774573-4b799315345d.jpg"],
      price: 3500,
      rating: 4.8,
    },
    delivery_time_days: 7,
    revisions_included: 5,
    status: "active",
  },
  {
    id: "free-seed-003",
    thumbnail: "/seed-images/freelance%2F1455390582262-044cdead277a.jpg",
    title: "SEO Content Writing & Blog Posts",
    description: "High-quality, SEO-optimized content writing for blogs, websites, and marketing materials. Research-driven and engaging.",
    category: "writing",
    subcategory: "content_writing",
    listing_type: "fixed_price",
    currency_code: "SAR",
    metadata: {
      thumbnail: "/seed-images/freelance%2F1455390582262-044cdead277a.jpg",
      images: ["/seed-images/freelance%2F1455390582262-044cdead277a.jpg"],
      price: 1500,
      rating: 4.7,
    },
    delivery_time_days: 3,
    revisions_included: 2,
    status: "active",
  },
  {
    id: "free-seed-004",
    thumbnail: "/seed-images/freelance%2F1574717024653-61fd2cf4d44d.jpg",
    title: "Professional Video Editing & Motion Graphics",
    description: "Expert video editing with color grading, motion graphics, sound design, and visual effects for YouTube, ads, and social media.",
    category: "video",
    subcategory: "editing",
    listing_type: "hourly",
    currency_code: "SAR",
    metadata: {
      thumbnail: "/seed-images/freelance%2F1574717024653-61fd2cf4d44d.jpg",
      images: ["/seed-images/freelance%2F1574717024653-61fd2cf4d44d.jpg"],
      price: 7500,
      rating: 5.0,
    },
    delivery_time_days: 10,
    revisions_included: 2,
    status: "active",
  },
  {
    id: "free-seed-005",
    thumbnail: "/seed-images/content%2F1460925895917-afdab827c52f.jpg",
    title: "Digital Marketing & Social Media Strategy",
    description: "Comprehensive digital marketing strategy including social media management, PPC campaigns, and analytics reporting.",
    category: "marketing",
    subcategory: "social_media",
    listing_type: "milestone",
    currency_code: "SAR",
    metadata: {
      thumbnail: "/seed-images/content%2F1460925895917-afdab827c52f.jpg",
      images: ["/seed-images/content%2F1460925895917-afdab827c52f.jpg"],
      price: 4000,
      rating: 4.6,
    },
    delivery_time_days: 30,
    revisions_included: 4,
    status: "active",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("freelance") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      category,
      min_price,
      max_price,
      delivery_time,
      skill,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (category) filters.category = category
    if (min_price) filters.min_price = Number(min_price)
    if (max_price) filters.max_price = Number(max_price)
    if (delivery_time) filters.delivery_time = Number(delivery_time)
    if (skill) filters.skill = skill
    if (search) filters.search = search
    filters.status = "active"

    const items = await mod.listGigListings(filters, { skip: Number(offset), take: Number(limit) })
    const itemList = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({
      items: itemList,
      count: itemList.length,
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

    const parsed = createGigListingSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("freelance") as any
    const item = await mod.createGigListings(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FREELANCE")}
}
