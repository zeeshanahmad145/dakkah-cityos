import { model } from "@medusajs/framework/utils";

/**
 * CommerceContract — Universal multi-party commerce agreement object.
 *
 * Represents any structured commerce event involving multiple parties,
 * multiple offers, shared resources, and explicit obligations.
 *
 * Examples:
 *   - Real estate purchase: parties=[buyer, seller, agent], obligations=[transfer deed, pay price]
 *   - Bundle (travel + hotel + car): parties=[customer, airline, hotel, car co], offers=[flight, room, rental]
 *   - Government permit + recurring service: obligations=[pay annual fee, submit inspection]
 *   - Escrow deal: settlement_rules={type:"escrow", release_on:"delivery_confirmed"}
 *
 * lifecycle_state maps to canonical CommerceState values.
 */
const CommerceContract = model.define("commerce_contract", {
  id: model.id().primaryKey(),

  // contract_type: order | booking | rental | subscription | bundle | permit | escrow | freelance
  contract_type: model.text(),

  // parties: [{actor_type: "customer"|"vendor"|"government"|"platform", actor_id, role: "buyer"|"seller"|"agent"}]
  parties: model.json(),

  // offers: array of offer IDs from the kernel.offer table
  offers: model.json().nullable(),

  // resources: array of resource IDs from the kernel resource model (Phase C)
  resources: model.json().nullable(),

  // obligations: [{party_id, action, description, due_at, status: "pending"|"fulfilled"|"overdue"}]
  obligations: model.json().nullable(),

  // settlement_rules: {type:"flat"|"split"|"milestone"|"escrow", ...details}
  settlement_rules: model.json().nullable(),

  // identity_requirements: array of credential types required for all parties
  identity_requirements: model.json().nullable(),

  // dispute_policy: {auto_escalate_after_hours: 48, arbiter_type: "platform"|"government"}
  dispute_policy: model.json().nullable(),

  // lifecycle_state: current canonical state (CREATED, AUTHORIZED, EXECUTED, etc.)
  lifecycle_state: model.text().default("CREATED"),

  // expires_at: contract becomes void if not EXECUTED by this time
  expires_at: model.dateTime().nullable(),

  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { CommerceContract };
