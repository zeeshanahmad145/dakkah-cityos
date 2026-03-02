import { model } from "@medusajs/framework/utils";

/**
 * WaitlistEntry — Queues customers for a fully-booked slot.
 *
 * When `Booking` reaches max capacity, new customers are placed here.
 * When a cancellation occurs, the subscriber `waitlist-slot-promotion.ts`
 * picks the next PENDING entry and creates a Booking automatically.
 */
const WaitlistEntry = model
  .define("waitlist_entry", {
    id: model.id().primaryKey(),
    tenant_id: model.text().nullable(),
    // What they are waiting for
    entity_type: model.enum([
      "service_product",
      "event_ticket",
      "healthcare_slot",
      "restaurant_table",
      "fitness_class",
      "parking_spot",
    ]),
    entity_id: model.text(),
    // The specific slot they want (ISO date string)
    requested_date: model.text().nullable(),
    requested_start_time: model.text().nullable(),
    quantity: model.number().default(1),
    // Who is waiting
    customer_id: model.text(),
    customer_email: model.text().nullable(),
    customer_phone: model.text().nullable(),
    // Lifecycle
    status: model
      .enum([
        "pending", // in queue
        "notified", // slot offered, awaiting confirmation
        "confirmed", // customer confirmed, booking created
        "expired", // offer window passed, moved to next
        "cancelled", // customer withdrew
      ])
      .default("pending"),
    position: model.number().default(0), // queue position (lower = earlier)
    offer_expires_at: model.dateTime().nullable(), // deadline to confirm slot offer
    booking_id: model.text().nullable(), // set when converted to booking
    notification_sent_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["entity_type", "entity_id", "status"] },
    { on: ["customer_id"] },
    { on: ["entity_type", "entity_id", "position"] },
    { on: ["offer_expires_at"] },
  ]);

export default WaitlistEntry;
