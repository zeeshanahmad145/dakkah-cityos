import { model } from "@medusajs/framework/utils";

/**
 * RevenueSplitRule — Multi-tier revenue distribution topology.
 *
 * Defines how revenue flows through the node hierarchy:
 *   City Platform → Tenant → Vendor → Sub-vendor
 *
 * On settlement, the revenue-topology service walks from root to leaf,
 * applying rules in priority order, and emits one ledger_entry per tier.
 *
 * split_type:
 *   percentage  — take N% of the gross/net
 *   fixed       — take a fixed SAR amount
 *   residual    — take whatever is left after all other rules
 *   levy        — regulatory levy (injected before net calculation)
 *
 * value_base:
 *   gross       — % of total transaction value before fees
 *   net         — % of value after upstream splits
 *   settlement  — % of vendor net settlement amount
 */
const RevenueSplitRule = model.define("revenue_split_rule", {
  id: model.id().primaryKey(),

  // Node in the revenue hierarchy
  node_id: model.text(), // "city_platform" | tenant_id | vendor_id | sub_vendor_id
  parent_node_id: model.text().nullable(),

  // What type of split
  split_type: model.enum(["percentage", "fixed", "residual", "levy"]),
  split_value: model.number(), // percentage (0-100) or fixed SAR amount
  value_base: model.text().default("gross"), // gross | net | settlement

  // What kind of value
  value_type: model.text().default("money"), // money | loyalty | commission | levy

  // Which offers this applies to (null = all)
  applies_to_offer_types: model.json().nullable(),

  // Account to credit in the ledger when this rule fires
  ledger_account_type: model.text(), // "commission" | "levy" | "vendor" | "platform"
  ledger_account_id: model.text(), // node_id or special: "government"

  // Description shown in settlement breakdown
  label: model.text().nullable(),

  // Ordering
  priority: model.number().default(10),
  is_active: model.boolean().default(true),

  // Topology versioning — enables safe migration and effective-date enforcement
  version: model.number().default(1), // auto-increment per node_id topology change
  supersedes_id: model.text().nullable(), // FK to previous version for audit chain

  // Effective date enforcement
  effective_from: model.dateTime().nullable(), // when this version takes effect
  effective_until: model.dateTime().nullable(), // null = currently active; replaces effective_to

  // Retroactive adjustment rules — how to handle past transactions on topology change
  // { strategy: "none"|"adjust_pending"|"adjust_all", lookback_days: number, notify: boolean }
  retroactive_adjustment_rule: model.json().nullable(),

  tenant_id: model.text().nullable(),
});

export { RevenueSplitRule };
