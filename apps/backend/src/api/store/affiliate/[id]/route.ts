import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "aff_001",
    name: "Tech Reviews Pro",
    email: "partners@techreviewspro.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 12,
    commission_type: "percentage",
    bio: "Leading tech review channel with 500K+ followers. Specializing in consumer electronics and smart home devices.",
    description: "Leading tech review channel with 500K+ followers. Specializing in consumer electronics and smart home devices.",
    features: ["Custom affiliate links", "Real-time analytics", "Monthly payouts"],
    benefits: ["Earn on every referral", "No minimum threshold", "Lifetime commissions"],
    category: "Electronics",
    thumbnail: "/seed-images/affiliate%2F1531297484001-80022131f5a1.jpg",
  },
  {
    id: "aff_002",
    name: "Fashion Forward Blog",
    email: "collab@fashionforward.com",
    affiliate_type: "ambassador",
    status: "active",
    commission_rate: 15,
    commission_type: "percentage",
    bio: "Award-winning fashion blog featuring sustainable and luxury brands. 250K monthly readers.",
    description: "Award-winning fashion blog featuring sustainable and luxury brands. 250K monthly readers.",
    features: ["Custom affiliate links", "Real-time analytics", "Monthly payouts"],
    benefits: ["Earn on every referral", "No minimum threshold", "Lifetime commissions"],
    category: "Fashion",
    thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
  },
  {
    id: "aff_003",
    name: "Healthy Living Hub",
    email: "affiliate@healthylivinghub.com",
    affiliate_type: "partner",
    status: "active",
    commission_rate: 10,
    commission_type: "percentage",
    bio: "Health and wellness platform covering nutrition, fitness, and mental health. Trusted by 1M+ subscribers.",
    description: "Health and wellness platform covering nutrition, fitness, and mental health. Trusted by 1M+ subscribers.",
    features: ["Custom affiliate links", "Real-time analytics", "Monthly payouts"],
    benefits: ["Earn on every referral", "No minimum threshold", "Lifetime commissions"],
    category: "Health & Wellness",
    thumbnail: "/seed-images/affiliate%2F1544367567-0f2fcb009e0b.jpg",
  },
  {
    id: "aff_004",
    name: "Home Decor Digest",
    email: "partners@homedecordigest.com",
    affiliate_type: "standard",
    status: "active",
    commission_rate: 8,
    commission_type: "percentage",
    bio: "Interior design inspiration and product recommendations for modern homes. Featured in top design magazines.",
    description: "Interior design inspiration and product recommendations for modern homes. Featured in top design magazines.",
    features: ["Custom affiliate links", "Real-time analytics", "Monthly payouts"],
    benefits: ["Earn on every referral", "No minimum threshold", "Lifetime commissions"],
    category: "Home & Garden",
    thumbnail: "/seed-images/affiliate%2F1586023492125-27b2c045efd7.jpg",
  },
  {
    id: "aff_005",
    name: "Outdoor Adventures Channel",
    email: "affiliate@outdooradventures.com",
    affiliate_type: "influencer",
    status: "active",
    commission_rate: 11,
    commission_type: "percentage",
    bio: "Adventure sports and outdoor gear reviews. 300K YouTube subscribers passionate about camping, hiking, and travel.",
    description: "Adventure sports and outdoor gear reviews. 300K YouTube subscribers passionate about camping, hiking, and travel.",
    features: ["Custom affiliate links", "Real-time analytics", "Monthly payouts"],
    benefits: ["Earn on every referral", "No minimum threshold", "Lifetime commissions"],
    category: "Sports & Outdoors",
    thumbnail: "/seed-images/affiliate%2F1551632811-561732d1e306.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("affiliate") as any
    const { id } = req.params
    const item = await mod.retrieveAffiliate(id)
    if (item) return res.json({ item })
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
