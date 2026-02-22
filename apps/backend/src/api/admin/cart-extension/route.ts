import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  tenant_id: z.string().min(1),
  cart_id: z.string().min(1),
  gift_wrap: z.boolean().optional(),
  gift_message: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("cartExtensionModuleService") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await moduleService.listCartExtensions({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin cart-extension")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("cartExtensionModuleService") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await moduleService.createCartExtensions(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin cart-extension")}
}

