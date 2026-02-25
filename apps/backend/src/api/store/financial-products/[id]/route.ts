import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const SEED_DATA = [
  { id: "fp-1", name: "Personal Savings Account", description: "High-yield savings account with competitive returns and no minimum balance requirement.", product_type: "savings", interest_rate: 4.5, metadata: { thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop", icon: "banknotes", rate: "4.5% APY", price: null, currency: "SAR" } },
  { id: "fp-2", name: "Home Financing", description: "Shariah-compliant home financing with flexible terms and competitive profit rates.", product_type: "mortgage", interest_rate: 3.9, metadata: { thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop", icon: "building", rate: "3.9% APR", price: null, currency: "SAR" } },
  { id: "fp-3", name: "Business Credit Line", description: "Flexible revolving credit facility for businesses with instant access to working capital.", product_type: "credit", interest_rate: 5.2, metadata: { thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", icon: "chart", rate: "5.2% APR", price: null, currency: "SAR" } },
  { id: "fp-4", name: "Investment Portfolio", description: "Diversified investment portfolio managed by expert advisors with quarterly rebalancing.", product_type: "investment", interest_rate: 8.0, metadata: { thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop", icon: "globe", rate: "8.0% avg return", price: null, currency: "SAR" } },
  { id: "fp-5", name: "Travel Insurance", description: "Comprehensive travel coverage including medical emergencies, trip cancellation, and lost luggage.", product_type: "insurance", interest_rate: null, metadata: { thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop", icon: "shield", rate: "From 49 SAR", price: 4900, currency: "SAR" } },
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
