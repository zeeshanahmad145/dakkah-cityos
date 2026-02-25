import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

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
    logo_url: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop",
    is_popular: true,
    max_members: 500,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: 100,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&h=600&fit=crop" },
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
    logo_url: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=600&fit=crop",
    is_popular: false,
    max_members: null,
    metadata: { thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&h=600&fit=crop" },
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
