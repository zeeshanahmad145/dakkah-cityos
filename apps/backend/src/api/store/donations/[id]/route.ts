import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_DONATIONS = [
  {
    id: "donation-seed-1",
    title: "Clean Water for Rural Communities",
    description: "Help provide clean drinking water to underserved rural communities through well construction and water purification systems. Every contribution directly funds infrastructure that serves families for generations.",
    goal_amount: 5000000,
    raised_amount: 3250000,
    currency: "USD",
    category: "environment",
    status: "active",
    donor_count: 482,
    thumbnail: "/seed-images/charity/1469571486292-0ba58a3f068b.jpg",
    reviews: [
      { author: "Ahmed Al-Rashid", rating: 5, comment: "Transparent organization with real impact. Every donation is tracked and I can see the wells being built.", created_at: "2025-05-10T00:00:00Z" },
      { author: "Sarah Johnson", rating: 5, comment: "This initiative has already changed thousands of lives. Clean water is a basic human right.", created_at: "2025-05-05T00:00:00Z" },
      { author: "David Park", rating: 4, comment: "Important cause with measurable results. Regular updates on well construction progress.", created_at: "2025-04-28T00:00:00Z" },
      { author: "Fatima Nasser", rating: 5, comment: "Clean water changes everything. Proud to support communities that need it most.", created_at: "2025-04-20T00:00:00Z" },
      { author: "James Williams", rating: 4, comment: "Well-managed fund with clear goals. The purification systems are a sustainable solution.", created_at: "2025-04-12T00:00:00Z" },
    ],
  },
  {
    id: "donation-seed-2",
    title: "Education for Every Child",
    description: "Fund school supplies, teacher training, and classroom construction in developing regions. Education is the foundation of opportunity and every child deserves access to quality learning.",
    goal_amount: 2500000,
    raised_amount: 1800000,
    currency: "USD",
    category: "education",
    status: "active",
    donor_count: 315,
    thumbnail: "/seed-images/charity/1497486751825-1233686d5d80.jpg",
    reviews: [
      { author: "Education First Trust", rating: 5, comment: "Outstanding program that has built 3 new schools this year. Every dollar makes a difference.", created_at: "2025-05-11T00:00:00Z" },
      { author: "Priya Sharma", rating: 5, comment: "Seeing children gain access to quality education is heartwarming. This fund delivers real results.", created_at: "2025-05-06T00:00:00Z" },
      { author: "Tom Anderson", rating: 4, comment: "Teacher training ensures sustainable impact. Investing in education invests in the future.", created_at: "2025-04-30T00:00:00Z" },
      { author: "Yuki Tanaka", rating: 5, comment: "Three new schools opened thanks to donor support. Incredible progress toward the goal.", created_at: "2025-04-22T00:00:00Z" },
      { author: "Maria Silva", rating: 4, comment: "Regular updates and great transparency. Easy to see where contributions go.", created_at: "2025-04-15T00:00:00Z" },
    ],
  },
  {
    id: "donation-seed-3",
    title: "Wildlife Conservation Fund",
    description: "Protect endangered species and preserve natural habitats through conservation programs. Supporting anti-poaching patrols, habitat restoration, and community wildlife education.",
    goal_amount: 3000000,
    raised_amount: 2100000,
    currency: "USD",
    category: "wildlife",
    status: "active",
    donor_count: 627,
    thumbnail: "/seed-images/charity/1469854523086-cc02fe5d8800.jpg",
    reviews: [
      { author: "Wildlife Alliance", rating: 5, comment: "Essential conservation work protecting endangered species. Anti-poaching efforts have saved countless animals.", created_at: "2025-05-10T00:00:00Z" },
      { author: "Peter Anderson", rating: 5, comment: "Habitat restoration work is visually documented and inspiring. Every hectare matters.", created_at: "2025-05-05T00:00:00Z" },
      { author: "Helen Chen", rating: 4, comment: "Important cause with measurable conservation outcomes. 50 hectares restored is significant.", created_at: "2025-04-28T00:00:00Z" },
      { author: "Omar Hassan", rating: 5, comment: "Community workshops create lasting change. Educating residents amplifies the conservation impact.", created_at: "2025-04-20T00:00:00Z" },
      { author: "Sophie Laurent", rating: 4, comment: "Well-organized conservation project with transparent reporting and clear milestones.", created_at: "2025-04-12T00:00:00Z" },
    ],
  },
  {
    id: "donation-seed-4",
    title: "Meals for Families in Need",
    description: "Provide nutritious meals to families experiencing food insecurity in urban areas. Supporting food banks, community kitchens, and sustainable agriculture programs.",
    goal_amount: 1500000,
    raised_amount: 950000,
    currency: "USD",
    category: "hunger",
    status: "active",
    donor_count: 1203,
    thumbnail: "/seed-images/charity/1541544537156-7627a7a4aa1c.jpg",
    reviews: [
      { author: "Feed the Future Fund", rating: 5, comment: "Over 1 million meals served this year. One of the most efficient hunger relief programs.", created_at: "2025-05-13T00:00:00Z" },
      { author: "Hassan Al-Fahad", rating: 5, comment: "Farm partnerships ensure fresh, nutritious food reaches families. Brilliant approach.", created_at: "2025-05-09T00:00:00Z" },
      { author: "Jennifer Brown", rating: 4, comment: "The community food bank serves 200 families weekly. Real, tangible impact.", created_at: "2025-05-04T00:00:00Z" },
      { author: "Wei Zhang", rating: 5, comment: "Urgent cause that affects millions. Every donation helps feed families in need.", created_at: "2025-04-27T00:00:00Z" },
      { author: "Grace Kim", rating: 4, comment: "Transparent reporting and consistent updates. Sustainable agriculture programs are impressive.", created_at: "2025-04-20T00:00:00Z" },
    ],
  },
  {
    id: "donation-seed-5",
    title: "Disaster Relief Emergency Fund",
    description: "Rapid response fund for natural disaster relief — shelter, medical aid, and rebuilding support. Providing immediate assistance when communities need it most.",
    goal_amount: 10000000,
    raised_amount: 7500000,
    currency: "USD",
    category: "disaster-relief",
    status: "active",
    donor_count: 2841,
    thumbnail: "/seed-images/charity/1488521787991-ed7bbaae773c.jpg",
    reviews: [
      { author: "Global Corp Foundation", rating: 5, comment: "Rapid deployment and efficient use of resources. Trusted disaster response partner.", created_at: "2025-05-12T00:00:00Z" },
      { author: "Lisa Martinez", rating: 5, comment: "They respond within hours of a disaster. Emergency supply kits save lives immediately.", created_at: "2025-05-08T00:00:00Z" },
      { author: "Robert Kim", rating: 4, comment: "Critical work when communities need it most. Volunteer program is well-organized.", created_at: "2025-05-03T00:00:00Z" },
      { author: "Nora Ibrahim", rating: 5, comment: "75% funded shows the community trust. Every donation makes an immediate difference.", created_at: "2025-04-25T00:00:00Z" },
      { author: "Carlos Mendez", rating: 4, comment: "Urgent causes that deserve support. Supply distribution updates show real accountability.", created_at: "2025-04-18T00:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const charityService = req.scope.resolve("charity") as any
    if (charityService?.retrieveDonationCampaign) {
      const campaign = await charityService.retrieveDonationCampaign(id)
      if (campaign) {
        return res.json({ item: enrichDetailItem(campaign, "charity") })
      }
    }
  } catch (_e) {}

  const seedMatch = SEED_DONATIONS.find((d) => d.id === id) || SEED_DONATIONS[0]
  return res.json({ item: seedMatch })
}
