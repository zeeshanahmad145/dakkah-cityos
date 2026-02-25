import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "crowd_seed_01",
    tenant_id: "tenant_seed",
    creator_id: "creator_01",
    title: "Smart Urban Garden Kit",
    description: "An innovative IoT-powered garden kit that lets anyone grow fresh produce at home. Automated watering, nutrient monitoring, and a companion app for tracking plant health.",
    short_description: "Grow fresh produce at home with smart technology",
    campaign_type: "reward",
    status: "active",
    goal_amount: 5000000,
    current_amount: 3200000,
    currency_code: "USD",
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: "2025-08-31T00:00:00Z",
    is_flexible_funding: false,
    category: "technology",
    thumbnail: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop"],
    backer_count: 1240,
    metadata: {},
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "crowd_seed_02",
    tenant_id: "tenant_seed",
    creator_id: "creator_02",
    title: "Eco-Friendly Portable Solar Charger",
    description: "A lightweight, foldable solar charger made from recycled materials. Charges phones, tablets, and laptops anywhere under the sun with zero carbon footprint.",
    short_description: "Charge your devices with clean solar energy",
    campaign_type: "reward",
    status: "active",
    goal_amount: 3000000,
    current_amount: 2100000,
    currency_code: "USD",
    starts_at: "2025-02-01T00:00:00Z",
    ends_at: "2025-09-30T00:00:00Z",
    is_flexible_funding: true,
    category: "technology",
    thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
    images: ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop"],
    backer_count: 890,
    metadata: {},
    created_at: "2025-02-01T00:00:00Z",
  },
  {
    id: "crowd_seed_03",
    tenant_id: "tenant_seed",
    creator_id: "creator_03",
    title: "Community Art Studio & Workshop Space",
    description: "Help us build a shared creative space for local artists, offering affordable studio rentals, workshops, and exhibitions to nurture emerging talent.",
    short_description: "A shared creative space for local artists",
    campaign_type: "donation",
    status: "active",
    goal_amount: 7500000,
    current_amount: 4500000,
    currency_code: "USD",
    starts_at: "2025-01-15T00:00:00Z",
    ends_at: "2025-07-15T00:00:00Z",
    is_flexible_funding: true,
    category: "arts",
    thumbnail: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
    images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop"],
    backer_count: 560,
    metadata: {},
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "crowd_seed_04",
    tenant_id: "tenant_seed",
    creator_id: "creator_04",
    title: "Revolutionary Language Learning App",
    description: "An AI-powered language learning app using immersive VR conversations and real-time pronunciation feedback. Learn any of 50+ languages naturally.",
    short_description: "Learn languages through immersive AI conversations",
    campaign_type: "equity",
    status: "active",
    goal_amount: 10000000,
    current_amount: 6800000,
    currency_code: "USD",
    starts_at: "2025-03-01T00:00:00Z",
    ends_at: "2025-10-31T00:00:00Z",
    is_flexible_funding: false,
    category: "education",
    thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop",
    images: ["https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop"],
    backer_count: 2340,
    metadata: {},
    created_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "crowd_seed_05",
    tenant_id: "tenant_seed",
    creator_id: "creator_05",
    title: "Zero-Waste Kitchen Starter Set",
    description: "A complete kit for transitioning to a zero-waste kitchen. Includes reusable wraps, compostable bags, stainless steel containers, and a comprehensive guide.",
    short_description: "Everything you need for a zero-waste kitchen",
    campaign_type: "reward",
    status: "active",
    goal_amount: 2000000,
    current_amount: 1750000,
    currency_code: "USD",
    starts_at: "2025-02-15T00:00:00Z",
    ends_at: "2025-06-30T00:00:00Z",
    is_flexible_funding: false,
    category: "sustainability",
    thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop"],
    backer_count: 1580,
    metadata: {},
    created_at: "2025-02-15T00:00:00Z",
  },
]

const createCampaignSchema = z.object({
  tenant_id: z.string().min(1),
  creator_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  short_description: z.string().nullable().optional(),
  campaign_type: z.enum(["reward", "equity", "donation", "debt"]),
  status: z.enum(["draft", "pending_review", "active", "funded", "failed", "cancelled"]).optional(),
  goal_amount: z.union([z.string(), z.number()]),
  currency_code: z.string().min(1),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().min(1),
  is_flexible_funding: z.boolean().optional(),
  category: z.string().nullable().optional(),
  images: z.any().nullable().optional(),
  video_url: z.string().nullable().optional(),
  risks_and_challenges: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      category,
      min_goal,
      max_goal,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (category) filters.category = category
    if (min_goal) filters.min_goal = Number(min_goal)
    if (max_goal) filters.max_goal = Number(max_goal)
    if (search) filters.search = search

    const rawItems = await mod.listCrowdfundCampaigns(filters, { skip: Number(offset), take: Number(limit) })
    const items = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : SEED_DATA
    return res.json({
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CROWDFUNDING")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createCampaignSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("crowdfunding") as any
    const item = await mod.createCrowdfundCampaigns(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CROWDFUNDING")}
}

