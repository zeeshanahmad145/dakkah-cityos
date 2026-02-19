import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  event_type: z.enum(["concert", "conference", "workshop", "sports", "festival", "webinar", "meetup", "other"]).optional(),
  venue_id: z.string().nullable().optional(),
  address: z.any().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  timezone: z.string().optional(),
  is_online: z.boolean().optional(),
  online_url: z.string().nullable().optional(),
  max_capacity: z.number().nullable().optional(),
  organizer_name: z.string().nullable().optional(),
  organizer_email: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  tags: z.any().nullable().optional(),
  status: z.enum(["draft", "published", "live", "completed", "cancelled"]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { id } = req.params
    const [item] = await moduleService.listEvents({ id }, { take: 1 })
    if (!item) return res.status(404).json({ message: "Not found" })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "GET admin event-ticketing id")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { id } = req.params
    const validation = updateSchema.safeParse(req.body)
    if (!validation.success) return res.status(400).json({ message: "Validation failed", errors: validation.error.issues })
    const item = await moduleService.updateEvents({ id, ...validation.data })
    return res.json({ item })

  } catch (error: any) {
    handleApiError(res, error, "POST admin event-ticketing id")}
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const moduleService = req.scope.resolve("eventTicketing") as any
    const { id } = req.params
    await moduleService.deleteEvents([id])
    return res.status(204).send()

  } catch (error: any) {
    handleApiError(res, error, "DELETE admin event-ticketing id")}
}

