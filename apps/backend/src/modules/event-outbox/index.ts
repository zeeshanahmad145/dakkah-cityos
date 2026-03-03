import { MedusaService } from "@medusajs/framework/utils";
import { ProcessedEvent } from "./models/processed-event";

/**
 * EventOutboxModuleService — manages idempotent event processing.
 *
 * Usage in webhook handlers:
 *   const wasAlreadyProcessed = await outboxService.markProcessed(eventId, "chargeback_webhook")
 *   if (wasAlreadyProcessed) return res.json({ received: true, skipped: true })
 */
class EventOutboxModuleService extends MedusaService({ ProcessedEvent }) {
  /**
   * Marks an event as processed if it hasn't been seen before.
   * Returns true if the event was ALREADY processed (caller should skip).
   * Returns false if this is the first time (caller should process).
   */
  async markProcessed(
    eventId: string,
    consumerId: string,
    resultSummary?: string,
  ): Promise<boolean> {
    try {
      const existing = await this.listProcessedEvents({
        event_id: eventId,
        consumer_id: consumerId,
      });
      if ((existing as any[]).length > 0) return true; // Already processed

      await this.createProcessedEvents({
        event_id: eventId,
        event_type: consumerId,
        consumer_id: consumerId,
        result_summary: resultSummary ?? null,
      } as any);
      return false; // First time — proceed
    } catch {
      return false; // On error, allow processing (idempotency best-effort)
    }
  }
}

export const EVENT_OUTBOX_MODULE = "eventOutbox";
export { EventOutboxModuleService };
export { ProcessedEvent };

import { Module } from "@medusajs/framework/utils";
export default Module(EVENT_OUTBOX_MODULE, {
  service: EventOutboxModuleService,
});
