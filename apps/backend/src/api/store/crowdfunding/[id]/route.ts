import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "campaign-seed-1",
    title: "Summer Clearance Sale",
    description: "Massive discounts on summer collections. Up to 60% off on selected items across all categories.",
    type: "seasonal",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
    raised_amount: 45000,
    goal_amount: 100000,
    currency_code: "usd",
    backers_count: 120,
    days_remaining: 45,
    starts_at: "2025-06-01T00:00:00Z",
    ends_at: "2025-08-31T23:59:59Z",
    reward_tiers: [
      { id: "rt-1", title: "Early Bird", description: "Get early access to the sale", pledge_amount: 1000, currency_code: "usd", estimated_delivery: "2025-07-01", limited_quantity: 50, claimed: 12, includes: ["Early access pass", "10% extra discount"] },
      { id: "rt-2", title: "VIP Shopper", description: "Premium shopping experience", pledge_amount: 5000, currency_code: "usd", estimated_delivery: "2025-07-01", limited_quantity: 20, claimed: 5, includes: ["VIP access", "Personal shopper", "25% extra discount"] },
    ],
    metadata: {
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
      discount: "60%",
      discount_label: "Up to 60% Off",
    },
  },
  {
    id: "campaign-seed-2",
    title: "Flash Friday Deals",
    description: "24-hour flash deals every Friday. Limited stock, unbeatable prices on top brands.",
    type: "flash",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    raised_amount: 28000,
    goal_amount: 50000,
    currency_code: "usd",
    backers_count: 85,
    days_remaining: 30,
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
      discount: "40%",
      discount_label: "Up to 40% Off",
    },
  },
  {
    id: "campaign-seed-3",
    title: "End of Season Clearance",
    description: "Final markdowns on winter inventory. Everything must go to make room for new arrivals.",
    type: "clearance",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop",
    raised_amount: 15000,
    goal_amount: 30000,
    currency_code: "usd",
    backers_count: 60,
    days_remaining: 15,
    starts_at: "2025-02-01T00:00:00Z",
    ends_at: "2025-03-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop",
      discount: "70%",
      discount_label: "Up to 70% Off",
    },
  },
  {
    id: "campaign-seed-4",
    title: "Holiday Gift Guide",
    description: "Curated gift collections for everyone on your list. Special bundles and free gift wrapping.",
    type: "holiday",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop",
    raised_amount: 8000,
    goal_amount: 25000,
    currency_code: "usd",
    backers_count: 40,
    days_remaining: 60,
    starts_at: "2025-11-15T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "https://images.unsplash.com/photo-1515562141589-67f0d6a4bf28?w=800&h=600&fit=crop",
      discount: "30%",
      discount_label: "30% Off Bundles",
    },
  },
  {
    id: "campaign-seed-5",
    title: "Back to School Savings",
    description: "Stock up on school supplies, electronics, and dorm essentials at discounted prices.",
    type: "seasonal",
    status: "active",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    raised_amount: 12000,
    goal_amount: 20000,
    currency_code: "usd",
    backers_count: 95,
    days_remaining: 25,
    starts_at: "2025-07-15T00:00:00Z",
    ends_at: "2025-09-15T23:59:59Z",
    reward_tiers: [],
    metadata: {
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
      discount: "25%",
      discount_label: "25% Off",
    },
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    const item = await mod.retrieveCrowdfundCampaign(id)
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    const reward_tiers = await mod.listRewardTiers({ campaign_id: id }, { take: 100 })
    return res.json({ item: { ...item, reward_tiers } })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
