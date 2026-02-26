import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "membership-seed-1",
    thumbnail: "/seed-images/affiliate%2F1483985988355-763728e1935b.jpg",
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
  },
  {
    id: "membership-seed-2",
    thumbnail: "/seed-images/campaigns%2F1556742049-0cfed4f6a45d.jpg",
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
  },
  {
    id: "membership-seed-3",
    thumbnail: "/seed-images/memberships%2F1441986300917-64674bd600d8.jpg",
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
  },
  {
    id: "membership-seed-4",
    thumbnail: "/seed-images/memberships%2F1554224155-8d04cb21cd6c.jpg",
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
  },
  {
    id: "membership-seed-5",
    thumbnail: "/seed-images/campaigns%2F1503676260728-1c00da094a0b.jpg",
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
  },
]

const createMembershipSchema = z.object({
  tenant_id: z.string().min(1),
  plan_id: z.string().min(1).optional(),
  customer_id: z.string().min(1).optional(),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any
    const { limit = "20", offset = "0", tenant_id, customer_id, status } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (customer_id) filters.customer_id = customer_id
    if (status) filters.status = status
    const items = await moduleService.listMemberships(filters, { skip: Number(offset), take: Number(limit) })
    const results = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({ items: results, count: results.length, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-MEMBERSHIPS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createMembershipSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const moduleService = req.scope.resolve("membership") as any
    const item = await moduleService.createMemberships(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-MEMBERSHIPS")}
}
