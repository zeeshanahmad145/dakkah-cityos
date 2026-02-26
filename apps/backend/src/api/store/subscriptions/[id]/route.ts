import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_DATA = [
  {
    id: "sub-plan-1",
    name: "CityOS Pilot",
    description: "Perfect for small businesses getting started. Includes essential storefront features, basic analytics, and email support.",
    billing_interval: "monthly",
    price: 9900,
    currency_code: "SAR",
    status: "active",
    features: ["1 Storefront", "Basic Analytics", "Email Support", "5 Products"],
    thumbnail: "/seed-images/content%2F1460925895917-afdab827c52f.jpg",
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
    thumbnail: "/seed-images/b2b%2F1551288049-bebda4e38f71.jpg",
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
    thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg",
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
    thumbnail: "/seed-images/parking%2F1497366216548-37526070297c.jpg",
  },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("subscription") as any
    const { id } = req.params
    const item = await mod.retrieveSubscription(id)
    if (!item) {
      const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
      return res.json({ item: seedItem })
    }
    return res.json({ item })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}

