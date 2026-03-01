// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface VendorEvent {
  id: string
  title: string
  description?: string
  event_type: string
  starts_at: string
  ends_at: string
  timezone?: string
  is_online?: boolean
  online_url?: string
  max_capacity?: number
  tickets_sold?: number
  organizer_name?: string
  image_url?: string
  tags?: string[]
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/events")({
  component: VendorEventsRoute,
})

function VendorEventsRoute() {
  const auth = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("")

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-events", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/events${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: VendorEvent[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    published: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    live: "bg-ds-primary/15 text-ds-primary",
    completed: "bg-ds-info/15 text-ds-info",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Events</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Event
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "draft", "published", "live", "completed", "cancelled"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                statusFilter === s
                  ? "bg-ds-primary text-white border-ds-primary"
                  : "bg-ds-card hover:bg-ds-muted/50"
              }`}
            >
              {s || "All"}
            </button>
          ),
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No events yet</p>
          <p className="text-sm">
            Create your first event to start selling tickets.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[event.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {event.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {event.event_type}
                    </span>
                    {event.is_online && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-ds-info/10 text-ds-info">
                        Online
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground mt-2">
                    <span>
                      {new Date(event.starts_at!).toLocaleDateString()} —{" "}
                      {new Date(event.ends_at!).toLocaleDateString()}
                    </span>
                    {event.max_capacity && (
                      <span>
                        {event.tickets_sold || 0} / {event.max_capacity} tickets
                        sold
                      </span>
                    )}
                    {event.timezone && <span>{event.timezone}</span>}
                  </div>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {event.tags.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-ds-muted text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
