import { model } from "@medusajs/framework/utils";

/**
 * Offer — Universal commerce abstraction.
 * Every commerce entity (product, booking, subscription, service, license,
 * digital good, government permit, utility, etc.) is registered here as an Offer.
 *
 * This allows Layer 0 to route, price, simulate, and govern any commerce entity
 * through a unified interface, regardless of which vertical module implements it.
 *
 * offer_type:
 *   good       — physical or digital product (standard e-commerce)
 *   service    — time-bound service (booking, cleaning, legal, healthcare)
 *   right      — transferable permission (ticket, permit, license, pass)
 *   access     — subscription-based access (gym, SaaS, workspace, fleet)
 *   license    — non-transferable IP or usage right (software, content)
 *   usage      — pay-per-use resource (parking, metered utility, API calls)
 *
 * monetization_model:
 *   one_time   — single payment (order)
 *   recurring  — periodic billing (subscription)
 *   usage      — metered consumption (metering module)
 *   milestone  — phased payments on completion (freelance, construction)
 *   escrow     — held until condition met (auction, real estate, B2B)
 *   auction    — competitive price discovery (auction module)
 *
 * execution_engine:
 *   booking         — scheduling engine
 *   fulfillment     — physical delivery (Fleetbase)
 *   entitlement     — access gate
 *   dispatch        — multi-leg delivery
 *   metering        — usage tracking
 *   digital         — instant delivery + download
 *   manual          — human-in-loop
 */
const Offer = model.define("offer", {
  id: model.id().primaryKey(),

  // Classification
  offer_type: model.enum([
    "good",
    "service",
    "right",
    "access",
    "license",
    "usage",
  ]),
  monetization_model: model.enum([
    "one_time",
    "recurring",
    "usage",
    "milestone",
    "escrow",
    "auction",
  ]),
  execution_engine: model.enum([
    "booking",
    "fulfillment",
    "entitlement",
    "dispatch",
    "metering",
    "digital",
    "manual",
  ]),
  settlement_model: model.text().nullable(), // "immediate" | "t+1" | "escrow_release" | "milestone"
  lifecycle_model: model.text().nullable(), // "standard" | "subscription" | "rental" | "auction"

  // Back-reference to originating vertical module
  source_module: model.text(), // "booking" | "subscription" | "auction" | "digitalProduct" | ...
  source_entity_id: model.text(), // the ID of the record in that module

  // Commerce context
  title: model.text().nullable(),
  currency_code: model.text().default("SAR"),
  base_price: model.bigNumber().default(0),

  // Governance
  requires_identity_verification: model.boolean().default(false),
  requires_approval: model.boolean().default(false),
  is_active: model.boolean().default(true),

  // Multi-tenancy
  tenant_id: model.text().nullable(),
  vendor_id: model.text().nullable(),

  metadata: model.json().nullable(),
});

export { Offer };
