import { MedusaService } from "@medusajs/framework/utils";
import EventOutbox from "./models/event-outbox";

class EventModuleService extends MedusaService({
  EventOutbox,
}) {
  async publishEvent(data: {
    tenantId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, any>;
    actorId?: string;
    actorRole?: string;
    nodeId?: string;
    channel?: string;
    correlationId?: string;
    causationId?: string;
  }) {
    return await this.createEventOutboxes({
      tenant_id: data.tenantId,
      event_type: data.eventType,
      aggregate_type: data.aggregateType,
      aggregate_id: data.aggregateId,
      payload: data.payload,
      actor_id: data.actorId || null,
      actor_role: data.actorRole || null,
      node_id: data.nodeId || null,
      channel: data.channel || null,
      correlation_id: data.correlationId || null,
      causation_id: data.causationId || null,
      status: "pending",
      retry_count: 0,
    } as any);
  }

  async listPendingEvents(tenantId?: string, limit?: number) {
    const filters: Record<string, any> = { status: "pending" };
    if (tenantId) {
      filters.tenant_id = tenantId;
    }

    const events = await this.listEventOutboxes(filters, {
      take: limit || 100,
    }) as any;

    return Array.isArray(events) ? events : [events].filter(Boolean);
  }

  async markPublished(eventId: string) {
    return await this.updateEventOutboxes({
      id: eventId,
      status: "published",
      published_at: new Date(),
    } as any);
  }

  async markFailed(eventId: string, error: string) {
    const event = await this.retrieveEventOutbox(eventId) as any;
    const retryCount = (event?.retry_count || 0) + 1;

    return await this.updateEventOutboxes({
      id: eventId,
      status: "failed",
      error,
      retry_count: retryCount,
    } as any);
  }

  buildEnvelope(event: any) {
    return {
      headers: {
        id: event.id,
        type: event.event_type,
        source: event.source || "commerce",
        tenant_id: event.tenant_id,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        correlation_id: event.correlation_id,
        causation_id: event.causation_id,
        timestamp: event.created_at || new Date().toISOString(),
        actor: {
          id: event.actor_id,
          role: event.actor_role,
        },
        node_id: event.node_id,
        channel: event.channel,
      },
      payload: event.payload,
      metadata: event.metadata,
    };
  }

  async retryFailedEvents(tenantId?: string, maxRetries: number = 3) {
    const filters: Record<string, any> = { status: "failed" };
    if (tenantId) {
      filters.tenant_id = tenantId;
    }

    const failedEvents = await this.listEventOutboxes(filters) as any;
    const list = Array.isArray(failedEvents)
      ? failedEvents
      : [failedEvents].filter(Boolean);

    const retried: any[] = [];
    const skipped: any[] = [];

    for (const event of list) {
      if ((event.retry_count || 0) >= maxRetries) {
        skipped.push({ id: event.id, retry_count: event.retry_count });
        continue;
      }

      const updated = await this.updateEventOutboxes({
        id: event.id,
        status: "pending",
        error: null,
      } as any);
      retried.push(updated);
    }

    return {
      retried: retried.length,
      skipped: skipped.length,
      retriedEvents: retried,
      skippedEvents: skipped,
    };
  }

  async purgeOldEvents(olderThanDays: number) {
    if (olderThanDays < 1) {
      throw new Error("olderThanDays must be at least 1");
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const publishedEvents = await this.listEventOutboxes({
      status: "published",
    }) as any;
    const list = Array.isArray(publishedEvents)
      ? publishedEvents
      : [publishedEvents].filter(Boolean);

    const toDelete = list.filter((e: any) => {
      const publishedAt = e.published_at
        ? new Date(e.published_at)
        : new Date(e.created_at);
      return publishedAt < cutoffDate;
    });

    for (const event of toDelete) {
      await this.deleteEventOutboxes(event.id);
    }

    return { purged: toDelete.length, cutoffDate };
  }

  async getEventStats(tenantId: string) {
    const allEvents = await this.listEventOutboxes({
      tenant_id: tenantId,
    }) as any;
    const list = Array.isArray(allEvents)
      ? allEvents
      : [allEvents].filter(Boolean);

    const byStatus: Record<string, number> = {
      pending: 0,
      published: 0,
      failed: 0,
    };
    const byEventType: Record<string, number> = {};

    for (const event of list) {
      const status = event.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;

      const eventType = event.event_type || "unknown";
      byEventType[eventType] = (byEventType[eventType] || 0) + 1;
    }

    return { tenantId, total: list.length, byStatus, byEventType };
  }

  async batchPublish(eventIds: string[]) {
    if (!eventIds || eventIds.length === 0) {
      throw new Error("No event IDs provided");
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const eventId of eventIds) {
      try {
        const updated = await this.updateEventOutboxes({
          id: eventId,
          status: "published",
          published_at: new Date(),
        } as any);
        results.push(updated);
      } catch (error: unknown) {
        errors.push({ eventId, error: (error instanceof Error ? error.message : String(error)) });
      }
    }

    return {
      published: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}

export default EventModuleService;
