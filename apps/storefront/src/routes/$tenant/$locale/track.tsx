import { createFileRoute } from "@tanstack/react-router"
import { OrderTrackingMap } from "@/components/delivery/order-tracking-map"
import { TrackingTimeline } from "@/components/delivery/tracking-timeline"
import { DeliveryETA } from "@/components/delivery/delivery-eta"
import { DriverInfoCard } from "@/components/delivery/driver-info-card"
import { t } from "@/lib/i18n"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/track")({
  component: TrackPage,
  head: () => ({
    meta: [
      { title: "Track Order | Dakkah CityOS" },
      { name: "description", content: "Track your order on Dakkah CityOS" },
    ],
  }),
})

function TrackPage() {
  const { locale, tenant } = Route.useParams()
  const [orderId, setOrderId] = useState("")
  const [showTracking, setShowTracking] = useState(false)

  const demoEvents = [
    {
      id: "e1",
      status: "preparing",
      description: t(
        locale,
        "track.description1_order_confirmed_and",
        "Order confirmed and being prepared",
      ),
      timestamp: "2026-02-11T09:00:00Z",
      location: "Warehouse",
    },
    {
      id: "e2",
      status: "picked-up",
      description: t(
        locale,
        "track.description2_package_picked_up_by",
        "Package picked up by courier",
      ),
      timestamp: "2026-02-11T11:30:00Z",
      location: "Distribution Center",
    },
    {
      id: "e3",
      status: "in-transit",
      description: t(
        locale,
        "track.description3_package_is_on_its_wa",
        "Package is on its way",
      ),
      timestamp: "2026-02-11T14:00:00Z",
      location: "In Transit",
    },
    {
      id: "e4",
      status: "nearby",
      description: t(
        locale,
        "track.description4_driver_is_nearby_you",
        "Driver is nearby your location",
      ),
      timestamp: "2026-02-11T16:30:00Z",
    },
    {
      id: "e5",
      status: "delivered",
      description: t(
        locale,
        "track.description5_package_delivered",
        "Package delivered",
      ),
      timestamp: "2026-02-11T17:00:00Z",
    },
  ]

  const handleTrack = () => {
    if (orderId.trim()) setShowTracking(true)
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-ds-foreground mb-2">
          {t(locale, "tracking.page_title")}
        </h1>
        <p className="text-ds-muted-foreground mb-8">
          {t(locale, "tracking.page_desc")}
        </p>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t(locale, "tracking.enter_order_id")}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-ds-background text-ds-foreground border border-ds-border focus:outline-none focus:ring-2 focus:ring-ds-primary"
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          />
          <button
            onClick={handleTrack}
            disabled={!orderId.trim()}
            className="px-6 py-2.5 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t(locale, "tracking.track")}
          </button>
        </div>

        {showTracking && (
          <div className="space-y-6">
            <DeliveryETA
              estimatedTime="5:00 PM"
              status="on-time"
              updatedAt="2 min ago"
              locale={locale}
            />

            <OrderTrackingMap
              orderId={orderId || "DEMO-001"}
              driverLocation={{ lat: 25.25, lng: 55.35 }}
              destinationLocation={{ lat: 25.2, lng: 55.3 }}
              pickupLocation={{ lat: 25.3, lng: 55.4 }}
              estimatedArrival="5:00 PM"
              status="in-transit"
              locale={locale}
            />

            <DriverInfoCard
              name="Ahmed K."
              rating={4.8}
              vehicleType="Toyota Hilux"
              vehiclePlate="DXB 1234"
              onCall={() => {}}
              onMessage={() => {}}
              locale={locale}
            />

            <TrackingTimeline
              events={demoEvents}
              currentStatus="in-transit"
              estimatedDelivery="Feb 11, 2026 - 5:00 PM"
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  )
}
