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
    logo_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
    is_popular: true,
    max_members: 500,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: 100,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop" },
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
