import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_DATA = [
  { id: "fp-1", name: "Personal Savings Account", description: "High-yield savings account with competitive returns and no minimum balance requirement.", product_type: "savings", interest_rate: 4.5, features: ["No minimum balance", "Daily compounding interest", "Free unlimited transfers", "Mobile banking access"], highlights: ["4.5% APY guaranteed for 12 months", "FDIC insured up to 250,000 SAR", "No monthly fees"], thumbnail: "/seed-images/financial-products/1579621970563-ebec7560ff3e.jpg", metadata: { thumbnail: "/seed-images/financial-products/1579621970563-ebec7560ff3e.jpg", icon: "banknotes", rate: "4.5% APY", price: null, currency: "SAR" }, documents: [
    { title: "Account Terms & Conditions", url: "/documents/savings-terms.pdf", type: "terms" },
    { title: "Interest Rate Schedule", url: "/documents/savings-rate-schedule.pdf", type: "schedule" },
    { title: "FDIC Insurance Disclosure", url: "/documents/fdic-disclosure.pdf", type: "disclosure" },
  ], reviews: [
    { author: "Abdullah K.", rating: 5, comment: "4.5% APY is the best I've found. No minimum balance makes it accessible for everyone.", created_at: "2025-12-10T10:00:00Z" },
    { author: "Sarah N.", rating: 5, comment: "Daily compounding really adds up. Transferred my savings here and couldn't be happier.", created_at: "2025-12-07T14:30:00Z" },
    { author: "Mohamed R.", rating: 4, comment: "Great savings account with no hidden fees. Mobile app makes managing funds easy.", created_at: "2025-12-03T09:15:00Z" },
    { author: "Layla F.", rating: 4, comment: "Reliable and straightforward. Free transfers between accounts is a nice perk.", created_at: "2025-11-29T16:45:00Z" },
    { author: "Hassan B.", rating: 3, comment: "Good rates but customer service could be faster. Product itself is solid.", created_at: "2025-11-25T11:00:00Z" },
  ] },
  { id: "fp-2", name: "Home Financing", description: "Shariah-compliant home financing with flexible terms and competitive profit rates.", product_type: "mortgage", interest_rate: 3.9, features: ["Fixed and variable rates", "Up to 30-year terms", "No early repayment penalties", "Online application"], highlights: ["Pre-approval in 24 hours", "Competitive rates from 3.9%", "Dedicated mortgage advisor"], thumbnail: "/seed-images/financial-products/1560518883-ce09059eeffa.jpg", metadata: { thumbnail: "/seed-images/financial-products/1560518883-ce09059eeffa.jpg", icon: "building", rate: "3.9% APR", price: null, currency: "SAR" }, documents: [
    { title: "Home Financing Agreement", url: "/documents/home-financing-agreement.pdf", type: "agreement" },
    { title: "Shariah Compliance Certificate", url: "/documents/shariah-certificate.pdf", type: "certificate" },
    { title: "Property Valuation Guidelines", url: "/documents/valuation-guidelines.pdf", type: "guide" },
  ], reviews: [
    { author: "Khalid A.", rating: 5, comment: "Shariah-compliant financing with excellent rates. Pre-approval came within 24 hours as promised.", created_at: "2025-12-09T13:20:00Z" },
    { author: "Nora S.", rating: 4, comment: "Dedicated mortgage advisor was incredibly helpful throughout the process. Smooth experience.", created_at: "2025-12-05T10:00:00Z" },
    { author: "Fahad M.", rating: 5, comment: "No early repayment penalties is a game-changer. Already paid off 20% ahead of schedule.", created_at: "2025-12-01T15:45:00Z" },
    { author: "Reem T.", rating: 4, comment: "Competitive rates and flexible terms. Online application saved us time. Highly recommend.", created_at: "2025-11-27T09:30:00Z" },
    { author: "Saeed W.", rating: 3, comment: "Good product but paperwork was extensive. Rates are competitive once approved.", created_at: "2025-11-23T12:15:00Z" },
  ] },
  { id: "fp-3", name: "Business Credit Line", description: "Flexible revolving credit facility for businesses with instant access to working capital.", product_type: "credit", interest_rate: 5.2, features: ["Revolving credit facility", "Draw funds as needed", "Interest only on used amount", "Auto-replenishing limit"], highlights: ["Instant access to working capital", "No collateral required up to 100K", "Dedicated business banking team"], thumbnail: "/seed-images/financial-products/1611974789855-9c2a0a7236a3.jpg", metadata: { thumbnail: "/seed-images/b2b/1486406146926-c627a92ad1ab.jpg", icon: "chart", rate: "5.2% APR", price: null, currency: "SAR" }, documents: [
    { title: "Credit Line Agreement", url: "/documents/credit-line-agreement.pdf", type: "agreement" },
    { title: "Business Requirements Checklist", url: "/documents/business-requirements.pdf", type: "checklist" },
    { title: "Fee Schedule", url: "/documents/credit-fee-schedule.pdf", type: "schedule" },
  ], reviews: [
    { author: "Omar D.", rating: 5, comment: "Instant access to working capital saved our business during a tight quarter. Excellent facility.", created_at: "2025-12-08T11:30:00Z" },
    { author: "Fatima H.", rating: 4, comment: "Pay interest only on what you use — brilliant. Our dedicated banking team is responsive.", created_at: "2025-12-04T14:00:00Z" },
    { author: "Ali G.", rating: 5, comment: "No collateral up to 100K made this accessible for our startup. Auto-replenishing is convenient.", created_at: "2025-11-30T09:45:00Z" },
    { author: "Mona K.", rating: 4, comment: "Great revolving credit facility. Draw and repay as needed. Very flexible for seasonal businesses.", created_at: "2025-11-26T16:20:00Z" },
    { author: "Youssef B.", rating: 3, comment: "Good product but 5.2% is a bit high. Would appreciate loyalty discounts for long-term clients.", created_at: "2025-11-22T10:30:00Z" },
  ] },
  { id: "fp-4", name: "Investment Portfolio", description: "Diversified investment portfolio managed by expert advisors with quarterly rebalancing.", product_type: "investment", interest_rate: 8.0, features: ["Professional fund management", "Quarterly rebalancing", "Diversified asset allocation", "Real-time portfolio tracking"], highlights: ["8% average annual return", "Low management fees", "Tax-efficient strategies"], thumbnail: "/seed-images/financial-products/1611974789855-9c2a0a7236a3.jpg", metadata: { thumbnail: "/seed-images/financial-products/1611974789855-9c2a0a7236a3.jpg", icon: "globe", rate: "8.0% avg return", price: null, currency: "SAR" }, documents: [
    { title: "Investment Prospectus", url: "/documents/investment-prospectus.pdf", type: "prospectus" },
    { title: "Risk Assessment Report", url: "/documents/risk-assessment.pdf", type: "report" },
    { title: "Quarterly Performance Summary", url: "/documents/quarterly-performance.pdf", type: "report" },
  ], reviews: [
    { author: "Tariq N.", rating: 5, comment: "8% average return has been consistent. Professional fund managers really know what they're doing.", created_at: "2025-12-10T09:00:00Z" },
    { author: "Dalal R.", rating: 5, comment: "Real-time portfolio tracking gives peace of mind. Quarterly rebalancing keeps things optimized.", created_at: "2025-12-06T12:45:00Z" },
    { author: "Mansour F.", rating: 4, comment: "Diversified allocation across sectors and geographies. Low management fees are a plus.", created_at: "2025-12-02T16:30:00Z" },
    { author: "Hana A.", rating: 4, comment: "Tax-efficient strategies have saved us significantly. Great for long-term wealth building.", created_at: "2025-11-28T10:15:00Z" },
    { author: "Badr S.", rating: 3, comment: "Good returns but minimum investment is high. Would like more entry-level options.", created_at: "2025-11-24T14:00:00Z" },
  ] },
  { id: "fp-5", name: "Travel Insurance", description: "Comprehensive travel coverage including medical emergencies, trip cancellation, and lost luggage.", product_type: "insurance", interest_rate: null, features: ["Medical emergency coverage", "Trip cancellation protection", "Lost luggage compensation", "24/7 assistance hotline"], highlights: ["Coverage in 190+ countries", "Instant policy activation", "Family plans available"], thumbnail: "/seed-images/financial-products/1579621970563-ebec7560ff3e.jpg", metadata: { thumbnail: "/seed-images/event-ticketing/1488646953014-85cb44e25828.jpg", icon: "shield", rate: "From 49 SAR", price: 4900, currency: "SAR" }, documents: [
    { title: "Policy Terms & Conditions", url: "/documents/travel-insurance-terms.pdf", type: "terms" },
    { title: "Coverage Details by Plan", url: "/documents/coverage-details.pdf", type: "coverage" },
    { title: "Claims Submission Guide", url: "/documents/claims-guide.pdf", type: "guide" },
  ], reviews: [
    { author: "Amira L.", rating: 5, comment: "Used the medical emergency coverage abroad and the 24/7 hotline was incredibly helpful.", created_at: "2025-12-09T10:30:00Z" },
    { author: "Waleed K.", rating: 4, comment: "Instant policy activation is perfect for last-minute trips. Coverage in 190+ countries.", created_at: "2025-12-05T15:00:00Z" },
    { author: "Salma J.", rating: 5, comment: "Trip cancellation protection saved us thousands when our flight was cancelled. Worth every riyal.", created_at: "2025-12-01T11:20:00Z" },
    { author: "Nasser M.", rating: 4, comment: "Family plan is great value. Lost luggage claim was processed quickly and fairly.", created_at: "2025-11-27T14:45:00Z" },
    { author: "Ghada T.", rating: 3, comment: "Good coverage but claims process could be streamlined. Coverage itself is comprehensive.", created_at: "2025-11-23T09:00:00Z" },
  ] },
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
    return res.json({ item: enrichDetailItem(item, "financial-products") })
  } catch (error: any) {
    const { id } = req.params
    const seedItem = SEED_DATA.find(i => i.id === id) || SEED_DATA[0]
    return res.json({ item: seedItem })
  }
}
