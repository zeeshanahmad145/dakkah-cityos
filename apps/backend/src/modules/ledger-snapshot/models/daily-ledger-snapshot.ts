import { model } from "@medusajs/framework/utils";

/**
 * DailyLedgerSnapshot — daily financial reconciliation record per tenant/vendor.
 * Created by the ledger-snapshot cron job.
 * Compares Medusa-computed settlement totals against ERPNext postings.
 *
 * If |drift_amount| > drift_threshold → payouts are frozen and ops alerted.
 */
const DailyLedgerSnapshot = model.define("daily_ledger_snapshot", {
  id: model.id().primaryKey(),
  snapshot_date: model.dateTime(),
  tenant_id: model.text().nullable(),
  vendor_id: model.text().nullable(),

  // Medusa-computed totals for the day
  medusa_gross: model.bigNumber().default(0),
  medusa_tax: model.bigNumber().default(0),
  medusa_commission: model.bigNumber().default(0),
  medusa_net_payout: model.bigNumber().default(0),
  medusa_refunds: model.bigNumber().default(0),

  // ERPNext fetched totals for the same period
  erp_gross: model.bigNumber().default(0),
  erp_tax: model.bigNumber().default(0),
  erp_net_payout: model.bigNumber().default(0),

  // Drift = |medusa_net_payout - erp_net_payout|
  drift_amount: model.bigNumber().default(0),
  drift_percentage: model.number().default(0),

  // above_threshold: true if drift > configured tolerance (e.g. 0.5%)
  above_threshold: model.boolean().default(false),
  payout_frozen: model.boolean().default(false),

  // source: "auto" (cron) | "manual" (triggered by admin)
  source: model.text().default("auto"),
  notes: model.text().nullable(),
});

export { DailyLedgerSnapshot };
