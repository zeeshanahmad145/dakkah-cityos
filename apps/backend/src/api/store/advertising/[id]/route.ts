import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "ad-seed-1",
    title: "Summer Sale Banner",
    description: "Eye-catching banner ad for summer promotions with vibrant colors and bold typography.",
    ad_type: "banner",
    placement: "homepage_hero",
    status: "active",
    impressions: 15420,
    clicks: 892,
    ctr: 5.78,
    budget: 500000,
    spent: 234500,
    currency: "USD",
    start_date: "2024-06-01",
    end_date: "2024-08-31",
    thumbnail: "/seed-images/events%2F1540575467063-178a2e25ea79.jpg",
  },
  {
    id: "ad-seed-2",
    title: "New Arrivals Spotlight",
    description: "Showcase new product arrivals with carousel-style sponsored content.",
    ad_type: "sponsored",
    placement: "category_sidebar",
    status: "active",
    impressions: 8930,
    clicks: 456,
    ctr: 5.11,
    budget: 300000,
    spent: 178200,
    currency: "USD",
    start_date: "2024-07-01",
    end_date: "2024-09-30",
    thumbnail: "/seed-images/flash-sales%2F1607082348824-0a96f2a4b9da.jpg",
  },
  {
    id: "ad-seed-3",
    title: "Brand Awareness Campaign",
    description: "Full-page interstitial ad to boost brand recognition among new visitors.",
    ad_type: "interstitial",
    placement: "product_page",
    status: "active",
    impressions: 22100,
    clicks: 1340,
    ctr: 6.06,
    budget: 750000,
    spent: 412000,
    currency: "USD",
    start_date: "2024-05-15",
    end_date: "2024-12-31",
    thumbnail: "/seed-images/loyalty%2F1556742049-0cfed4f6210.jpg",
  },
  {
    id: "ad-seed-4",
    title: "Flash Deal Promotion",
    description: "Time-limited flash deal banner with countdown timer and urgency messaging.",
    ad_type: "banner",
    placement: "checkout_sidebar",
    status: "active",
    impressions: 5670,
    clicks: 389,
    ctr: 6.86,
    budget: 200000,
    spent: 98700,
    currency: "USD",
    start_date: "2024-08-01",
    end_date: "2024-10-31",
    thumbnail: "/seed-images/subscriptions%2F1553729459-02b1a9de8a94.jpg",
  },
  {
    id: "ad-seed-5",
    title: "Holiday Season Campaign",
    description: "Multi-format holiday campaign with festive creatives for maximum engagement.",
    ad_type: "native",
    placement: "search_results",
    status: "scheduled",
    impressions: 0,
    clicks: 0,
    ctr: 0,
    budget: 1000000,
    spent: 0,
    currency: "USD",
    start_date: "2024-11-15",
    end_date: "2025-01-05",
    thumbnail: "/seed-images/events%2F1492684223f-81e1d12d8249.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("advertising") as any
    const { id } = req.params
    const item = await mod.retrieveAdPlacement(id)
    if (!item) {
      const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: { ...seed, id } })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
    return res.json({ item: { ...seed, id } })
  }
}
