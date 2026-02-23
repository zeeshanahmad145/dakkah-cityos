import { model } from "@medusajs/framework/utils"

export const TradeInOffer = model.define("trade_in_offer", {
  id: model.id().primaryKey(),
  request_id: model.text(),
  offer_amount: model.bigNumber(),
  credit_type: model.enum(["store_credit", "wallet", "refund"]).default("store_credit"),
  expires_at: model.dateTime().nullable(),
  status: model.enum(["pending", "accepted", "rejected", "expired"]).default("pending"),
  rejection_reason: model.text().nullable(),
  accepted_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})
