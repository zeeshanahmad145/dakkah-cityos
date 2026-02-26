import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "membership-seed-1",
    name: "Bronze Membership",
    tier: "bronze",
    description: "Get started with basic member benefits including early access to sales and a welcome discount.",
    benefits: ["5% off all purchases", "Early access to sales", "Birthday reward", "Free standard shipping"],
    price: 999,
    currency: "USD",
    billing_interval: "monthly",
    logo_url: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg" },
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
    reviews: [
      { author: "Lina M.", rating: 4, comment: "Great entry-level membership. The 5% discount adds up over time.", created_at: "2025-01-05T09:00:00Z" },
      { author: "Samir A.", rating: 4, comment: "Birthday reward was a nice touch. Simple and effective program.", created_at: "2025-01-12T11:30:00Z" },
      { author: "Hana T.", rating: 3, comment: "Good for casual shoppers but the discount could be a bit higher.", created_at: "2025-01-20T14:00:00Z" },
      { author: "Ziad K.", rating: 5, comment: "Free standard shipping alone saves me money every month. Totally worth it.", created_at: "2025-02-01T08:00:00Z" },
      { author: "Yasmin R.", rating: 4, comment: "Easy to sign up and the early access to sales is genuinely useful.", created_at: "2025-02-10T16:30:00Z" },
    ],
  },
  {
    id: "membership-seed-2",
    name: "Silver Membership",
    tier: "silver",
    description: "Enhanced benefits with bigger discounts, priority support, and exclusive member events.",
    benefits: ["10% off all purchases", "Priority customer support", "Exclusive member events", "Free express shipping", "Early product launches"],
    price: 1999,
    currency: "USD",
    billing_interval: "monthly",
    logo_url: "/seed-images/campaigns%2F1556742049-0cfed4f6a45d.jpg",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "/seed-images/campaigns%2F1556742049-0cfed4f6a45d.jpg" },
    thumbnail: "/seed-images/memberships%2F1554224155-8d04cb21cd6c.jpg",
    reviews: [
      { author: "Rami D.", rating: 5, comment: "Priority support is a lifesaver. My issues get resolved within minutes.", created_at: "2025-01-08T10:00:00Z" },
      { author: "Dalia N.", rating: 4, comment: "The 10% discount is solid and the member events are a great networking opportunity.", created_at: "2025-01-15T13:00:00Z" },
      { author: "Faris H.", rating: 5, comment: "Free express shipping changed how I shop online. Everything arrives so fast.", created_at: "2025-01-28T09:30:00Z" },
      { author: "Nour B.", rating: 4, comment: "Early product launches let me grab limited editions before they sell out.", created_at: "2025-02-06T15:00:00Z" },
      { author: "Karim S.", rating: 3, comment: "Good value overall but I expected more variety in the exclusive events.", created_at: "2025-02-18T12:00:00Z" },
    ],
  },
  {
    id: "membership-seed-3",
    name: "Gold Membership",
    tier: "gold",
    description: "Premium tier with significant savings, VIP access, and personalized shopping experience.",
    benefits: ["15% off all purchases", "VIP lounge access", "Personal shopper", "Free same-day delivery", "Exclusive collections", "Annual gift box"],
    price: 3999,
    currency: "USD",
    billing_interval: "monthly",
    logo_url: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
    is_popular: true,
    max_members: 500,
    metadata: { thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg" },
    reviews: [
      { author: "Amina F.", rating: 5, comment: "The personal shopper service is amazing. They know exactly what I like.", created_at: "2025-01-03T10:00:00Z" },
      { author: "Majid L.", rating: 5, comment: "VIP lounge access at events is such a luxurious perk. Feel like royalty.", created_at: "2025-01-14T14:30:00Z" },
      { author: "Salwa K.", rating: 4, comment: "Same-day delivery works flawlessly. 15% off is the cherry on top.", created_at: "2025-01-25T11:00:00Z" },
      { author: "Tarek O.", rating: 5, comment: "The annual gift box was a wonderful surprise. High-quality curated items.", created_at: "2025-02-04T09:00:00Z" },
      { author: "Rania W.", rating: 4, comment: "Exclusive collections are genuinely unique. Worth every penny of the membership.", created_at: "2025-02-16T16:00:00Z" },
    ],
  },
  {
    id: "membership-seed-4",
    name: "Platinum Membership",
    tier: "platinum",
    description: "The ultimate membership experience with maximum discounts, concierge service, and luxury perks.",
    benefits: ["20% off all purchases", "24/7 concierge service", "Complimentary alterations", "Private shopping events", "Luxury gift wrapping", "Airport lounge access", "Quarterly luxury box"],
    price: 7999,
    currency: "USD",
    billing_interval: "monthly",
    logo_url: "/seed-images/memberships%2F1554224155-8d04cb21cd6c.jpg",
    is_popular: false,
    max_members: 100,
    metadata: { thumbnail: "/seed-images/memberships%2F1554224155-8d04cb21cd6c.jpg" },
    reviews: [
      { author: "Jaber Q.", rating: 5, comment: "The 24/7 concierge service is worth every cent. They handle everything perfectly.", created_at: "2025-01-06T08:00:00Z" },
      { author: "Lamia E.", rating: 5, comment: "Airport lounge access and quarterly luxury boxes make this membership unmatched.", created_at: "2025-01-18T12:00:00Z" },
      { author: "Mansour Y.", rating: 5, comment: "Private shopping events are an incredible experience. Truly exclusive.", created_at: "2025-01-30T10:30:00Z" },
      { author: "Ghada H.", rating: 4, comment: "20% off everything plus luxury gift wrapping. My go-to for all gifting needs.", created_at: "2025-02-08T14:00:00Z" },
      { author: "Sami C.", rating: 5, comment: "The platinum tier sets the standard for what a membership should be. Flawless.", created_at: "2025-02-20T09:00:00Z" },
    ],
  },
  {
    id: "membership-seed-5",
    name: "Student Membership",
    tier: "bronze",
    description: "Special membership for students with verified .edu email. Enjoy discounts on essentials.",
    benefits: ["8% off all purchases", "Free standard shipping", "Student-exclusive deals", "Back-to-school specials"],
    price: 499,
    currency: "USD",
    billing_interval: "monthly",
    logo_url: "/seed-images/campaigns%2F1503676260728-1c00da094a0b.jpg",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "/seed-images/campaigns%2F1503676260728-1c00da094a0b.jpg" },
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
    reviews: [
      { author: "Dana S.", rating: 5, comment: "As a student, this membership is a no-brainer. The discounts really help with my budget.", created_at: "2025-01-10T10:00:00Z" },
      { author: "Yasser T.", rating: 4, comment: "Back-to-school specials saved me a ton on textbooks and supplies.", created_at: "2025-01-22T13:00:00Z" },
      { author: "Maryam B.", rating: 4, comment: "Student-exclusive deals are actually good quality items, not just clearance.", created_at: "2025-02-01T11:30:00Z" },
      { author: "Khaled J.", rating: 5, comment: "Free shipping plus 8% off makes this the best student membership anywhere.", created_at: "2025-02-12T08:00:00Z" },
      { author: "Rana F.", rating: 3, comment: "Great value but wish it covered more product categories in the student deals.", created_at: "2025-02-22T15:00:00Z" },
    ],
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any
    const { id } = req.params
    const item = await moduleService.retrieveMembership(id)
    if (!item) {
      const seedItem = SEED_DATA.find((s) => s.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const seedItem = SEED_DATA.find((s) => s.id === req.params.id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
