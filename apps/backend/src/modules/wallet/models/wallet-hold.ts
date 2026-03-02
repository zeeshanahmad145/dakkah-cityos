import { model } from "@medusajs/framework/utils";

/**
 * WalletHold — Escrow / conditional hold on a wallet balance.
 *
 * When funds are held (e.g. a service deposit, trade-in escrow, or
 * booking guarantee), `hold_amount` is debited from the spendable
 * balance but NOT credited to the payee yet.
 *
 * Release triggers:
 *   - "completed"  → funds released to vendor/payout
 *   - "cancelled"  → funds returned to customer wallet
 *   - "disputed"   → funds locked until dispute resolves
 *   - "partial"    → partial release (milestone-based services)
 *
 * Linked to wallet via wallet_id.
 * Reference (order_id / booking_id / trade_in_id) stored in reference_type + reference_id.
 */
const WalletHold = model
  .define("wallet_hold", {
    id: model.id().primaryKey(),
    wallet_id: model.text(),
    tenant_id: model.text().nullable(),
    hold_amount: model.bigNumber(),
    released_amount: model.bigNumber().default(0),
    currency: model.text(),
    status: model
      .enum([
        "pending", // created, funds deducted
        "completed", // hold released to payee
        "cancelled", // hold returned to customer
        "disputed", // frozen pending dispute outcome
        "partial", // partially released (milestone)
        "expired", // SLA exceeded, auto-released
      ])
      .default("pending"),
    reference_type: model.enum([
      "booking",
      "order",
      "trade_in",
      "service",
      "escrow",
      "milestone",
    ]),
    reference_id: model.text(),
    description: model.text().nullable(),
    release_condition: model.text().nullable(), // human-readable trigger
    auto_release_at: model.dateTime().nullable(), // SLA auto-release timestamp
    released_at: model.dateTime().nullable(),
    released_by: model.text().nullable(), // "system" | admin_id
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["wallet_id"] },
    { on: ["wallet_id", "status"] },
    { on: ["reference_type", "reference_id"] },
    { on: ["auto_release_at"] },
  ]);

export default WalletHold;
