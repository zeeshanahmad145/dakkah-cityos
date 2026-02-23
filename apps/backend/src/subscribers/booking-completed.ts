// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function bookingCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const bookingService = container.resolve("booking")
  
  try {
    const booking = await bookingService.retrieveBooking(data.id)
    const customerEmail = booking?.customer?.email || booking?.metadata?.email
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "booking-completed",
        data: {
          booking_id: booking.id,
          service_name: booking.service?.title || "Service",
          customer_name: booking.customer?.first_name || "Customer",
          review_url: `${appConfig.urls.storefront}/account/bookings/${booking.id}/review`,
          rebook_url: `${appConfig.urls.storefront}/services/${booking.service?.handle || ""}`,
        }
      })
    }
    
    logger.info("Booking completed notification sent", { bookingId: data.id })
  } catch (error) {
    logger.error("Booking completed handler error", error, { bookingId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "booking.completed",
}
