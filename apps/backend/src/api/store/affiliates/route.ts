import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_AFFILIATES = [
  {
    id: "aff-1",
    name: "TechReviewer Pro",
    email: "tech@affiliates.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 15,
    commission_type: "percentage",
    bio: "Leading tech reviewer with 500K+ subscribers.",
    thumbnail: "/seed-images/freelance/1532094349884-543bc11b234d.jpg",
    total_earnings: 1250000,
    total_clicks: 45000,
    total_conversions: 1200,
    created_at: "2024-06-15T00:00:00Z",
  },
  {
    id: "aff-2",
    name: "HomeDecor Daily",
    email: "home@affiliates.com",
    affiliate_type: "partner",
    status: "active",
    commission_rate: 12,
    commission_type: "percentage",
    bio: "Home décor blog with 200K monthly readers.",
    thumbnail: "/seed-images/real-estate/1502672260266-1c1ef2d93688.jpg",
    total_earnings: 890000,
    total_clicks: 32000,
    total_conversions: 850,
    created_at: "2024-08-01T00:00:00Z",
  },
  {
    id: "aff-3",
    name: "FitLife Ambassador",
    email: "fit@affiliates.com",
    affiliate_type: "ambassador",
    status: "active",
    commission_rate: 18,
    commission_type: "percentage",
    bio: "Fitness influencer and certified personal trainer.",
    thumbnail: "/seed-images/fitness/1518611012118-696072aa579a.jpg",
    total_earnings: 675000,
    total_clicks: 28000,
    total_conversions: 720,
    created_at: "2024-09-10T00:00:00Z",
  },
  {
    id: "aff-4",
    name: "Budget Savvy Mom",
    email: "budget@affiliates.com",
    affiliate_type: "standard",
    status: "active",
    commission_rate: 10,
    commission_type: "percentage",
    bio: "Mom blogger sharing deals and family-friendly products.",
    thumbnail: "/seed-images/grocery/1414235077428-338989a2e8c0.jpg",
    total_earnings: 450000,
    total_clicks: 18000,
    total_conversions: 560,
    created_at: "2024-07-20T00:00:00Z",
  },
  {
    id: "aff-5",
    name: "GameZone Reviews",
    email: "games@affiliates.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 14,
    commission_type: "percentage",
    bio: "Gaming channel with in-depth reviews of consoles and PC hardware.",
    thumbnail: "/seed-images/digital-products/1506744038136-46273834b3fb.jpg",
    total_earnings: 920000,
    total_clicks: 52000,
    total_conversions: 980,
    created_at: "2024-05-30T00:00:00Z",
  },
];

const createAffiliateSchema = z.object({
  tenant_id: z.string().min(1),
  customer_id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().min(1),
  affiliate_type: z.enum(["standard", "influencer", "partner", "ambassador"]),
  status: z
    .enum(["pending", "approved", "active", "suspended", "terminated"])
    .optional(),
  commission_rate: z.number(),
  commission_type: z.enum(["percentage", "flat"]).optional(),
  payout_method: z.enum(["bank_transfer", "paypal", "store_credit"]).optional(),
  payout_minimum: z.number().optional(),
  bio: z.string().optional(),
  social_links: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as unknown as any;
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      category,
      commission_type,
      search,
    } = req.query as Record<string, string | undefined>;

    const filters: Record<string, any> = {};
    if (tenant_id) filters.tenant_id = tenant_id;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (commission_type) filters.commission_type = commission_type;
    if (search) filters.search = search;

    const items = await mod.listAffiliates(filters, {
      skip: Number(offset),
      take: Number(limit),
    });
    const hasData = Array.isArray(items) && items.length > 0;
    return res.json({
      items: hasData ? items : SEED_AFFILIATES,
      count: hasData ? items.length : SEED_AFFILIATES.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: unknown) {
    return res.json({
      items: SEED_AFFILIATES,
      count: SEED_AFFILIATES.length,
      limit: 20,
      offset: 0,
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = createAffiliateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const mod = req.scope.resolve("affiliate") as unknown as any;
    const item = await mod.createAffiliates(parsed.data);
    res.status(201).json({ item });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-AFFILIATES");
  }
}
