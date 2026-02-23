// @ts-nocheck
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { subscriberLogger } from "../lib/logger"
import { appConfig } from "../lib/config"

const logger = subscriberLogger

export default async function bookingCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const bookingService = container.resolve("booking")

  try {
    const booking = await bookingService.retrieveBooking(data.id)
    
    if (!booking) {
      logger.warn("Booking not found", { bookingId: data.id })
      return
    }

    const customerEmail = booking.customer?.email || booking.metadata?.email

    if (customerEmail && appConfig.features.enableEmailNotifications) {
      await notificationService.createNotifications({
        to: customerEmail,
        channel: "email",
        template: "booking-confirmation",
        data: {
          booking_id: booking.id,
          service_name: booking.service?.title || "Service",
          start_time: booking.start_time,
          end_time: booking.end_time,
          location: booking.service?.location || "TBD",
          customer_name: booking.customer?.first_name || "Customer",
          manage_url: `${appConfig.urls.storefront}/account/bookings/${booking.id}`,
        },
      })
    }

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "New Booking",
          description: `New booking for ${booking.service?.title || "service"} on ${new Date(booking.start_time).toLocaleDateString()}`,
        },
      })
    }

    logger.info("Booking created notification sent", { 
      bookingId: data.id, 
      email: customerEmail 
    })
  } catch (error) {
    logger.error("Booking created handler error", error, { bookingId: data.id })
  }
}

export const config: SubscriberConfig = {
  event: "booking.created",
}
