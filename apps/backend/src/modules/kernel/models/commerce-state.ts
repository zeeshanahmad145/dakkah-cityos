import { model } from "@medusajs/framework/utils";

/**
 * CommerceState — Unified lifecycle state machine record.
 *
 * Every commerce entity (order, booking, subscription, rental, auction, RMA,
 * contract, fulfillment leg) shares a canonical state vocabulary.
 * This allows cross-vertical state querying, SLA monitoring, and saga rollback
 * to operate on a single state surface.
 *
 * Canonical state progression:
 *   CREATED → AUTHORIZED → ALLOCATED → EXECUTED → VERIFIED → SETTLED → RECONCILED
 *
 * Terminal states:
 *   DISPUTED → (REVERSED | SETTLED)
 *   EXPIRED  (no further transitions allowed)
 *   REVERSED (saga rollback completed)
 *   CANCELLED
 *
 * Each row is an immutable transition record.
 * Current state = the most recent row for an entity_id.
 */
const CommerceState = model.define("commerce_state", {
  id: model.id().primaryKey(),

  // Entity this transition belongs to
  entity_type: model.text(), // "order" | "booking" | "subscription" | "auction" | "rma" | "contract"
  entity_id: model.text(),

  // Transition
  current_state: model.enum([
    "CREATED",
    "AUTHORIZED",
    "ALLOCATED",
    "EXECUTED",
    "VERIFIED",
    "SETTLED",
    "RECONCILED",
    "DISPUTED",
    "REVERSED",
    "CANCELLED",
    "EXPIRED",
  ]),
  previous_state: model.text().nullable(),

  // Who triggered the transition
  actor_type: model.text().nullable(), // "customer" | "vendor" | "admin" | "system" | "saga"
  actor_id: model.text().nullable(),

  // Why
  reason: model.text().nullable(),
  metadata: model.json().nullable(),

  transitioned_at: model.dateTime(),
  tenant_id: model.text().nullable(),
});

export { CommerceState };

// Valid state transitions (used by KernelModuleService.transition())
export const STATE_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["AUTHORIZED", "CANCELLED", "EXPIRED"],
  AUTHORIZED: ["ALLOCATED", "CANCELLED", "REVERSED"],
  ALLOCATED: ["EXECUTED", "REVERSED", "CANCELLED"],
  EXECUTED: ["VERIFIED", "DISPUTED", "REVERSED"],
  VERIFIED: ["SETTLED", "DISPUTED"],
  SETTLED: ["RECONCILED", "DISPUTED"],
  RECONCILED: ["DISPUTED"],
  DISPUTED: ["REVERSED", "SETTLED"],
  REVERSED: [],
  CANCELLED: [],
  EXPIRED: [],
};
