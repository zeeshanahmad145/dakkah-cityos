import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../lib/api-error-handler"

const createBookingSchema = z.object({
  customer_id: z.string().optional(),
  provider_id: z.string().optional(),
  service_product_id: z.string().optional(),
  order_id: z.string().optional(),
  status: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  timezone: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
  
    const { limit = 20, offset = 0, status, provider_id, from, to } = req.query as {
      limit?: number
      offset?: number
      status?: string
      provider_id?: string
      from?: string
      to?: string
    }
  
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (provider_id) filters.provider_id = provider_id
    if (from) filters.starts_at = { $gte: from }
    if (to) filters.ends_at = { $lte: to }
  
    const { data: bookings, metadata } = await query.graph({
      entity: "booking",
      fields: [
        "id",
        "customer_id",
        "provider_id",
        "service_product_id",
        "order_id",
        "status",
        "starts_at",
        "ends_at",
        "timezone",
        "customer_name",
        "customer_email",
        "customer_phone",
        "notes",
        "internal_notes",
        "cancelled_at",
        "cancellation_reason",
        "confirmed_at",
        "completed_at",
        "created_at",
        "provider.name",
        "service_product.product_id",
      ],
      filters,
      pagination: { skip: Number(offset), take: Number(limit) },
    })
  
    res.json({
      bookings,
      count: metadata?.count || bookings.length,
      offset: Number(offset),
      limit: Number(limit),
    })

  } catch (error: any) {
    handleApiError(res, error, "GET admin bookings")}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingModuleService = req.scope.resolve("bookingModuleService") as any
  
    const parsed = createBookingSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    const booking = await bookingModuleService.createBookings(parsed.data)
  
    res.status(201).json({ booking })

  } catch (error: any) {
    handleApiError(res, error, "POST admin bookings")}
}

