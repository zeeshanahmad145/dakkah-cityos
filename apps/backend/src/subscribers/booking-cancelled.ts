// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function bookingCancelledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason?: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const bookingService = container.resolve("booking")
  
  try {
    const booking = await bookingService.retrieveBooking(data.id)
    const customerEmail = booking?.customer?.email || booking?.metadata?.email
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "booking-cancelled",
        data: {
          booking_id: booking.id,
          service_name: booking.service?.title || "Service",
          original_time: booking.start_time,
          cancellation_reason: data.reason || "Booking cancelled",
          customer_name: booking.customer?.first_name || "Customer",
          refund_info: "Any applicable refund will be processed within 5-10 business days",
          rebook_url: `${appConfig.urls.storefront}/services`,
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Booking Cancelled",
          description: `Booking ${booking?.id} cancelled: ${data.reason || "No reason provided"}`,
        }
      })
    }
    
    logger.info("Booking cancelled notification sent", { 
      bookingId: data.id, 
      reason: data.reason 
    })
  } catch (error) {
    logger.error("Booking cancelled handler error", error, { bookingId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "booking.cancelled",
}
