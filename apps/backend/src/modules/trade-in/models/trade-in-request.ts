import { model } from "@medusajs/framework/utils"

export const TradeInRequest = model.define("trade_in_request", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  condition: model.enum(["excellent", "good", "fair", "poor"]),
  description: model.text(),
  photos: model.json().default({}),
  status: model.enum(["submitted", "evaluated", "approved", "rejected", "completed"]).default("submitted"),
  trade_in_number: model.text(),
  estimated_value: model.bigNumber().nullable(),
  final_value: model.bigNumber().nullable(),
  credit_amount: model.bigNumber().nullable(),
  evaluation_notes: model.text().nullable(),
  rejection_reason: model.text().nullable(),
  submitted_at: model.dateTime().nullable(),
  evaluated_at: model.dateTime().nullable(),
  approved_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})
