import { model } from "@medusajs/framework/utils";

/**
 * VendorSlaRecord — Tracks SLA commitments and breach events per vendor order.
 *
 * Created when an order is placed with a vendor.
 * Updated by Fleetbase webhook subscriber when job status changes.
 * Penalty trigger fires when `breach_at` passes without `fulfilled_at`.
 *
 * Enforcement:
 *   - Job `inactive-vendor-check.ts` (already runs) polls for breached records
 *     and emits `vendor.sla.breached` event.
 *   - Subscriber `vendor-sla-penalty.ts` receives that event and:
 *       1. Creates a deduction transaction on vendor payout
 *       2. Emits `payout.hold` if breach severity is HIGH
 *       3. Increments vendor risk score
 */
const VendorSlaRecord = model
  .define("vendor_sla_record", {
    id: model.id().primaryKey(),
    tenant_id: model.text().nullable(),
    vendor_id: model.text(),
    order_id: model.text(),
    // SLA definition
    sla_type: model.enum([
      "fulfillment", // time from order placed to shipped
      "delivery", // time from shipped to delivered
      "response", // time from customer message to vendor reply
      "cancellation_rate", // threshold metric, not time-based
    ]),
    target_minutes: model.number(), // SLA target (e.g. 1440 = 24h)
    breach_at: model.dateTime(), // computed = order_placed_at + target
    // Outcome
    status: model
      .enum([
        "tracking", // within SLA window
        "at_risk", // within 10% of breach_at
        "breached", // passed breach_at without completion
        "met", // fulfilled_at <= breach_at
        "waived", // admin waived penalty
      ])
      .default("tracking"),
    fulfilled_at: model.dateTime().nullable(),
    actual_minutes: model.number().nullable(), // fulfilled_at - start
    breach_severity: model.enum(["low", "medium", "high"]).nullable(),
    // Penalty
    penalty_amount: model.bigNumber().nullable(),
    penalty_applied_at: model.dateTime().nullable(),
    penalty_waived_by: model.text().nullable(),
    penalty_waive_reason: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["vendor_id", "status"] },
    { on: ["order_id"] },
    { on: ["breach_at", "status"] }, // for polling job
    { on: ["vendor_id", "sla_type"] },
  ]);

export default VendorSlaRecord;
