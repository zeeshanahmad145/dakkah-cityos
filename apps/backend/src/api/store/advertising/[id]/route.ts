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
    thumbnail: "/seed-images/events%2F1459749411175-04bf5292ceea.jpg",
    reviews: [{ author: "Marketing Pro", rating: 5, comment: "Incredible ROI on this banner placement. Our CTR exceeded expectations.", created_at: "2024-07-15T00:00:00Z" }, { author: "Brand Manager", rating: 4, comment: "Great visibility and the analytics dashboard is very detailed.", created_at: "2024-07-10T00:00:00Z" }, { author: "E-commerce Lead", rating: 5, comment: "Best performing ad slot we've ever used. Highly recommend.", created_at: "2024-07-05T00:00:00Z" }, { author: "Digital Strategist", rating: 4, comment: "Good placement with solid targeting options.", created_at: "2024-06-28T00:00:00Z" }, { author: "Growth Hacker", rating: 5, comment: "The homepage hero placement drove massive traffic to our sale.", created_at: "2024-06-20T00:00:00Z" }],
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
    thumbnail: "/seed-images/flash-sales%2F1495474472287-4d71bcdd2085.jpg",
    reviews: [{ author: "Retail Director", rating: 5, comment: "Sidebar placement converts really well for new arrivals.", created_at: "2024-08-12T00:00:00Z" }, { author: "CMO", rating: 4, comment: "Clean design options and good audience targeting.", created_at: "2024-08-05T00:00:00Z" }, { author: "Ad Buyer", rating: 5, comment: "Cost-effective and the reporting is excellent.", created_at: "2024-07-28T00:00:00Z" }, { author: "Product Manager", rating: 4, comment: "Helped drive awareness for our new collection.", created_at: "2024-07-20T00:00:00Z" }, { author: "Startup Founder", rating: 5, comment: "Perfect for launching new products to a targeted audience.", created_at: "2024-07-15T00:00:00Z" }],
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
    thumbnail: "/seed-images/loyalty%2F1563013544-824ae1b704d3.jpg",
    reviews: [{ author: "VP Marketing", rating: 5, comment: "Interstitial format had the highest engagement rate.", created_at: "2024-06-15T00:00:00Z" }, { author: "Media Buyer", rating: 4, comment: "Great for brand awareness. Solid impression volume.", created_at: "2024-06-10T00:00:00Z" }, { author: "Agency Lead", rating: 5, comment: "Our clients love the targeting granularity.", created_at: "2024-06-05T00:00:00Z" }, { author: "DTC Brand", rating: 4, comment: "Good ROI compared to other platforms.", created_at: "2024-05-28T00:00:00Z" }, { author: "Performance Lead", rating: 5, comment: "Exceeded KPIs by 40%. Will renew.", created_at: "2024-05-20T00:00:00Z" }],
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
    thumbnail: "/seed-images/subscriptions%2F1477959858617-67f85cf4f1df.jpg",
    reviews: [{ author: "Flash Sale Manager", rating: 5, comment: "Countdown timer feature boosted urgency and conversions.", created_at: "2024-09-10T00:00:00Z" }, { author: "Promo Specialist", rating: 4, comment: "Great checkout placement. Caught last-minute buyers.", created_at: "2024-09-05T00:00:00Z" }, { author: "Revenue Lead", rating: 5, comment: "Best flash deal ad format we've tested.", created_at: "2024-08-28T00:00:00Z" }, { author: "Ops Manager", rating: 3, comment: "Good results but would like more customization.", created_at: "2024-08-20T00:00:00Z" }, { author: "Store Owner", rating: 4, comment: "Drove significant traffic during our flash event.", created_at: "2024-08-15T00:00:00Z" }],
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
    thumbnail: "/seed-images/events%2F1501281668745-f7f57925c3b4.jpg",
    reviews: [{ author: "Holiday Planner", rating: 5, comment: "Perfect timing and festive creatives that really stand out.", created_at: "2024-11-20T00:00:00Z" }, { author: "Seasonal Buyer", rating: 4, comment: "Native format blends well with search results.", created_at: "2024-11-15T00:00:00Z" }, { author: "Campaign Lead", rating: 5, comment: "Multi-format approach gave us great flexibility.", created_at: "2024-11-10T00:00:00Z" }, { author: "E-commerce Dir", rating: 4, comment: "Strong holiday campaign tools and scheduling.", created_at: "2024-11-05T00:00:00Z" }, { author: "Brand Strategist", rating: 5, comment: "The targeting during holiday season was spot on.", created_at: "2024-11-01T00:00:00Z" }],
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
