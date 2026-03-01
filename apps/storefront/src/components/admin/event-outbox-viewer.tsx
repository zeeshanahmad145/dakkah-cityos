import { useState } from "react"
import { useEventOutbox } from "@/lib/hooks/use-tenant-admin"
import { Input } from "@/components/ui/input"
import type { EventOutboxEntry, EventOutboxFilters } from "@/lib/types/tenant-admin"

export function EventOutboxViewer() {
  const [filters, setFilters] = useState<EventOutboxFilters>({})
  const { data, isLoading } = useEventOutbox(filters)

  const events = data?.events || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded p-3 animate-pulse">
            <div className="h-3 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Event Outbox ({data?.count || 0})</h2>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Event type..."
          value={filters.event_type || ""}
          onChange={(e) => setFilters({ ...filters, event_type: e.target.value || undefined })}
          className="w-48"
        />
        <select
          value={filters.status || ""}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
          <option value="dead_letter">Dead Letter</option>
        </select>
      </div>

      <div className="border rounded-lg divide-y">
        {events.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No events found</div>
        ) : (
          events.map((event: EventOutboxEntry) => (
            <div key={event.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{event.event_type}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{event.entity_type}</span>
                  <EventStatusBadge status={event.status} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.created_at!).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="font-mono text-xs">Entity: {event.entity_id}</span>
                <span className="font-mono text-xs">Correlation: {event.correlation_id}</span>
                {event.retry_count > 0 && (
                  <span className="text-xs text-ds-warning">Retries: {event.retry_count}</span>
                )}
              </div>
              {event.error_message && (
                <p className="text-xs text-ds-destructive mt-1">{event.error_message}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function EventStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ds-warning text-ds-warning",
    published: "bg-ds-success text-ds-success",
    failed: "bg-ds-destructive text-ds-destructive",
    dead_letter: "bg-ds-muted text-ds-foreground",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[status] || "bg-ds-muted"}`}>
      {status.replace("_", " ")}
    </span>
  )
}
