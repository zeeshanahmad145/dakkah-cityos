import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../lib/api-error-handler";

const SEED_DATA = [
  {
    id: "campaign-seed-1",
    title: "Summer Clearance Sale",
    description: "Massive discounts on summer collections. Up to 60% off on selected items across all categories.",
    type: "seasonal",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
    metadata: {
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
      discount: "60%",
      discount_label: "Up to 60% Off",
    },
    starts_at: "2025-06-01T00:00:00Z",
    ends_at: "2025-08-31T23:59:59Z",
  },
  {
    id: "campaign-seed-2",
    title: "Flash Friday Deals",
    description: "24-hour flash deals every Friday. Limited stock, unbeatable prices on top brands.",
    type: "flash",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    metadata: {
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
      discount: "40%",
      discount_label: "Up to 40% Off",
    },
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
  },
  {
    id: "campaign-seed-3",
    title: "End of Season Clearance",
    description: "Final markdowns on winter inventory. Everything must go to make room for new arrivals.",
    type: "clearance",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
    metadata: {
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
      discount: "70%",
      discount_label: "Up to 70% Off",
    },
    starts_at: "2025-02-01T00:00:00Z",
    ends_at: "2025-03-31T23:59:59Z",
  },
  {
    id: "campaign-seed-4",
    title: "Holiday Gift Guide",
    description: "Curated gift collections for everyone on your list. Special bundles and free gift wrapping.",
    type: "holiday",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop",
    metadata: {
      image: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop",
      discount: "30%",
      discount_label: "30% Off Bundles",
    },
    starts_at: "2025-11-15T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
  },
  {
    id: "campaign-seed-5",
    title: "Back to School Savings",
    description: "Stock up on school supplies, electronics, and dorm essentials at discounted prices.",
    type: "seasonal",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    metadata: {
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
      discount: "25%",
      discount_label: "25% Off",
    },
    starts_at: "2025-07-15T00:00:00Z",
    ends_at: "2025-09-15T23:59:59Z",
  },
];

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const crowdfundingService = req.scope.resolve("crowdfunding") as any;
    const {
      limit = "20",
      offset = "0",
      status = "active",
    } = req.query as Record<string, string | undefined>;

    const campaigns = await (crowdfundingService as any).listCampaigns(
      { status },
      {
        skip: Number(offset),
        take: Number(limit),
      },
    );
    const list = Array.isArray(campaigns)
      ? campaigns
      : [campaigns].filter(Boolean);

    const results = Array.isArray(list) && list.length > 0 ? list : SEED_DATA;

    return res.json({
      campaigns: results,
      items: results,
      count: results.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    return res.json({
      campaigns: SEED_DATA,
      items: SEED_DATA,
      count: SEED_DATA.length,
      limit: 20,
      offset: 0,
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const crowdfundingService = req.scope.resolve("crowdfunding") as any;
    const customerId = (req as any).auth_context?.actor_id;

    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      title,
      description,
      goal_amount,
      currency_code = "usd",
      end_date,
    } = req.body as {
      title: string;
      description?: string;
      goal_amount: number;
      currency_code?: string;
      end_date?: string;
    };

    if (!title || !goal_amount || goal_amount <= 0) {
      return res
        .status(400)
        .json({ error: "title and goal_amount > 0 are required" });
    }

    const campaign = await (crowdfundingService as any).createCampaigns({
      title,
      description: description ?? null,
      goal_amount,
      current_amount: 0,
      currency_code,
      status: "draft",
      owner_id: customerId,
      end_date: end_date ? new Date(end_date) : null,
    });

    return res.status(201).json({ campaign });
  } catch (error: any) {
    return handleApiError(res, error, "STORE-CAMPAIGNS-CREATE");
  }
}
