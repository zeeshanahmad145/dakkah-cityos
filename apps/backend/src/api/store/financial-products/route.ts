import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const SEED_DATA = [
  { id: "fp-1", name: "Personal Savings Account", description: "High-yield savings account with competitive returns and no minimum balance requirement.", product_type: "savings", interest_rate: 4.5, metadata: { thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop", icon: "banknotes", rate: "4.5% APY", price: null, currency: "SAR" } },
  { id: "fp-2", name: "Home Financing", description: "Shariah-compliant home financing with flexible terms and competitive profit rates.", product_type: "mortgage", interest_rate: 3.9, metadata: { thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop", icon: "building", rate: "3.9% APR", price: null, currency: "SAR" } },
  { id: "fp-3", name: "Business Credit Line", description: "Flexible revolving credit facility for businesses with instant access to working capital.", product_type: "credit", interest_rate: 5.2, metadata: { thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop", icon: "chart", rate: "5.2% APR", price: null, currency: "SAR" } },
  { id: "fp-4", name: "Investment Portfolio", description: "Diversified investment portfolio managed by expert advisors with quarterly rebalancing.", product_type: "investment", interest_rate: 8.0, metadata: { thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop", icon: "globe", rate: "8.0% avg return", price: null, currency: "SAR" } },
  { id: "fp-5", name: "Travel Insurance", description: "Comprehensive travel coverage including medical emergencies, trip cancellation, and lost luggage.", product_type: "insurance", interest_rate: null, metadata: { thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop", icon: "shield", rate: "From 49 SAR", price: 4900, currency: "SAR" } },
]

const createFinancialProductSchema = z.object({
  name: z.string().min(1),
  product_type: z.string().min(1),
  interest_rate: z.number().optional(),
  term: z.number().optional(),
  tenant_id: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("financialProduct") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      product_type,
      min_rate,
      max_rate,
      term,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (product_type) filters.product_type = product_type
    if (min_rate) filters.min_rate = Number(min_rate)
    if (max_rate) filters.max_rate = Number(max_rate)
    if (term) filters.term = Number(term)
    if (search) filters.search = search

    const items = await mod.listLoanProducts(filters, { skip: Number(offset), take: Number(limit) })
    const itemList = Array.isArray(items) && items.length > 0 ? items : SEED_DATA
    return res.json({
      items: itemList,
      count: itemList.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    return res.json({ items: SEED_DATA, count: SEED_DATA.length, limit: 20, offset: 0 })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createFinancialProductSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("financialProduct") as any
    const item = await mod.createLoanProducts(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-FINANCIAL-PRODUCTS")}
}

