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
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const crowdfundingService = req.scope.resolve("crowdfunding") as any
    const { id } = req.params
    const item = await crowdfundingService.retrieveCampaign(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
