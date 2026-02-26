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
    thumbnail: "/seed-images/affiliate/1531297484001-80022131f5a1.jpg",
    reviews: [
      { author: "David L.", rating: 5, comment: "Best affiliate program I've joined. The 12% commission rate is very competitive and payouts are always on time.", created_at: "2025-02-10T14:00:00Z" },
      { author: "Sarah K.", rating: 5, comment: "Excellent tracking dashboard and real-time analytics. I can see exactly where my referrals come from.", created_at: "2025-01-28T09:30:00Z" },
      { author: "Ahmad R.", rating: 4, comment: "Good program with fair commissions. The support team is responsive and helpful.", created_at: "2025-01-15T11:00:00Z" },
      { author: "Mia C.", rating: 5, comment: "Love the custom affiliate links feature. My conversion rates have improved significantly since joining.", created_at: "2025-01-03T16:20:00Z" },
      { author: "James W.", rating: 4, comment: "Solid affiliate program with no minimum threshold. Lifetime commissions are a great perk.", created_at: "2024-12-20T10:45:00Z" },
    ],
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
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    reviews: [
      { author: "Olivia N.", rating: 5, comment: "The fashion niche works perfectly with this program. Great product selection to promote.", created_at: "2025-02-05T13:00:00Z" },
      { author: "Marco P.", rating: 4, comment: "Good commission structure for fashion ambassadors. Wish there were more promotional materials.", created_at: "2025-01-22T08:30:00Z" },
      { author: "Lisa T.", rating: 5, comment: "15% commission on fashion is amazing. My readers love the curated product recommendations.", created_at: "2025-01-10T15:00:00Z" },
      { author: "Karim B.", rating: 4, comment: "Ambassador status gives great perks. The exclusive early access to new collections is a nice bonus.", created_at: "2024-12-28T11:30:00Z" },
      { author: "Emma S.", rating: 5, comment: "Best fashion affiliate program I've worked with. The brand alignment is perfect.", created_at: "2024-12-15T14:00:00Z" },
    ],
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
    thumbnail: "/seed-images/affiliate/1544367567-0f2fcb009e0b.jpg",
    reviews: [
      { author: "Dr. Fatima H.", rating: 5, comment: "Perfect fit for health content creators. The product quality matches our audience expectations.", created_at: "2025-02-08T10:00:00Z" },
      { author: "Chris M.", rating: 4, comment: "Good commission rate for wellness products. Analytics could be more detailed.", created_at: "2025-01-25T12:30:00Z" },
      { author: "Nadia S.", rating: 5, comment: "My subscribers trust my health recommendations and this program has great products to share.", created_at: "2025-01-12T09:00:00Z" },
      { author: "Tom R.", rating: 4, comment: "Reliable payouts and decent product range. Would love to see more supplement brands.", created_at: "2024-12-30T14:15:00Z" },
      { author: "Amira K.", rating: 5, comment: "Health and wellness niche is booming. This program helps me monetize my platform effectively.", created_at: "2024-12-18T16:00:00Z" },
    ],
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
    thumbnail: "/seed-images/affiliate/1586023492125-27b2c045efd7.jpg",
    reviews: [
      { author: "Interior Pro", rating: 5, comment: "Great home decor products to promote. My audience loves the curated selections.", created_at: "2025-02-01T11:00:00Z" },
      { author: "Layla A.", rating: 4, comment: "Decent commissions for home products. The seasonal promotions are a nice touch.", created_at: "2025-01-18T13:30:00Z" },
      { author: "Mike D.", rating: 5, comment: "Easy to integrate affiliate links into my design blog. Conversion tracking is accurate.", created_at: "2025-01-05T10:00:00Z" },
      { author: "Sofia R.", rating: 4, comment: "Good product photography makes it easy to create attractive content for my readers.", created_at: "2024-12-23T15:45:00Z" },
      { author: "Hassan N.", rating: 5, comment: "8% commission adds up quickly with home furniture. My monthly earnings keep growing.", created_at: "2024-12-10T09:30:00Z" },
    ],
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
    thumbnail: "/seed-images/affiliate/1551632811-561732d1e306.jpg",
    reviews: [
      { author: "TrailBlazer", rating: 5, comment: "Outdoor gear affiliate program with great commissions. My adventure audience converts well.", created_at: "2025-02-12T08:00:00Z" },
      { author: "Yuki T.", rating: 5, comment: "Love promoting quality outdoor products. The 11% rate is above industry average.", created_at: "2025-01-30T10:30:00Z" },
      { author: "Alex P.", rating: 4, comment: "Good selection of camping and hiking gear. Seasonal campaigns boost earnings.", created_at: "2025-01-17T14:00:00Z" },
      { author: "Fatima Z.", rating: 4, comment: "Solid tracking and timely payouts. The product reviews help my audience make informed choices.", created_at: "2025-01-04T11:15:00Z" },
      { author: "Ryan B.", rating: 5, comment: "Best outdoor gear affiliate program. My YouTube channel revenue doubled after joining.", created_at: "2024-12-22T09:00:00Z" },
    ],
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
