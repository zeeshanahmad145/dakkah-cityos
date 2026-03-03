/**
 * PolicySnapshot — Immutable governance snapshot
 *
 * Attached to every CommerceContract at creation time.
 * Records the exact state of WorkflowPolicy, ReconciliationConfig,
 * RevenueSplitRule, and ABAC attributes that were in effect when
 * the contract was signed.
 *
 * This enables:
 *   - Historical re-simulation under T-1 policy
 *   - Audit-proof reproduction of economic state
 *   - Legal defensibility when policies change mid-contract
 *
 * The snapshot is WRITE-ONCE — never updated after creation.
 * Policy mutations create new policy versions, not updates.
 */

import { model } from "@medusajs/framework/utils";

export const PolicySnapshot = model.define("policy_snapshot", {
  id: model.id({ prefix: "psnap" }).primaryKey(),

  // ── Contract binding ──────────────────────────────────────────────────────
  /** FK to CommerceContract.id — one snapshot per contract */
  contract_id: model.text().index(),
  /** Snapshot created when contract state entered ACTIVE */
  captured_at: model.dateTime(),

  // ── Workflow governance ───────────────────────────────────────────────────
  /** Serialized WorkflowPolicy row at capture time */
  workflow_policy_snapshot: model.json().nullable(),
  workflow_policy_version: model.number().default(1),

  // ── Revenue topology ──────────────────────────────────────────────────────
  /** Active RevenueSplitRule at capture time (with node splits) */
  revenue_split_snapshot: model.json().nullable(),
  revenue_split_version: model.number().default(1),

  // ── Reconciliation config ─────────────────────────────────────────────────
  /** ReconciliationConfig truth hierarchy at capture time */
  reconciliation_config_snapshot: model.json().nullable(),

  // ── Tax configuration ──────────────────────────────────────────────────────
  /** Tax rates applicable to this contract at signing */
  tax_config_snapshot: model.json().nullable(),
  /** ZATCA-registered tax ID at signing */
  tax_registration_number: model.text().nullable(),

  // ── ABAC / entitlements at signing ───────────────────────────────────────
  /** Customer's resolved ABAC attributes when contract was created */
  abac_attributes_snapshot: model.json().nullable(),
  /** Verified VC credential IDs that granted access */
  vc_credential_ids: model.array().nullable(),

  // ── Simulation support ────────────────────────────────────────────────────
  /** Schema version — allows future deserialization */
  schema_version: model.text().default("1.0"),
  /** Hash (SHA-256) of canonical snapshot payload for integrity checks */
  integrity_hash: model.text().nullable(),
});

export default PolicySnapshot;
