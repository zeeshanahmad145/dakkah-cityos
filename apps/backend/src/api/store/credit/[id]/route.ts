import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleApiError } from "../../../../lib/api-error-handler"

const SEED_CREDIT = [
  { id: "credit-1", name: "Premium Business Credit", description: "Flexible credit line for established businesses with competitive rates and easy repayment terms.", credit_type: "revolving", interest_rate: 5.9, credit_limit: 50000000, currency: "USD", term_months: 12, min_payment_percent: 5, status: "active", features: ["No annual fee", "0% intro APR for 6 months", "Cashback rewards", "Online account management", "Auto-pay options"], requirements: ["Minimum credit score 650", "Business operating for at least 2 years", "Annual revenue of $100,000+", "Valid business registration documents"], thumbnail: "/seed-images/credit%2F1563013544-824ae1b704d3.jpg", metadata: { thumbnail: "/seed-images/credit%2F1563013544-824ae1b704d3.jpg" } },
  { id: "credit-2", name: "Startup Growth Credit", description: "Designed for growing startups with flexible credit terms and milestone-based increases.", credit_type: "term", interest_rate: 7.5, credit_limit: 25000000, currency: "USD", term_months: 24, min_payment_percent: 3, status: "active", features: ["Growth milestone bonuses", "Deferred payments available", "Business advisor access", "Expense tracking tools", "Multi-user access"], requirements: ["Minimum credit score 600", "Business plan or pitch deck required", "At least 6 months of operating history", "Personal guarantee from founders"], thumbnail: "/seed-images/credit%2F1559526324-4b87b5e36e44.jpg", metadata: { thumbnail: "/seed-images/credit%2F1559526324-4b87b5e36e44.jpg" } },
  { id: "credit-3", name: "Enterprise Trade Credit", description: "High-limit trade credit for enterprise clients with NET-60 terms and volume discounts.", credit_type: "trade", interest_rate: 4.2, credit_limit: 200000000, currency: "USD", term_months: 36, min_payment_percent: 10, status: "active", features: ["Dedicated account manager", "Custom payment schedules", "Volume discounts", "Priority support", "API integration"], requirements: ["Minimum credit score 700", "Annual revenue of $1,000,000+", "Audited financial statements required", "Minimum 3 trade references"], thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg", metadata: { thumbnail: "/seed-images/content%2F1454165804606-c3d57bc86b40.jpg" } },
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
      item: {
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
      },
    })
  } catch (error: any) {
    const { id } = req.params
    const seed = SEED_CREDIT.find((s) => s.id === id) || SEED_CREDIT[0]
    return res.json({ item: { ...seed, id } })
  }
}
