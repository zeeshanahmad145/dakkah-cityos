import { model } from "@medusajs/framework/utils";

/**
 * PolicyRule — composable commerce policy stored as a DSL.
 *
 * Rules are evaluated in priority order by the policy engine.
 * Each rule has:
 *   - A condition (JSON DSL) specifying when it applies
 *   - An action specifying what to do when the condition is met
 *
 * rule_type values:
 *   identity     — requires credential verification
 *   pricing      — modifies pricing
 *   access       — grants or blocks offer access
 *   fraud        — triggers fraud review
 *   compliance   — regulatory/legal enforcement
 *   approval     — requires admin/manager approval gate
 *
 * Condition DSL example:
 *   {"field":"customer.credentials","op":"not_contains","value":"kyc_verified"}
 *   {"field":"offer.offer_type","op":"equals","value":"service"}
 *   {"field":"context.ip_country","op":"in","value":["SA","AE","QA"]}
 *   {"and":[{"field":"offer.base_price","op":"gt","value":5000},{"field":"actor.type","op":"equals","value":"customer"}]}
 *
 * action values:
 *   allow | block | flag | require_approval | modify_price | add_levy | require_credential
 */
const PolicyRule = model.define("policy_rule", {
  id: model.id().primaryKey(),
  rule_name: model.text(),
  rule_type: model.enum([
    "identity",
    "pricing",
    "access",
    "fraud",
    "compliance",
    "approval",
  ]),

  // Lower priority number = evaluated first
  priority: model.number().default(50),

  // JSON DSL condition tree
  condition_dsl: model.json(),

  // What to do when condition is met
  action: model.enum([
    "allow",
    "block",
    "flag",
    "require_approval",
    "modify_price",
    "add_levy",
    "require_credential",
  ]),
  // Payload for action — e.g. {discount_pct: 10} or {credential_required: "kyc_verified"} or {levy_pct: 5, levy_label: "municipality_fee"}
  action_payload: model.json().nullable(),

  // Scope: which offer/actor types this rule applies to (null = all)
  applies_to_offer_types: model.json().nullable(), // ["service", "good"] | null
  applies_to_actor_types: model.json().nullable(), // ["customer", "company"] | null
  applies_to_jurisdictions: model.json().nullable(), // ["SA-RYD", "AE-DXB"] | null

  // Human-readable explanation for audit trail
  explanation: model.text().nullable(),

  is_active: model.boolean().default(true),
  tenant_id: model.text().nullable(),
  effective_from: model.dateTime().nullable(),
  effective_to: model.dateTime().nullable(),
});

export { PolicyRule };
