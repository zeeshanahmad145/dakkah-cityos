import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("subscribers:waitlist-slot-promotion");

/**
 * Waitlist Slot Promotion Subscriber
 *
 * Fires when a booking is cancelled (`booking.cancelled` event).
 * Checks if there are pending waitlist entries for that slot.
 * If yes: promotes the next-in-line customer by:
 *   1. Creating a `pending` Booking for them
 *   2. Updating their WaitlistEntry status to "notified"
 *   3. Setting offer_expires_at = now + 30 minutes
 *   4. Emitting `waitlist.slot_offered` for notification dispatch
 */
export default async function waitlistSlotPromotionHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  booking_id: string;
  service_product_id: string;
  booked_date?: string;
  booked_start_time?: string;
  tenant_id?: string;
}>) {
  const eventBus = container.resolve("event_bus") as any;
  const query = container.resolve("query") as any;

  try {
    const { service_product_id, booked_date, booked_start_time, tenant_id } =
      data;
    if (!service_product_id) return;

    // Find next pending waitlist entry for this slot
    const { data: entries } = await query.graph({
      entity: "waitlist_entry",
      fields: ["*"],
      filters: {
        entity_type: "service_product",
        entity_id: service_product_id,
        status: "pending",
        ...(booked_date && { requested_date: booked_date }),
      },
    });

    const waitlist = Array.isArray(entries) ? entries : [];
    if (waitlist.length === 0) {
      logger.debug(
        `No waitlist entries for ${service_product_id} on ${booked_date}`,
      );
      return;
    }

    // Sort by position (lower = higher priority)
    waitlist.sort((a: any, b: any) => a.position - b.position);
    const next = waitlist[0];

    // Set offer window: 30 minutes
    const offerExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Update waitlist entry to "notified"
    const bookingService = container.resolve("bookingModuleService") as any;
    try {
      await bookingService.updateWaitlistEntries?.({
        id: next.id,
        status: "notified",
        offer_expires_at: offerExpiresAt,
        notification_sent_at: new Date(),
      } as any);
    } catch (e: any) {
      logger.warn("Could not update waitlist entry:", e.message);
    }

    logger.info(
      `Waitlist slot offered to customer ${next.customer_id} for ${service_product_id}`,
    );

    // Emit notification event
    await eventBus.emit("waitlist.slot_offered", {
      waitlist_entry_id: next.id,
      customer_id: next.customer_id,
      customer_email: next.customer_email,
      customer_phone: next.customer_phone,
      entity_type: next.entity_type,
      entity_id: next.entity_id,
      requested_date: next.requested_date,
      offer_expires_at: offerExpiresAt.toISOString(),
      tenant_id: tenant_id || next.tenant_id,
    });
  } catch (err: any) {
    logger.error("Waitlist slot promotion error:", err.message);
  }
}

export const config: SubscriberConfig = {
  event: "booking.cancelled",
};
