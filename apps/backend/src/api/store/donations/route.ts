import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  {
    id: "donation-seed-1",
    title: "Clean Water for Rural Communities",
    description: "Help provide clean drinking water to underserved rural communities through well construction and water purification systems.",
    goal_amount: 5000000,
    raised_amount: 3250000,
    currency: "USD",
    category: "environment",
    status: "active",
    donor_count: 482,
    thumbnail: "/seed-images/charity%2F1469571486292-0ba58a3f068b.jpg",
  },
  {
    id: "donation-seed-2",
    title: "Education for Every Child",
    description: "Fund school supplies, teacher training, and classroom construction in developing regions.",
    goal_amount: 2500000,
    raised_amount: 1800000,
    currency: "USD",
    category: "education",
    status: "active",
    donor_count: 315,
    thumbnail: "/seed-images/charity%2F1497486751825-1233686d5d80.jpg",
  },
  {
    id: "donation-seed-3",
    title: "Wildlife Conservation Fund",
    description: "Protect endangered species and preserve natural habitats through conservation programs.",
    goal_amount: 3000000,
    raised_amount: 2100000,
    currency: "USD",
    category: "wildlife",
    status: "active",
    donor_count: 627,
    thumbnail: "/seed-images/charity%2F1469854523086-cc02fe5d8800.jpg",
  },
  {
    id: "donation-seed-4",
    title: "Meals for Families in Need",
    description: "Provide nutritious meals to families experiencing food insecurity in urban areas.",
    goal_amount: 1500000,
    raised_amount: 950000,
    currency: "USD",
    category: "hunger",
    status: "active",
    donor_count: 1203,
    thumbnail: "/seed-images/charity%2F1541544537156-7627a7a4aa1c.jpg",
  },
  {
    id: "donation-seed-5",
    title: "Disaster Relief Emergency Fund",
    description: "Rapid response fund for natural disaster relief — shelter, medical aid, and rebuilding support.",
    goal_amount: 10000000,
    raised_amount: 7500000,
    currency: "USD",
    category: "disaster-relief",
    status: "active",
    donor_count: 2841,
    thumbnail: "/seed-images/charity%2F1488521787991-ed7bbaae773c.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const charityService = req.scope.resolve("charity") as any
    const items = await charityService.listCharityCampaigns({ status: "active" })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({ donations: results, count: results.length })
  } catch (error: any) {
    return res.json({ donations: SEED_DATA, count: SEED_DATA.length })
  }
}
