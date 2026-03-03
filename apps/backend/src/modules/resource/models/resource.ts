import { model } from "@medusajs/framework/utils";

/**
 * Resource — Universal resource model.
 * Any offer's underlying capacity, availability, or entitlement is modeled here.
 *
 * Examples:
 *   booking slot     → capacity_model: "time_slot", availability_engine: "booking"
 *   parking bay      → capacity_model: "fixed", availability_engine: "inventory"
 *   gym membership   → capacity_model: "pool", availability_engine: "subscription"
 *   API quota        → capacity_model: "metered", availability_engine: "metering"
 *   real estate unit → capacity_model: "fixed", availability_engine: "booking"
 *
 * Offers bind to Resources. The resource model is the canonical capacity surface.
 */
const Resource = model.define("resource", {
  id: model.id().primaryKey(),
  resource_type: model.text(), // seat | room | slot | unit | quota | license | bay | channel

  // How capacity is measured
  capacity_model: model.enum([
    "fixed",
    "time_slot",
    "pool",
    "metered",
    "unlimited",
  ]),

  // Who "owns" this resource
  ownership_model: model.enum(["owned", "leased", "licensed", "pooled"]),

  // Can it be moved or transferred?
  transferability: model.enum([
    "transferable",
    "non_transferable",
    "restricted",
  ]),

  // Which engine manages availability checks for this resource
  availability_engine: model.enum([
    "booking",
    "inventory",
    "subscription",
    "metering",
    "manual",
  ]),

  // Current capacity values
  total_capacity: model.number().nullable(),
  available_capacity: model.number().nullable(),

  // Back-reference to originating vertical module record
  source_module: model.text(),
  source_id: model.text(),

  // Expiry (for timed resources like day passes, permits)
  expiry_at: model.dateTime().nullable(),
  is_active: model.boolean().default(true),

  tenant_id: model.text().nullable(),
  vendor_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { Resource };
