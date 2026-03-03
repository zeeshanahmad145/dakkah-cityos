import { model } from "@medusajs/framework/utils";

/**
 * ProcessedEvent — idempotency store for webhook consumers.
 * Before processing any incoming webhook, check: does this event_id exist?
 * If yes → skip. If no → process then insert.
 */
const ProcessedEvent = model.define("processed_event", {
  id: model.id().primaryKey(),
  // Unique external event identifier (e.g. Stripe evt_xxx, Fleetbase event UUID)
  event_id: model.text(),
  event_type: model.text(),
  // Which consumer processed it (chargeback_webhook | payout_webhook | etc.)
  consumer_id: model.text(),
  // Result summary for debugging
  result_summary: model.text().nullable(),
});

export { ProcessedEvent };
