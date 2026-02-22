import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { handleApiError } from "../../../../lib/api-error-handler"

// In a real implementation, this would be stored in the database
// For now, we'll use a simple in-memory store or metadata on a system entity

const DEFAULT_CONFIG = {
  reminder_enabled: true,
  reminder_hours_before: 24,
  cancellation_window_hours: 24,
  cancellation_fee_percent: 0,
  allow_reschedule: true,
  reschedule_window_hours: 24,
  buffer_minutes_before: 0,
  buffer_minutes_after: 15,
  no_show_fee_percent: 100,
  mark_no_show_after_minutes: 15,
  allow_same_day_booking: true,
  min_advance_booking_hours: 2,
  max_advance_booking_days: 60,
  allow_self_checkin: false,
  checkin_window_minutes: 30,
}

// Simple in-memory storage (would be database in production)
let bookingConfig = { ...DEFAULT_CONFIG }

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // In production, fetch from database or store settings
    res.json({ config: bookingConfig })

  } catch (error: any) {
    handleApiError(res, error, "GET admin settings bookings")}
}

const updateBookingConfigSchema = z.object({
  config: z.object({
    reminder_enabled: z.boolean().optional(),
    reminder_hours_before: z.number().optional(),
    cancellation_window_hours: z.number().optional(),
    cancellation_fee_percent: z.number().optional(),
    allow_reschedule: z.boolean().optional(),
    reschedule_window_hours: z.number().optional(),
    buffer_minutes_before: z.number().optional(),
    buffer_minutes_after: z.number().optional(),
    no_show_fee_percent: z.number().optional(),
    mark_no_show_after_minutes: z.number().optional(),
    allow_same_day_booking: z.boolean().optional(),
    min_advance_booking_hours: z.number().optional(),
    max_advance_booking_days: z.number().optional(),
    allow_self_checkin: z.boolean().optional(),
    checkin_window_minutes: z.number().optional(),
  }).passthrough(),
}).passthrough()

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = updateBookingConfigSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.issues })
    }

    const { config } = parsed.data
  
    // Validate and merge with defaults
    bookingConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    }
  
    // In production, save to database
  
    res.json({ config: bookingConfig, message: "Configuration saved" })

  } catch (error: any) {
    handleApiError(res, error, "PUT admin settings bookings")}
}

