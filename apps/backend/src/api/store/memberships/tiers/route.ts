import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_TIERS = [
  {
    id: "tier-bronze",
    name: "Bronze",
    description: "Get started with basic member benefits including early access to sales and a welcome discount.",
    tier_level: 1,
    min_points: 0,
    benefits: ["5% off all purchases", "Early access to sales", "Birthday reward", "Free standard shipping"],
    perks: ["Welcome gift", "Member newsletter"],
    color_code: "#CD7F32",
    thumbnail: "/seed-images/affiliate/1483985988355-763728e1935b.jpg",
    annual_fee: 999,
    currency_code: "SAR",
    is_active: true,
    upgrade_threshold: 1000,
  },
  {
    id: "tier-silver",
    name: "Silver",
    description: "Enhanced benefits with bigger discounts, priority support, and exclusive member events.",
    tier_level: 2,
    min_points: 1000,
    benefits: ["10% off all purchases", "Priority customer support", "Exclusive member events", "Free express shipping", "Early product launches"],
    perks: ["Silver card", "Quarterly newsletter", "Birthday bonus points"],
    color_code: "#C0C0C0",
    thumbnail: "/seed-images/campaigns/1556742049-0cfed4f6a45d.jpg",
    annual_fee: 1999,
    currency_code: "SAR",
    is_active: true,
    upgrade_threshold: 5000,
  },
  {
    id: "tier-gold",
    name: "Gold",
    description: "Premium tier with significant savings, VIP access, and personalized shopping experience.",
    tier_level: 3,
    min_points: 5000,
    benefits: ["15% off all purchases", "VIP lounge access", "Personal shopper", "Free same-day delivery", "Exclusive collections", "Annual gift box"],
    perks: ["Gold card", "Quarterly luxury box", "Dedicated account manager"],
    color_code: "#FFD700",
    thumbnail: "/seed-images/memberships/1441986300917-64674bd600d8.jpg",
    annual_fee: 3999,
    currency_code: "SAR",
    is_active: true,
    upgrade_threshold: 15000,
  },
  {
    id: "tier-platinum",
    name: "Platinum",
    description: "The ultimate membership with maximum discounts, concierge service, and luxury perks.",
    tier_level: 4,
    min_points: 15000,
    benefits: ["20% off all purchases", "24/7 concierge", "Complimentary alterations", "Private shopping events", "Luxury gift wrapping", "Airport lounge access", "Quarterly luxury box"],
    perks: ["Platinum black card", "Personal stylist", "Concierge hotline"],
    color_code: "#E5E4E2",
    thumbnail: "/seed-images/memberships/1554224155-8d04cb21cd6c.jpg",
    annual_fee: 7999,
    currency_code: "SAR",
    is_active: true,
    upgrade_threshold: null,
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("membership") as any
    const { limit = "20", offset = "0", tenant_id, is_active } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (is_active !== undefined) filters.is_active = is_active === "true"

    let tiers: any[] = []
    try {
      const raw = await moduleService.listMembershipTiers(filters, {
        skip: Number(offset),
        take: Number(limit),
      })
      tiers = Array.isArray(raw) ? raw : []
    } catch {}

    const results = tiers.length > 0
      ? tiers.map((t: any) => ({
          ...t,
          annual_fee: t.annual_fee ? Number(t.annual_fee) : null,
          thumbnail: t.icon_url || t.thumbnail || null,
        }))
      : SEED_TIERS

    res.json({
      tiers: results,
      count: results.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-MEMBERSHIPS-TIERS")
  }
}
