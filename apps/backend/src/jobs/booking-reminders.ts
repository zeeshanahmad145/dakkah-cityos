// @ts-nocheck
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Scheduled job to send booking reminders
 * Runs every hour to check for bookings happening in the next 24 hours
 */
export default async function bookingRemindersJob(container: MedusaContainer) {
  const bookingService = container.resolve("booking") as unknown as any
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const logger = container.resolve("logger") as unknown as any

  logger.info("[booking-reminders] Starting booking reminders job")

  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Get bookings in the next 24 hours that haven't had reminders sent
    const bookings = await bookingService.listBookings({
      status: "confirmed",
      start_time: {
        $gte: now.toISOString(),
        $lte: tomorrow.toISOString(),
      },
      confirmation_sent_at: null,
    })

    logger.info(`[booking-reminders] Found ${bookings.length} bookings needing reminders`)

    let sentCount = 0
    let notificationsDisabled = false

    for (const booking of bookings) {
      if (!booking.customer_email) {
        logger.warn(`[booking-reminders] No email for booking ${booking.id}`)
        continue
      }

      try {
        let notificationSent = false

        if (!notificationsDisabled) {
          try {
            await notificationService.createNotifications({
              to: booking.customer_email,
              channel: "email",
              template: "booking-reminder",
              data: {
                booking_id: booking.id,
                service_name: "Your appointment",
                provider_id: booking.provider_id,
                start_time: booking.start_time,
                location: booking.location_address,
                customer_name: booking.customer_name,
              },
            })
            notificationSent = true
          } catch (notifError: any) {
            const msg = (notifError.message || "").toLowerCase()
            if (msg.includes("401") || msg.includes("authorization")) {
              logger.warn("[booking-reminders] Email notifications disabled - invalid SendGrid credentials")
              notificationsDisabled = true
            } else {
              logger.error(`[booking-reminders] Notification error for ${booking.id}: ${notifError.message}`)
            }
          }
        }

        await bookingService.updateBookings(
          { id: booking.id },
          { 
            metadata: {
              ...booking.metadata,
              reminder_sent_at: new Date().toISOString(),
              ...(notificationsDisabled ? { reminder_email_skipped: true } : {})
            }
          }
        )

        if (notificationSent) {
          sentCount++
          logger.info(`[booking-reminders] Sent reminder for booking ${booking.id}`)
        }
      } catch (error: unknown) {
        logger.error(`[booking-reminders] Failed to process reminder for ${booking.id}:`, error)
      }
    }

    logger.info(`[booking-reminders] Sent ${sentCount} reminders`)
  } catch (error) {
    logger.error("[booking-reminders] Job failed:", error)
  }
}

export const config = {
  name: "booking-reminders",
  schedule: "0 * * * *", // Every hour
}
