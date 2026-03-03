import { model } from "@medusajs/framework/utils";

/**
 * ReconciliationConfig — Truth hierarchy + auto-freeze drift rules.
 *
 * Defines which system is the authoritative "truth" when systems disagree,
 * drift thresholds that trigger automatic ledger freezes, and reconciliation
 * behavior for each account type.
 *
 * Truth source order (when systems disagree, earlier = wins):
 *   1. payment_provider  — Stripe/HyperPay/STC Pay raw transaction amount
 *   2. ledger            — internal LedgerEntry (double-entry)
 *   3. erp               — ERPNext settled amount
 *   4. settlement        — SettlementLedger computed amount
 *
 * Drift example: PSP shows SAR 5000 received, but ledger shows SAR 4960.
 * Drift = SAR 40. If above threshold → auto-freeze the vendor account.
 *
 * Per-account thresholds allow:
 *   - Low-value accounts: SAR 50 drift → notify only
 *   - High-value vendor accounts: SAR 10 drift → auto-freeze
 *   - Government levy accounts: SAR 0 drift tolerance
 */
const ReconciliationConfig = model.define("reconciliation_config", {
  id: model.id().primaryKey(),

  // Identifier for this config (can be tenant-specific or global "default")
  config_key: model.text(), // "default" | tenant_id | account_type

  // Truth source ordering (index 0 = highest authority)
  truth_source_order: model.json(), // string[] e.g. ["payment_provider", "ledger", "erp", "settlement"]

  // Per-account-type drift thresholds (SAR)
  // { account_type: string, threshold_sar: number, action: "notify"|"auto_freeze"|"auto_reconcile" }
  drift_thresholds: model.json(),

  // Auto-freeze settings
  auto_freeze_enabled: model.boolean().default(true),
  auto_freeze_grace_period_minutes: model.number().default(30), // time before freeze activates

  // Notification thresholds (below auto_freeze threshold, above this → notify)
  notification_threshold_sar: model.number().default(10),

  // Auto-reconcile: for small drifts (< threshold) use the truth source to correct
  auto_reconcile_enabled: model.boolean().default(false),
  auto_reconcile_max_amount_sar: model.number().default(1), // only auto-correct < this amount

  // Governance
  is_active: model.boolean().default(true),
  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { ReconciliationConfig };
