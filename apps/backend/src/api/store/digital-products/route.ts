import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createDigitalAssetSchema = z.object({
  tenant_id: z.string().min(1),
  product_id: z.string().min(1),
  title: z.string().min(1),
  file_url: z.string().min(1),
  file_type: z.enum(["pdf", "video", "audio", "image", "archive", "ebook", "software", "other"]),
  file_size_bytes: z.number().optional(),
  preview_url: z.string().optional(),
  version: z.string().optional(),
  max_downloads: z.number().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("digitalProduct") as any
    const { limit = "20", offset = "0", tenant_id, file_type } = req.query as Record<string, string | undefined>
    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (file_type) filters.file_type = file_type
    filters.is_active = true
    const items = await mod.listDigitalAssets(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })
  } catch (error: any) {
    handleApiError(res, error, "STORE-DIGITAL-PRODUCTS")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createDigitalAssetSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("digitalProduct") as any
    const item = await mod.createDigitalAssets(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-DIGITAL-PRODUCTS")}
}
