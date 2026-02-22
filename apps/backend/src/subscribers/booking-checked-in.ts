import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { subscriberLogger } from "../lib/logger";
import { appConfig } from "../lib/config";
import BookingModuleService from "../modules/booking/service";

const logger = subscriberLogger;

export default async function bookingCheckedInHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const bookingService = container.resolve("booking") as any;

  try {
    const booking = await bookingService.retrieveBooking(data.id);

    if (appConfig.features.enableAdminNotifications) {
      await notificationService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: "Customer Checked In",
          description: `Customer checked in for booking ${booking?.id}`,
        },
      });
    }

    logger.info("Booking checked in notification sent", { bookingId: data.id });
  } catch (error) {
    logger.error("Booking checked in handler error", error, {
      bookingId: data.id,
    });
  }
}

export const config: SubscriberConfig = {
  event: "booking.checked_in",
};
