import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"
import { enrichDetailItem } from "../../../../lib/detail-enricher"

const SEED_CREDIT = [
  { id: "credit-1", name: "Premium Business Credit", description: "Flexible credit line for established businesses with competitive rates and easy repayment terms.", credit_type: "revolving", interest_rate: 5.9, credit_limit: 50000000, currency: "USD", term_months: 12, min_payment_percent: 5, status: "active", features: ["No annual fee", "0% intro APR for 6 months", "Cashback rewards", "Online account management", "Auto-pay options"], requirements: ["Minimum credit score 650", "Business operating for at least 2 years", "Annual revenue of $100,000+", "Valid business registration documents"], thumbnail: "/seed-images/credit/1563013544-824ae1b704d3.jpg", metadata: { thumbnail: "/seed-images/credit/1563013544-824ae1b704d3.jpg" }, reviews: [
    { author: "David Chen", rating: 5, comment: "Excellent credit line for our business. The 0% intro APR helped us manage cash flow during expansion.", created_at: "2025-12-10T10:00:00Z" },
    { author: "Sarah Williams", rating: 4, comment: "Great rates and easy application process. Online management tools are very intuitive.", created_at: "2025-12-07T14:30:00Z" },
    { author: "Michael Torres", rating: 5, comment: "Cashback rewards add up quickly. Best business credit product we've used in 10 years.", created_at: "2025-12-03T09:15:00Z" },
    { author: "Jennifer Park", rating: 4, comment: "Solid credit facility with competitive rates. Auto-pay options make repayment hassle-free.", created_at: "2025-11-29T16:45:00Z" },
    { author: "Robert Kim", rating: 3, comment: "Good product overall but the approval process took longer than expected. Rates are fair.", created_at: "2025-11-25T11:00:00Z" },
  ] },
  { id: "credit-2", name: "Startup Growth Credit", description: "Designed for growing startups with flexible credit terms and milestone-based increases.", credit_type: "term", interest_rate: 7.5, credit_limit: 25000000, currency: "USD", term_months: 24, min_payment_percent: 3, status: "active", features: ["Growth milestone bonuses", "Deferred payments available", "Business advisor access", "Expense tracking tools", "Multi-user access"], requirements: ["Minimum credit score 600", "Business plan or pitch deck required", "At least 6 months of operating history", "Personal guarantee from founders"], thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg", metadata: { thumbnail: "/seed-images/credit/1559526324-4b87b5e36e44.jpg" }, reviews: [
    { author: "Alex Rivera", rating: 5, comment: "Perfect for our Series A stage. Milestone-based increases aligned perfectly with our growth.", created_at: "2025-12-09T13:20:00Z" },
    { author: "Emma Liu", rating: 4, comment: "The business advisor access alone is worth it. Great support for early-stage companies.", created_at: "2025-12-05T10:00:00Z" },
    { author: "Chris Anderson", rating: 4, comment: "Deferred payments helped us through a tight quarter. Flexible and founder-friendly.", created_at: "2025-12-01T15:45:00Z" },
    { author: "Maya Patel", rating: 3, comment: "Interest rate is a bit high but the flexibility makes up for it. Good for startups.", created_at: "2025-11-27T09:30:00Z" },
    { author: "Jason Nguyen", rating: 5, comment: "Expense tracking tools are excellent. Helped us get better visibility into our spending.", created_at: "2025-11-23T12:15:00Z" },
  ] },
  { id: "credit-3", name: "Enterprise Trade Credit", description: "High-limit trade credit for enterprise clients with NET-60 terms and volume discounts.", credit_type: "trade", interest_rate: 4.2, credit_limit: 200000000, currency: "USD", term_months: 36, min_payment_percent: 10, status: "active", features: ["Dedicated account manager", "Custom payment schedules", "Volume discounts", "Priority support", "API integration"], requirements: ["Minimum credit score 700", "Annual revenue of $1,000,000+", "Audited financial statements required", "Minimum 3 trade references"], thumbnail: "/seed-images/content/1454165804606-c3d57bc86b40.jpg", metadata: { thumbnail: "/seed-images/content/1454165804606-c3d57bc86b40.jpg" }, reviews: [
    { author: "Patricia Moore", rating: 5, comment: "The dedicated account manager is exceptional. Custom payment schedules saved us thousands.", created_at: "2025-12-08T11:30:00Z" },
    { author: "James Wilson", rating: 5, comment: "API integration with our ERP was seamless. Volume discounts are generous at our scale.", created_at: "2025-12-04T14:00:00Z" },
    { author: "Linda Garcia", rating: 4, comment: "Priority support is responsive and knowledgeable. NET-60 terms work well for our cycle.", created_at: "2025-11-30T09:45:00Z" },
    { author: "Thomas Brown", rating: 4, comment: "High credit limit met our enterprise needs. The approval process was thorough but worth it.", created_at: "2025-11-26T16:20:00Z" },
    { author: "Karen Johnson", rating: 5, comment: "Best trade credit facility in the market. We've been customers for 3 years and counting.", created_at: "2025-11-22T10:30:00Z" },
  ] },
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const companyModule = req.scope.resolve("company") as any
    const { id } = req.params
    const company = await companyModule.retrieveCompany(id)
    if (!company) {
      const seed = SEED_CREDIT.find((s) => s.id === id) || SEED_CREDIT[0]
      return res.json({ item: { ...seed, id } })
    }

    const creditLimit = Number(company.credit_limit || 0)
    const creditUsed = Number(company.credit_used || 0)
    const availableCredit = creditLimit - creditUsed

    return res.json({
      item: enrichDetailItem({
        id: company.id,
        name: company.name,
        credit: {
          limit: creditLimit,
          used: creditUsed,
          available: availableCredit,
          utilization_percent: creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 10000) / 100 : 0,
          payment_terms: company.payment_terms,
          currency: "USD",
        },
      }, "credit"),
    })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_CREDIT.find((s) => s.id === id) || SEED_CREDIT[0]
    return res.json({ item: { ...seed, id } })
  }
}
