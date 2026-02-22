import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string(),
  customer_id: z.string(),
  utility_type: z.enum(["electricity", "water", "gas", "internet", "phone", "cable", "waste"]),
  provider_name: z.string(),
  account_number: z.string(),
  meter_number: z.string().optional(),
  address: z.any().optional(),
  status: z.enum(["active", "suspended", "closed"]).optional(),
  auto_pay: z.boolean().optional(),
  payment_method_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await mod.listUtilityAccounts({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin utilities")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("utilities") as any
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const item = await mod.createUtilityAccounts(parsed.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin utilities")}
}

