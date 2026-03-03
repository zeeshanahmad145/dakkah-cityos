import { model } from "@medusajs/framework/utils";

/**
 * FreezeRecord — Formal ledger freeze with propagation semantics.
 *
 * A freeze locks value movement for a defined scope (contract, vendor, customer, account).
 * Propagation rules define what else gets frozen when a scope is frozen:
 *   - customer freeze → payouts blocked + benefits paused
 *   - vendor freeze → escrow blocked + subscription benefits paused
 *   - contract freeze → all party accounts frozen for that contract
 *
 * Release conditions define what must happen to unfreeze:
 *   - manual: admin explicitly releases
 *   - dispute_resolved: linked dispute transitions to SETTLED/REVERSED
 *   - time_based: auto-releases at release_at (dispute window expiry)
 *   - condition_group: all items in condition_group must be satisfied
 *
 * Propagation spec (propagates_to[]):
 *   { target_type: "payouts"|"benefits"|"subscriptions"|"escrow", action: "block"|"pause"|"hold" }
 */
const FreezeRecord = model.define("freeze_record", {
  id: model.id().primaryKey(),

  // What is frozen
  scope_type: model.enum([
    "contract",
    "vendor",
    "customer",
    "account",
    "settlement_line",
  ]),
  scope_id: model.text(), // the ID of the frozen entity

  // Why
  freeze_reason: model.enum([
    "dispute",
    "chargeback",
    "compliance",
    "fraud",
    "admin_override",
    "insufficient_evidence",
  ]),
  freeze_description: model.text().nullable(),
  frozen_by_type: model.text().nullable(), // "admin" | "system" | "payment_provider"
  frozen_by_id: model.text().nullable(),

  // Propagation — what else gets frozen
  propagates_to: model.json().nullable(),
  // Array of: { target_type: "payouts"|"benefits"|"subscriptions"|"escrow"|"fulfillment", action: "block"|"pause"|"hold" }

  // Thresholds and drift rules (auto-freeze from reconciliation drift)
  auto_freeze_triggered: model.boolean().default(false),
  drift_amount: model.bigNumber().nullable(), // SAR drift that triggered this freeze
  drift_threshold_config_id: model.text().nullable(),

  // Release conditions
  release_condition: model.enum([
    "manual",
    "dispute_resolved",
    "time_based",
    "condition_group",
  ]),
  release_at: model.dateTime().nullable(), // for time_based
  condition_reference_id: model.text().nullable(), // e.g. dispute_id for "dispute_resolved"
  condition_group: model.json().nullable(), // array of {type, id, required_state} for "condition_group"

  // Status
  is_active: model.boolean().default(true),
  released_at: model.dateTime().nullable(),
  released_by_type: model.text().nullable(),
  released_by_id: model.text().nullable(),
  release_notes: model.text().nullable(),

  // Propagation status
  propagation_status: model
    .enum(["pending", "applied", "failed", "partially_applied"])
    .default("pending"),
  propagation_errors: model.json().nullable(),

  frozen_at: model.dateTime(),
  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { FreezeRecord };
