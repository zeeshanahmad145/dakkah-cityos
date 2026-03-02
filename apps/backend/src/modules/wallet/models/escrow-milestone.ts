import { model } from "@medusajs/framework/utils";

/**
 * EscrowMilestone — a deliverable milestone tied to a WalletHold.
 * Funds are released per-milestone as evidence is submitted and approved.
 */
const EscrowMilestone = model.define("escrow_milestone", {
  id: model.id().primaryKey(),
  hold_id: model.text(),
  order_id: model.text().nullable(),
  title: model.text(),
  description: model.text().nullable(),
  amount: model.number(),
  currency_code: model.text().default("SAR"),
  due_at: model.dateTime().nullable(),
  // evidence_required: customer must upload proof of delivery
  evidence_required: model.boolean().default(false),
  evidence_url: model.text().nullable(),
  status: model.text().default("pending"), // pending|submitted|approved|released|disputed|expired
  submitted_at: model.dateTime().nullable(),
  released_at: model.dateTime().nullable(),
  released_to: model.text().nullable(), // vendor_id or wallet_id
  dispute_id: model.text().nullable(),
});

export { EscrowMilestone };
