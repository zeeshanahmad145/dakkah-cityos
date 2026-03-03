import { model } from "@medusajs/framework/utils";

/**
 * FulfillmentLeg — one delivery segment of a multi-vendor or multi-location order.
 *
 * Example: grocery order split across 3 warehouses = 3 legs.
 * Each leg is a separate Fleetbase dispatch with independent tracking.
 */
const FulfillmentLeg = model.define("fulfillment_leg", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  // leg_index: 0-based position (leg 0 = first delivery)
  leg_index: model.number().default(0),
  // provider: fleetbase | self | third_party
  provider: model.text().default("fleetbase"),
  // Fleetbase order UUID
  provider_order_id: model.text().nullable(),
  // Items in this leg (variant_id + quantity)
  items: model.json(),
  // fulfillment_type: delivery | pickup | handover | inspection
  fulfillment_type: model.text().default("delivery"),
  // status: pending | dispatched | in_transit | delivered | failed | cancelled
  status: model.text().default("pending"),
  // Physical tracking
  tracking_number: model.text().nullable(),
  tracking_url: model.text().nullable(),
  // Proof of delivery
  proof_type: model.text().nullable(), // photo | signature | qr_scan
  proof_url: model.text().nullable(),
  // Escrow: should escrow be released after this leg completes?
  releases_escrow_percent: model.number().default(0),
  // Timestamps
  dispatched_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
  failed_at: model.dateTime().nullable(),
  // Vendor/warehouse context
  vendor_id: model.text().nullable(),
  warehouse_id: model.text().nullable(),
  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { FulfillmentLeg };
