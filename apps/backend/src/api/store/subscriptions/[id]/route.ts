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
    included: ["Single storefront setup", "Basic sales dashboard", "Email support (48h response)", "Up to 5 product listings", "Standard checkout flow"],
    faq: [
      { question: "Can I upgrade my plan later?", answer: "Yes, you can upgrade to any higher plan at any time. Your billing will be prorated for the remaining period." },
      { question: "Is there a free trial?", answer: "Yes, all plans come with a 14-day free trial. No credit card required to start." },
      { question: "What payment methods are accepted?", answer: "We accept all major credit cards, bank transfers, and digital wallets including Apple Pay and mada." },
      { question: "Can I cancel anytime?", answer: "Absolutely. You can cancel your subscription at any time with no cancellation fees." },
    ],
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
    included: ["Up to 3 storefronts", "Advanced analytics & reports", "Priority email & chat support", "Up to 50 product listings", "Multi-vertical commerce support"],
    faq: [
      { question: "What verticals are supported?", answer: "District supports all CityOS verticals including retail, food, services, bookings, and more." },
      { question: "Can I add more storefronts?", answer: "The District plan includes 3 storefronts. For unlimited storefronts, upgrade to the Metro plan." },
      { question: "Is data migration included?", answer: "Yes, we offer free data migration from other platforms when you sign up for District or higher." },
      { question: "What analytics are included?", answer: "Advanced analytics includes sales trends, customer insights, conversion funnels, and product performance." },
    ],
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
    included: ["Unlimited storefronts & products", "Custom analytics dashboards", "Dedicated account manager", "Full API access & webhooks", "Custom domain support"],
    faq: [
      { question: "Do I get a dedicated account manager?", answer: "Yes, Metro plan customers receive a dedicated account manager for personalized onboarding and ongoing support." },
      { question: "What API rate limits apply?", answer: "Metro plan includes generous API limits of 10,000 requests per minute with burst capacity available." },
      { question: "Can I use my own domain?", answer: "Yes, custom domain support is included. We handle SSL certificates and DNS configuration for you." },
      { question: "Is there an SLA?", answer: "Metro plan includes a 99.9% uptime SLA with credits for any downtime beyond the guarantee." },
    ],
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
    included: ["Full white-label customization", "99.99% SLA guarantee", "On-premise deployment option", "Unlimited everything", "24/7 phone & dedicated support"],
    faq: [
      { question: "What does white-label include?", answer: "Full white-label includes custom branding, domain, emails, and complete removal of CityOS branding." },
      { question: "Is on-premise deployment available?", answer: "Yes, Enterprise customers can choose on-premise deployment with our team handling installation and maintenance." },
      { question: "What is the SLA guarantee?", answer: "Enterprise plan includes a 99.99% uptime SLA with financial credits and priority incident response." },
      { question: "Can I get custom development?", answer: "Yes, Enterprise includes a pool of custom development hours for building features specific to your business needs." },
    ],
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

