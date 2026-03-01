// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function bookingConfirmedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION) as unknown as any
  const bookingService = container.resolve("booking") as unknown as any
  
  try {
    const booking = await bookingService.retrieveBooking(data.id)
    const customerEmail = booking?.customer?.email || booking?.metadata?.email
    
    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "booking-confirmed",
        data: {
          booking_id: booking.id,
          service_name: booking.service?.title || "Service",
          start_time: booking.start_time,
          end_time: booking.end_time,
          location: booking.service?.location || "TBD",
          customer_name: booking.customer?.first_name || "Customer",
          check_in_url: `${appConfig.urls.storefront}/account/bookings/${booking.id}/check-in`,
        }
      })
    }
    
    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Booking Confirmed",
          description: `Booking ${booking?.id} has been confirmed`,
        }
      })
    }
    
    logger.info("Booking confirmed notification sent", { bookingId: data.id })
  } catch (error) {
    logger.error("Booking confirmed handler error", error, { bookingId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "booking.confirmed",
}
