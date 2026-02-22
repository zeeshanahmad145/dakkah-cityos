import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createServiceRequestSchema = z.object({
  tenant_id: z.string().min(1),
  citizen_id: z.string().min(1),
  request_type: z.enum([
    "maintenance",
    "complaint",
    "inquiry",
    "permit",
    "license",
    "inspection",
    "emergency",
  ]),
  category: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["submitted", "acknowledged", "in_progress", "resolved", "closed", "rejected"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigned_to: z.string().optional(),
  department: z.string().optional(),
  resolution: z.string().optional(),
  photos: z.array(z.string()).optional(),
  reference_number: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("government") as any
    const {
      limit = "20",
      offset = "0",
      tenant_id,
      status,
      type,
      department,
      service_type,
      search,
    } = req.query as Record<string, string | undefined>

    const filters: Record<string, any> = {}
    if (tenant_id) filters.tenant_id = tenant_id
    if (status) filters.status = status
    if (type) filters.type = type
    if (department) filters.department = department
    if (service_type) filters.service_type = service_type
    if (search) filters.search = search

    const items = await mod.listServiceRequests(filters, { skip: Number(offset), take: Number(limit) })
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error: any) {
    handleApiError(res, error, "STORE-GOVERNMENT")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const parsed = createServiceRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const mod = req.scope.resolve("government") as any
    const item = await mod.createServiceRequests(parsed.data)
    res.status(201).json({ item })
  } catch (error: any) {
    return handleApiError(res, error, "STORE-GOVERNMENT")}
}
