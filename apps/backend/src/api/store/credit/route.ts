import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const applyCreditSchema = z.object({
  cart_id: z.string().min(1),
  amount: z.number().positive(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      credit: {
        limit: 0,
        used: 0,
        available: 0,
        currency: "USD",
      },
      public_info: {
        title: "Store Credit & Buy Now, Pay Later",
        description: "Flexible credit options for businesses and individuals.",
        options: [
          { name: "Business Credit Line", description: "Get approved for a revolving credit line for your business purchases", requirements: "Business account required" },
          { name: "Net-30 Terms", description: "Pay within 30 days of purchase with no interest", requirements: "Approved business account" },
          { name: "Net-60 Terms", description: "Extended 60-day payment terms for qualified businesses", requirements: "Established business relationship" },
        ],
        how_to_apply: [
          "Create or log in to your account",
          "Link your business profile",
          "Submit a credit application",
          "Get approved and start purchasing on credit",
        ],
      },
    })
  }

  const { tenant_id } = req.query as Record<string, string | undefined>

  try {
    const companyModule = req.scope.resolve("company") as any

    const employees = await companyModule.listCompanyEmployees({
      customer_id: customerId,
    })

    const employeeList = Array.isArray(employees) ? employees : [employees].filter(Boolean)

    if (employeeList.length === 0) {
      return res.json({
        credit: {
          limit: 0,
          used: 0,
          available: 0,
          currency: "USD",
        },
      })
    }

    const employee = employeeList[0]
    const company = await companyModule.retrieveCompany(employee.company_id)

    const creditLimit = Number(company.credit_limit || 0)
    const creditUsed = Number(company.credit_used || 0)
    const availableCredit = creditLimit - creditUsed

    res.json({
      credit: {
        limit: creditLimit,
        used: creditUsed,
        available: availableCredit,
        utilization_percent: creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 10000) / 100 : 0,
        payment_terms: company.payment_terms,
        currency: "USD",
      },
      company: {
        id: company.id,
        name: company.name,
      },
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CREDIT")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const parsed = applyCreditSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
  }

  const { cart_id, amount } = parsed.data

  try {
    const companyModule = req.scope.resolve("company") as any

    const employees = await companyModule.listCompanyEmployees({
      customer_id: customerId,
    })

    const employeeList = Array.isArray(employees) ? employees : [employees].filter(Boolean)

    if (employeeList.length === 0) {
      return res.status(404).json({ message: "No company account found" })
    }

    const employee = employeeList[0]
    const company = await companyModule.retrieveCompany(employee.company_id)

    const creditLimit = Number(company.credit_limit || 0)
    const creditUsed = Number(company.credit_used || 0)
    const availableCredit = creditLimit - creditUsed

    if (amount > availableCredit) {
      return res.status(400).json({ message: "Insufficient credit balance" })
    }

    res.json({
      success: true,
      applied_amount: amount,
      remaining_credit: availableCredit - amount,
      cart_id,
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-CREDIT")}
}

