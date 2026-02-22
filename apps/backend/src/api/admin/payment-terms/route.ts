import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createPaymentTermSchema = z.object({
  name: z.string().min(1),
  net_days: z.number().positive(),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_days: z.number().min(0).default(0),
  is_default: z.boolean().default(false),
}).passthrough()

/**
 * Payment Terms with Early Payment Discounts
 * Supports structures like "2/10 Net 30" (2% discount if paid within 10 days, full amount due in 30 days)
 */

interface PaymentTerm {
  id: string
  name: string
  code: string // e.g., "2/10 Net 30"
  net_days: number // Days until full payment due
  discount_percent: number // Early payment discount percentage
  discount_days: number // Days to qualify for discount
  is_default: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// In-memory store (in production, this would be a database table)
const paymentTermsStore: Map<string, PaymentTerm> = new Map([
  ["pt_net30", {
    id: "pt_net30",
    name: "Net 30",
    code: "Net 30",
    net_days: 30,
    discount_percent: 0,
    discount_days: 0,
    is_default: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }],
  ["pt_2_10_net30", {
    id: "pt_2_10_net30",
    name: "2/10 Net 30",
    code: "2/10 Net 30",
    net_days: 30,
    discount_percent: 2,
    discount_days: 10,
    is_default: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }],
  ["pt_1_10_net60", {
    id: "pt_1_10_net60",
    name: "1/10 Net 60",
    code: "1/10 Net 60",
    net_days: 60,
    discount_percent: 1,
    discount_days: 10,
    is_default: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }]
])

/**
 * @route GET /admin/payment-terms
 * @desc List all payment terms with early payment discount configurations
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { is_active } = req.query

    let terms = Array.from(paymentTermsStore.values())

    if (is_active !== undefined) {
      const activeFilter = is_active === "true"
      terms = terms.filter(t => t.is_active === activeFilter)
    }

    // Sort by net_days ascending
    terms.sort((a, b) => a.net_days - b.net_days)

    res.json({
      payment_terms: terms,
      count: terms.length
    })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-PAYMENT-TERMS")}
}

/**
 * @route POST /admin/payment-terms
 * @desc Create a new payment term with early payment discount
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = createPaymentTermSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { name, net_days, discount_percent, discount_days, is_default } = parsed.data

    if (discount_days > net_days) {
      return res.status(400).json({ error: "Discount days cannot exceed net days" })
    }

    // Generate code automatically
    let code: string
    if (discount_percent > 0 && discount_days > 0) {
      code = `${discount_percent}/${discount_days} Net ${net_days}`
    } else {
      code = `Net ${net_days}`
    }

    const id = `pt_${Date.now()}`
    const newTerm: PaymentTerm = {
      id,
      name,
      code,
      net_days,
      discount_percent,
      discount_days,
      is_default,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    // If this is default, unset other defaults
    if (is_default) {
      paymentTermsStore.forEach((term, key) => {
        if (term.is_default) {
          paymentTermsStore.set(key, { ...term, is_default: false })
        }
      })
    }

    paymentTermsStore.set(id, newTerm)

    res.status(201).json({ payment_term: newTerm })
  } catch (error: any) {
    handleApiError(res, error, "ADMIN-PAYMENT-TERMS")}
}

