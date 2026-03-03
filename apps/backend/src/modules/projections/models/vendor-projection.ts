import { model } from "@medusajs/framework/utils";

/**
 * VendorProjection — precomputed vendor dashboard summary, refreshed hourly by cron job.
 * Storefront and vendor-dashboard requests read from this table instead of live settlement queries.
 *
 * CQRS pattern: write side = settlement_ledger (transactional)
 *               read side  = vendor_projection (optimized for dashboard queries)
 */
const VendorProjection = model.define("vendor_projection", {
  id: model.id().primaryKey(),
  vendor_id: model.text(),
  // period: "today" | "yesterday" | "mtd" | "ytd" | ISO date string e.g. "2026-03-01"
  period: model.text(),
  total_orders: model.number().default(0),
  gross_revenue: model.bigNumber().default(0),
  net_payout: model.bigNumber().default(0),
  pending_payout: model.bigNumber().default(0),
  refund_total: model.bigNumber().default(0),
  platform_fee_total: model.bigNumber().default(0),
  average_order_value: model.bigNumber().default(0),
  // Top product types by revenue (json: [{type, revenue}])
  top_product_types: model.json().nullable(),
  // Settlement status breakdown (json: {settled, pending, frozen})
  settlement_breakdown: model.json().nullable(),
  // Last time this row was recomputed
  last_refreshed_at: model.dateTime().nullable(),
  tenant_id: model.text().nullable(),
});

export { VendorProjection };
