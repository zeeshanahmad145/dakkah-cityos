import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createDisputeSchema = z.object({
  order_id: z.string().optional(),
  customer_id: z.string().optional(),
  reason: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as any
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    const filters: Record<string, any> = {}
    if (req.query.status) filters.status = req.query.status
    if (req.query.customer_id) filters.customer_id = req.query.customer_id
    if (req.query.order_id) filters.order_id = req.query.order_id
    const result = await service.listDisputes(filters, { take: limit, skip: offset })
    const disputes = Array.isArray(result) ? result : [result].filter(Boolean)
    const count = disputes.length
    res.json({ disputes, count, limit, offset })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-DISPUTES")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("dispute") as any
    const parsed = createDisputeSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const dispute = await service.createDisputes(parsed.data)
    res.status(201).json({ dispute })
  } catch (error: any) {
    return handleApiError(res, error, "ADMIN-DISPUTES")}
}

