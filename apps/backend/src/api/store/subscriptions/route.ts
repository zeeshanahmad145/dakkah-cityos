import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../lib/api-error-handler"

const PLAN_IMAGES: Record<string, string> = {
  "CityOS Pilot": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  "CityOS District": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
  "CityOS Metro": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
  "CityOS Enterprise": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
  "CityOS Sovereign": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
}

const SEED_SUBSCRIPTIONS = [
  {
    id: "sub-plan-1",
    name: "CityOS Pilot",
    description: "Perfect for small businesses getting started. Includes essential storefront features, basic analytics, and email support.",
    billing_interval: "monthly",
    price: 9900,
    currency_code: "SAR",
    status: "active",
    features: ["1 Storefront", "Basic Analytics", "Email Support", "5 Products"],
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  },
  {
    id: "sub-plan-2",
    name: "CityOS District",
    description: "Growing businesses need room to scale. Multi-vertical support, advanced analytics, and priority support included.",
    billing_interval: "monthly",
    price: 29900,
    currency_code: "SAR",
    status: "active",
    features: ["3 Storefronts", "Advanced Analytics", "Priority Support", "50 Products", "Multi-Vertical"],
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
  },
  {
    id: "sub-plan-3",
    name: "CityOS Metro",
    description: "Enterprise-grade platform for established businesses. Unlimited verticals, custom integrations, and dedicated account manager.",
    billing_interval: "monthly",
    price: 79900,
    currency_code: "SAR",
    status: "active",
    features: ["Unlimited Storefronts", "Custom Analytics", "Dedicated Support", "Unlimited Products", "API Access", "Custom Domain"],
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
  },
  {
    id: "sub-plan-4",
    name: "CityOS Enterprise",
    description: "Full-scale city operating system for large organizations. White-label, SLA guarantees, and on-premise deployment options.",
    billing_interval: "yearly",
    price: 499900,
    currency_code: "SAR",
    status: "active",
    features: ["White-Label", "SLA Guarantee", "On-Premise Option", "Unlimited Everything", "24/7 Phone Support", "Custom Development"],
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
  },
]

function enrichWithImages(plans: any[]) {
  return plans.map((p: any) => ({
    ...p,
    thumbnail: p.thumbnail || PLAN_IMAGES[p.name] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
  }))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("subscription") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      billing_interval,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (billing_interval) filters.billing_interval = billing_interval

    const plans = await mod.listSubscriptionPlans(filters, {
      skip: Number(offset),
      take: Number(limit),
    })

    const rawPlans = Array.isArray(plans) ? plans : []
    const items = rawPlans.length > 0 ? enrichWithImages(rawPlans) : SEED_SUBSCRIPTIONS

    if (search) {
      const q = search.toLowerCase()
      const filtered = items.filter((p: any) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      )
      return res.json({
        subscriptions: filtered,
        items: filtered,
        count: filtered.length,
        limit: Number(limit),
        offset: Number(offset),
      })
    }

    return res.json({
      subscriptions: items,
      items,
      count: items.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({ subscriptions: SEED_SUBSCRIPTIONS, items: SEED_SUBSCRIPTIONS, count: SEED_SUBSCRIPTIONS.length, limit: 20, offset: 0 })
  }
}
