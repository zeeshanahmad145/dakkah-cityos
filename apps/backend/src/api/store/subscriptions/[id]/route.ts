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
    reviews: [
      { author: "Youssef A.", rating: 5, comment: "Perfect starter plan for my small online shop. Easy setup and great support.", created_at: "2024-11-15T09:00:00Z" },
      { author: "Maha K.", rating: 4, comment: "Good value for the price. Basic analytics cover what I need for now.", created_at: "2024-11-01T14:00:00Z" },
      { author: "Tariq S.", rating: 5, comment: "Started here and grew my business. The 14-day trial convinced me instantly.", created_at: "2024-10-18T10:30:00Z" },
      { author: "Lina M.", rating: 4, comment: "Simple and straightforward. Perfect for testing the platform.", created_at: "2024-10-02T16:15:00Z" },
      { author: "Hamza R.", rating: 3, comment: "Good for starters but quickly outgrew the 5 product limit.", created_at: "2024-09-15T11:45:00Z" },
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
    reviews: [
      { author: "Bandar F.", rating: 5, comment: "Multi-vertical support is a game changer. Running food and retail from one dashboard.", created_at: "2024-11-12T10:00:00Z" },
      { author: "Noor H.", rating: 5, comment: "Advanced analytics helped us understand our customers so much better.", created_at: "2024-10-28T15:30:00Z" },
      { author: "Khalid D.", rating: 4, comment: "Great plan for growing businesses. Priority support is responsive and helpful.", created_at: "2024-10-15T09:45:00Z" },
      { author: "Sara W.", rating: 5, comment: "The data migration was seamless. Moved from Shopify without any issues.", created_at: "2024-09-30T14:00:00Z" },
      { author: "Faisal T.", rating: 4, comment: "Solid mid-tier plan. Would love more than 3 storefronts though.", created_at: "2024-09-12T11:20:00Z" },
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
    reviews: [
      { author: "Sultan B.", rating: 5, comment: "Enterprise-grade features at a reasonable price. API access is excellent.", created_at: "2024-11-10T08:30:00Z" },
      { author: "Amal N.", rating: 5, comment: "Custom domain and unlimited products made scaling effortless.", created_at: "2024-10-25T13:00:00Z" },
      { author: "Waleed G.", rating: 5, comment: "The dedicated support alone is worth the upgrade. Response times under 1 hour.", created_at: "2024-10-08T10:15:00Z" },
      { author: "Reem J.", rating: 4, comment: "Powerful analytics dashboards. Wish there were more template options.", created_at: "2024-09-22T15:45:00Z" },
      { author: "Mazen L.", rating: 5, comment: "Running 8 storefronts seamlessly. This plan handles everything we throw at it.", created_at: "2024-09-05T09:30:00Z" },
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
    reviews: [
      { author: "Prince Ventures", rating: 5, comment: "White-label solution transformed our platform. Clients love the custom branding.", created_at: "2024-11-08T07:00:00Z" },
      { author: "Gulf Corp", rating: 5, comment: "On-premise deployment met all our compliance requirements. Excellent team.", created_at: "2024-10-20T11:00:00Z" },
      { author: "Riyadh Holdings", rating: 5, comment: "The SLA guarantee gives us confidence. Zero downtime in 6 months.", created_at: "2024-10-05T08:30:00Z" },
      { author: "NEOM Digital", rating: 4, comment: "Custom development hours are invaluable. Built features unique to our market.", created_at: "2024-09-18T14:00:00Z" },
      { author: "Vision Group", rating: 5, comment: "Best enterprise platform we've used. 24/7 support is truly 24/7.", created_at: "2024-09-01T10:45:00Z" },
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

