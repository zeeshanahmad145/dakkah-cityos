import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  { id: "fp-1", name: "Personal Savings Account", description: "High-yield savings account with competitive returns and no minimum balance requirement.", product_type: "savings", interest_rate: 4.5, features: ["No minimum balance", "Daily compounding interest", "Free unlimited transfers", "Mobile banking access"], highlights: ["4.5% APY guaranteed for 12 months", "FDIC insured up to 250,000 SAR", "No monthly fees"], metadata: { thumbnail: "/seed-images/financial-products%2F1579621970563-ebec7560ff3e.jpg", icon: "banknotes", rate: "4.5% APY", price: null, currency: "SAR" } },
  { id: "fp-2", name: "Home Financing", description: "Shariah-compliant home financing with flexible terms and competitive profit rates.", product_type: "mortgage", interest_rate: 3.9, features: ["Fixed and variable rates", "Up to 30-year terms", "No early repayment penalties", "Online application"], highlights: ["Pre-approval in 24 hours", "Competitive rates from 3.9%", "Dedicated mortgage advisor"], metadata: { thumbnail: "/seed-images/financial-products%2F1560518883-ce09059eeffa.jpg", icon: "building", rate: "3.9% APR", price: null, currency: "SAR" } },
  { id: "fp-3", name: "Business Credit Line", description: "Flexible revolving credit facility for businesses with instant access to working capital.", product_type: "credit", interest_rate: 5.2, features: ["Revolving credit facility", "Draw funds as needed", "Interest only on used amount", "Auto-replenishing limit"], highlights: ["Instant access to working capital", "No collateral required up to 100K", "Dedicated business banking team"], metadata: { thumbnail: "/seed-images/b2b%2F1486406146926-c627a92ad1ab.jpg", icon: "chart", rate: "5.2% APR", price: null, currency: "SAR" } },
  { id: "fp-4", name: "Investment Portfolio", description: "Diversified investment portfolio managed by expert advisors with quarterly rebalancing.", product_type: "investment", interest_rate: 8.0, features: ["Professional fund management", "Quarterly rebalancing", "Diversified asset allocation", "Real-time portfolio tracking"], highlights: ["8% average annual return", "Low management fees", "Tax-efficient strategies"], metadata: { thumbnail: "/seed-images/financial-products%2F1611974789855-9c2a0a7236a3.jpg", icon: "globe", rate: "8.0% avg return", price: null, currency: "SAR" } },
  { id: "fp-5", name: "Travel Insurance", description: "Comprehensive travel coverage including medical emergencies, trip cancellation, and lost luggage.", product_type: "insurance", interest_rate: null, features: ["Medical emergency coverage", "Trip cancellation protection", "Lost luggage compensation", "24/7 assistance hotline"], highlights: ["Coverage in 190+ countries", "Instant policy activation", "Family plans available"], metadata: { thumbnail: "/seed-images/event-ticketing%2F1488646953014-85cb44e25828.jpg", icon: "shield", rate: "From 49 SAR", price: 4900, currency: "SAR" } },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as any
    const { id } = req.params
    const item = await mod.retrieveLoanProduct(id)
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
