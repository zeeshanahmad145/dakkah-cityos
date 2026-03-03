import { model } from "@medusajs/framework/utils";

/**
 * Obligation — A formal commitment by one party within a CommerceContract.
 *
 * Each obligation specifies who must do what, by when, and what happens on breach.
 * Obligations are fulfilled by attaching EvidenceRecords and calling transition().
 *
 * Examples:
 *   - Vendor must deliver within 3 days (fulfilled by GPS delivery proof)
 *   - Buyer must pay milestone 2 within 7 days of milestone 1 verification
 *   - Government must issue permit within 5 business days of payment
 *   - Customer must return item within 14 days for RMA
 */
const Obligation = model.define("obligation", {
  id: model.id().primaryKey(),

  // Contract this obligation belongs to
  contract_id: model.text(),

  // Who is obligated
  party_role: model.text(), // "vendor" | "buyer" | "platform" | "government" | "agent"
  party_id: model.text().nullable(), // specific party_id, null = role-based lookup

  // What they must do
  action: model.text(), // "deliver" | "pay" | "issue_permit" | "verify" | "return" | "inspect"
  action_description: model.text().nullable(),

  // When
  due_at: model.dateTime().nullable(),
  grace_period_hours: model.number().default(0),

  // Status lifecycle
  status: model
    .enum(["pending", "fulfilled", "breached", "waived", "disputed"])
    .default("pending"),
  fulfilled_at: model.dateTime().nullable(),

  // Evidence link — what proof fulfills this obligation
  required_evidence_types: model.json().nullable(), // string[] e.g. ["gps_proof", "signature"]
  evidence_id: model.text().nullable(), // FK to EvidenceRecord once submitted

  // Breach consequences
  breach_penalty_amount: model.bigNumber().nullable(),
  breach_penalty_currency: model.text().nullable(),
  breach_action: model
    .enum(["auto_reverse", "freeze_escrow", "notify_only", "escalate"])
    .nullable(),
  breached_at: model.dateTime().nullable(),
  breach_processed: model.boolean().default(false),

  // SLA tracking
  sla_hours: model.number().nullable(), // expected completion time
  overdue: model.boolean().default(false),

  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { Obligation };
