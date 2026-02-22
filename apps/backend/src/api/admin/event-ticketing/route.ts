import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  event_type: z.enum(["concert", "conference", "workshop", "sports", "festival", "webinar", "meetup", "other"]),
  venue_id: z.string().nullable().optional(),
  address: z.any().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  timezone: z.string().optional(),
  is_online: z.boolean().optional(),
  online_url: z.string().nullable().optional(),
  max_capacity: z.number().nullable().optional(),
  organizer_name: z.string().nullable().optional(),
  organizer_email: z.string().nullable().optional(),
  tenant_id: z.string().min(1),
  vendor_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  tags: z.any().nullable().optional(),
  status: z.enum(["draft", "published", "live", "completed", "cancelled"]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { limit = "20", offset = "0" } = req.query as Record<string, string | undefined>
    const items = await moduleService.listEvents({}, { skip: Number(offset), take: Number(limit) })
    return res.json({ items, count: Array.isArray(items) ? items.length : 0, limit: Number(limit), offset: Number(offset) })

  } catch (error: any) {
    handleApiError(res, error, "GET admin event-ticketing")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const validation = createSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await moduleService.createEvents(validation.data)
    return res.status(201).json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin event-ticketing")}
}

