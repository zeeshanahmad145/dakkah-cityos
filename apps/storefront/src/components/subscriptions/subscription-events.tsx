import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { queryKeys } from "@/lib/utils/query-keys"
import type { SubscriptionEvent } from "@/lib/types/subscriptions"

interface SubscriptionEventsProps {
  subscriptionId: string
}

export function SubscriptionEvents({ subscriptionId }: SubscriptionEventsProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.subscriptions.events(subscriptionId),
    queryFn: async () => {
      const response = await sdk.client.fetch<{ events: SubscriptionEvent[] }>(
        `/store/subscriptions/${subscriptionId}/events`,
        { credentials: "include" }
      )
      return response.events || []
    },
    enabled: !!subscriptionId,
  })

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded"></div>)}</div>
      </div>
    )
  }

  const events = data || []

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="font-semibold">Activity Timeline</h3>
      </div>
      {events.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No activity yet</div>
      ) : (
        <div className="p-4 space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="mt-1">
                <EventDot type={event.event_type} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.created_at!).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    created: "bg-ds-info",
    activated: "bg-ds-success",
    paused: "bg-ds-warning",
    resumed: "bg-ds-success",
    cancelled: "bg-ds-destructive",
    renewed: "bg-ds-info",
    plan_changed: "bg-ds-accent",
    payment_failed: "bg-ds-destructive",
    payment_succeeded: "bg-ds-success",
    trial_started: "bg-ds-primary",
    trial_ended: "bg-ds-warning",
  }

  return <div className={`w-3 h-3 rounded-full ${colors[type] || "bg-ds-muted"}`}></div>
}
