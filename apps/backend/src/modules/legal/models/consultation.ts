import { model } from "@medusajs/framework/utils";

/**
 * LegalConsultation stores appointment-specific metadata only.
 * Fee (per consultation type) is owned by Medusa Product variants + PriceSet
 * via src/links/product-legal-consultation.ts
 * On order.placed the subscriber creates/updates the LegalConsultation record with order_id.
 */
const LegalConsultation = model.define("legal_consultation", {
  id: model.id().primaryKey(),
  tenant_id: model.text(),
  attorney_id: model.text(),
  client_id: model.text(), // Medusa customer ID
  case_id: model.text().nullable(),
  order_id: model.text().nullable(), // Populated by order.placed subscriber
  consultation_type: model.enum([
    "initial",
    "follow_up",
    "strategy",
    "settlement",
    "mediation",
  ]),
  status: model
    .enum(["scheduled", "in_progress", "completed", "cancelled", "no_show"])
    .default("scheduled"),
  scheduled_at: model.dateTime(),
  duration_minutes: model.number().default(60),
  is_virtual: model.boolean().default(false),
  virtual_link: model.text().nullable(),
  // REMOVED: fee, currency_code — now in Medusa Product variants + PriceSet
  notes: model.text().nullable(),
  action_items: model.json().nullable(),
  completed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
});

export default LegalConsultation;
