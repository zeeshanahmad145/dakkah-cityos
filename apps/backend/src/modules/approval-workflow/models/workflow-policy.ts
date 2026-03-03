import { model } from "@medusajs/framework/utils";

/**
 * WorkflowPolicy — Governance model for canonical Temporal workflows.
 *
 * Defines who can launch a workflow, whether overrides require approval,
 * and what happens on upgrade (version rollout strategy).
 *
 * workflow_name refers to the canonical workflow templates:
 *   "one_time_goods" | "booking_service" | "subscription_billing" |
 *   "usage_metering" | "milestone_escrow" | "auction_settlement" |
 *   "on_demand_dispatch" | "trade_in_valuation"
 *
 * permitted_launchers: who can initiate this workflow type
 *   "system"    — event-driven (triggered by module events)
 *   "admin"     — admin panel manual launch
 *   "vendor"    — vendor-initiated (freelance, trade-in)
 *   "customer"  — customer-initiated (usually forbidden for financial workflows)
 *
 * override_requires_approval: if true, any non-standard launch or parameter
 *   override goes through ApprovalWorkflow before Temporal execution begins.
 */
const WorkflowPolicy = model.define("workflow_policy", {
  id: model.id().primaryKey(),

  // Canonical workflow this policy governs
  workflow_name: model.text(), // "one_time_goods" | "booking_service" | etc.

  // Versioning
  version: model.number().default(1),
  is_active_version: model.boolean().default(true),
  supersedes_id: model.text().nullable(), // FK to previous version

  // Who can launch
  permitted_launchers: model.json(), // string[] e.g. ["system", "admin"]

  // Override governance
  override_requires_approval: model.boolean().default(false),
  override_approval_chain: model.json().nullable(), // [{role: "finance_admin", quorum: 1}]

  // Audit
  audit_all_transitions: model.boolean().default(true),
  audit_retention_days: model.number().default(365),

  // Rollback
  rollback_strategy: model
    .enum(["immediate", "graceful", "manual"])
    .default("graceful"),
  // immediate = kill and rollback all running instances
  // graceful  = complete running instances on old version, new instances use new version
  // manual    = admin must approve per-instance migration

  // SLA enforcement
  default_timeout_minutes: model.number().nullable(),
  escalation_after_minutes: model.number().nullable(),
  escalation_target: model.text().nullable(), // "admin" | "finance_admin" | "regulator"

  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { WorkflowPolicy };
