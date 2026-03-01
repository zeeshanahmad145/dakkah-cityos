import { model } from "@medusajs/framework/utils";

/**
 * ServiceProduct stores booking-domain metadata only.
 * Catalog fields (title, description, images, price, status) are owned by Medusa Product.
 * The product ↔ service_product join is managed by src/links/product-booking-service.ts
 */
export const ServiceProduct = model
  .define("service_product", {
    id: model.id().primaryKey(),
    // REMOVED: product_id — now managed by defineLink join table
    tenant_id: model.text().nullable(),

    // Service classification
    service_type: model
      .enum([
        "appointment",
        "class",
        "rental",
        "consultation",
        "event",
        "custom",
      ])
      .default("appointment"),

    // Duration & buffer
    duration_minutes: model.number().default(60),
    buffer_before_minutes: model.number().default(0),
    buffer_after_minutes: model.number().default(0),

    // Capacity
    max_capacity: model.number().default(1),
    min_capacity: model.number().default(1),

    // Booking rules
    min_advance_booking_hours: model.number().default(24),
    max_advance_booking_days: model.number().default(60),
    cancellation_policy_hours: model.number().default(24),

    // Location
    location_type: model
      .enum(["in_person", "virtual", "customer_location", "flexible"])
      .default("in_person"),
    location_address: model.json().nullable(),
    virtual_meeting_url: model.text().nullable(),
    virtual_meeting_provider: model
      .enum(["zoom", "google_meet", "teams", "custom"])
      .nullable(),

    // Pricing mode (pricing amounts now in Medusa PriceSet)
    pricing_type: model
      .enum(["fixed", "per_person", "per_hour", "custom"])
      .default("fixed"),

    // Resources & availability
    required_resources: model.json().nullable(),
    assigned_providers: model.json().nullable(),
    inherits_provider_availability: model.boolean().default(true),
    custom_availability_id: model.text().nullable(),

    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["tenant_id"] },
    { on: ["service_type"] },
    { on: ["is_active"] },
  ]);
