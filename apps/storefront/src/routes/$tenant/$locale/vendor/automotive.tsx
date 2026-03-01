// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  mileage: number
  price: number
  currency_code: string
  condition: string
  status: string
  color?: string
  fuel_type?: string
  transmission?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/automotive")({
  component: VendorAutomotiveRoute,
})

function VendorAutomotiveRoute() {
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
    queryKey: ["vendor-automotive", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/automotive${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Vehicle[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    available: "bg-ds-success/15 text-ds-success",
    sold: "bg-ds-primary/15 text-ds-primary",
    reserved: "bg-ds-warning/15 text-ds-warning",
    draft: "bg-ds-muted text-ds-foreground",
    pending: "bg-ds-info/15 text-ds-info",
  }

  const conditionColors: Record<string, string> = {
    new: "bg-ds-success/15 text-ds-success",
    used: "bg-ds-warning/15 text-ds-warning",
    certified: "bg-ds-info/15 text-ds-info",
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
        <h1 className="text-2xl font-bold">Vehicle Listings</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + List Vehicle
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "available", "reserved", "sold", "draft", "pending"].map((s) => (
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
          <p className="text-lg mb-2">No vehicles listed yet</p>
          <p className="text-sm">List your first vehicle to start selling.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((vehicle) => (
            <div
              key={vehicle.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[vehicle.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {vehicle.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${conditionColors[vehicle.condition] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {vehicle.condition}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {vehicle.currency_code?.toUpperCase()}{" "}
                        {(vehicle.price / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">Price</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">
                        {vehicle.mileage.toLocaleString()}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">
                        Mileage
                      </p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold">{vehicle.year}</p>
                      <p className="text-xs text-ds-muted-foreground">Year</p>
                    </div>
                    <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                      <p className="text-sm font-mono font-bold truncate">
                        {vehicle.vin}
                      </p>
                      <p className="text-xs text-ds-muted-foreground">VIN</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ds-muted-foreground">
                    {vehicle.color && <span>Color: {vehicle.color}</span>}
                    {vehicle.fuel_type && (
                      <span>Fuel: {vehicle.fuel_type}</span>
                    )}
                    {vehicle.transmission && (
                      <span>{vehicle.transmission}</span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
