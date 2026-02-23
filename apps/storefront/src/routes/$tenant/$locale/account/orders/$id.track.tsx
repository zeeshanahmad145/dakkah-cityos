import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { AccountLayout } from "@/components/account"
import { TrackingTimeline } from "@/components/delivery/tracking-timeline"
import { TrackingMap } from "@/components/delivery/tracking-map"
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

export const Route = createFileRoute("/$tenant/$locale/account/orders/$id/track")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/orders/${params.id}?fields=*fulfillments,*fulfillments.labels,*fulfillments.items`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.order || data }
    } catch { return { item: null } }
  },
  head: () => ({
    meta: [
      { title: "Track Order" },
      { name: "description", content: "Track your order and shipment status" },
    ],
  }),
  component: TrackOrderPage,
})

function TrackOrderPage() {
  const { tenant, locale, id } = Route.useParams()
  const backendUrl = getBackendUrl()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order-tracking", id],
    queryFn: async () => {
      const response = await fetchWithTimeout(
        `${backendUrl}/store/orders/${id}?fields=*fulfillments,*fulfillments.labels,*fulfillments.items`,
        { credentials: "include" }
      )
      if (!response.ok) throw new Error("Failed to fetch order")
      const data = await response.json()
      return data.order
    },
  })

  const getTrackingData = () => {
    if (!order?.fulfillments?.length) return null

    const fulfillment = order.fulfillments[0]
    const label = fulfillment.labels?.[0]

    const events: Array<{
      id: string
      status: string
      description: string
      timestamp: string
      location?: string
    }> = []

    if (fulfillment.created_at) {
      events.push({
        id: "created",
        status: "preparing",
        description: "Fulfillment created",
        timestamp: fulfillment.created_at,
        location: "Warehouse",
      })
    }

    if (fulfillment.shipped_at) {
      events.push({
        id: "shipped",
        status: "picked-up",
        description: "Shipment picked up by carrier",
        timestamp: fulfillment.shipped_at,
        location: "Warehouse",
      })
    }

    if (fulfillment.shipped_at && !fulfillment.delivered_at) {
      events.push({
        id: "in-transit",
        status: "in-transit",
        description: "Package is on its way",
        timestamp: fulfillment.shipped_at,
      })
    }

    if (fulfillment.delivered_at) {
      events.push({
        id: "in-transit",
        status: "in-transit",
        description: "Package is on its way",
        timestamp: fulfillment.shipped_at || fulfillment.delivered_at,
      })
      events.push({
        id: "delivered",
        status: "delivered",
        description: "Package delivered",
        timestamp: fulfillment.delivered_at,
        location: "Delivery Address",
      })
    }

    let currentStatus = "preparing"
    if (fulfillment.delivered_at) currentStatus = "delivered"
    else if (fulfillment.shipped_at) currentStatus = "in-transit"

    return {
      carrier: label?.tracking_carrier || undefined,
      trackingNumber: label?.tracking_number || undefined,
      estimatedDelivery: fulfillment.metadata?.estimated_delivery || undefined,
      events,
      currentStatus,
      destinationLocation: { lat: 0, lng: 0 },
      pickupLocation: { lat: 0, lng: 0 },
    }
  }

  const trackingData = getTrackingData()
  const mapStatus = (trackingData?.currentStatus || "preparing") as
    "preparing" | "picked-up" | "in-transit" | "nearby" | "delivered"

  return (
    <AccountLayout>
      <div className="max-w-2xl">
        <Link
          to={`/${tenant}/${locale}/account/orders/${id}` as any}
          className="inline-flex items-center gap-2 text-sm text-ds-muted-foreground hover:text-ds-foreground mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t(locale, "delivery.back_to_order")}
        </Link>

        <h1 className="text-2xl font-bold text-ds-foreground mb-6">
          {t(locale, "delivery.track_order")}
        </h1>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-[300px] bg-ds-muted rounded-xl animate-pulse" />
            <div className="h-64 bg-ds-muted rounded-xl animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-ds-destructive/10 border border-ds-destructive/20 rounded-lg p-4 text-ds-destructive">
            Failed to load tracking information. Please try again later.
          </div>
        )}

        {!isLoading && !error && !trackingData && (
          <div className="bg-ds-muted border border-ds-border rounded-lg p-8 text-center">
            <svg
              className="w-12 h-12 text-ds-muted-foreground mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <p className="text-ds-muted-foreground mb-2">
              {t(locale, "delivery.no_tracking")}
            </p>
            <p className="text-sm text-ds-muted-foreground">
              {t(locale, "delivery.tracking_available_after_ship")}
            </p>
          </div>
        )}

        {trackingData && (
          <div className="space-y-6">
            {trackingData.carrier && trackingData.trackingNumber && (
              <div className="bg-ds-background rounded-xl border border-ds-border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                      {t(locale, "delivery.carrier")}
                    </p>
                    <p className="text-sm font-medium text-ds-foreground mt-1">
                      {trackingData.carrier}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                      {t(locale, "delivery.tracking_number")}
                    </p>
                    <p className="text-sm font-medium text-ds-foreground mt-1 font-mono">
                      {trackingData.trackingNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <TrackingMap
              orderId={id}
              destinationLocation={trackingData.destinationLocation}
              pickupLocation={trackingData.pickupLocation}
              estimatedArrival={trackingData.estimatedDelivery}
              status={mapStatus}
              locale={locale}
              height="280px"
            />

            <TrackingTimeline
              events={trackingData.events}
              currentStatus={trackingData.currentStatus}
              estimatedDelivery={trackingData.estimatedDelivery}
              locale={locale}
            />
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
