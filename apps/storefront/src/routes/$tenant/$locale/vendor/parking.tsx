// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface ParkingFacility {
  id: string
  name: string
  location: string
  address?: string
  total_spots: number
  available_spots: number
  hourly_rate: number
  daily_rate?: number
  currency_code: string
  status: string
  type?: string
  operating_hours?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/parking")({
  component: VendorParkingRoute,
})

function VendorParkingRoute() {
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
    queryKey: ["vendor-parking", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/parking${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: ParkingFacility[]; count: number }>(
        url,
        {
          credentials: "include",
        },
      )
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    inactive: "bg-ds-muted text-ds-foreground",
    maintenance: "bg-ds-warning/15 text-ds-warning",
    full: "bg-ds-destructive/15 text-ds-destructive",
  }

  function getOccupancyPercent(total: number, available: number) {
    if (total <= 0) return 0
    return Math.round(((total - available) / total) * 100)
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
        <h1 className="text-2xl font-bold">Parking Facilities</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Facility
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "inactive", "maintenance", "full"].map((s) => (
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
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No parking facilities yet</p>
          <p className="text-sm">
            Add your first facility to start managing parking.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((facility) => {
            const occupancy = getOccupancyPercent(
              facility.total_spots,
              facility.available_spots,
            )
            return (
              <div
                key={facility.id}
                className="border rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{facility.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[facility.status] || "bg-ds-muted text-ds-foreground"}`}
                      >
                        {facility.status}
                      </span>
                      {facility.type && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                          {facility.type}
                        </span>
                      )}
                    </div>
                    <p className="text-ds-muted-foreground text-sm mb-3">
                      {facility.location}
                      {facility.address ? ` — ${facility.address}` : ""}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {facility.total_spots}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Total Spots
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {facility.available_spots}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Available
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{occupancy}%</p>
                        <p className="text-xs text-ds-muted-foreground">
                          Occupancy
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {facility.currency_code?.toUpperCase()}{" "}
                          {(facility.hourly_rate / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Hourly Rate
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                      {facility.daily_rate && (
                        <span>
                          Daily: {facility.currency_code?.toUpperCase()}{" "}
                          {(facility.daily_rate / 100).toFixed(2)}
                        </span>
                      )}
                      {facility.operating_hours && (
                        <span>Hours: {facility.operating_hours}</span>
                      )}
                    </div>
                  </div>
                  <button className="text-sm text-ds-primary hover:underline ms-4">
                    View Occupancy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
