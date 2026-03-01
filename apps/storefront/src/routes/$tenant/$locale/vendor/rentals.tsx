// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface Rental {
  id: string
  product_id: string
  title?: string
  rental_type: string
  base_price: number
  currency_code: string
  deposit_amount?: number
  late_fee_per_day?: number
  min_duration?: number
  max_duration?: number
  is_available?: boolean
  condition_on_listing?: string
  status?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/rentals")({
  component: VendorRentalsRoute,
})

function VendorRentalsRoute() {
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
    queryKey: ["vendor-rentals", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/rentals${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: Rental[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const conditionColors: Record<string, string> = {
    new: "bg-ds-success/15 text-ds-success",
    like_new: "bg-ds-info/15 text-ds-info",
    good: "bg-ds-warning/15 text-ds-warning",
    fair: "bg-ds-warning/15 text-ds-warning",
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
        <h1 className="text-2xl font-bold">Rental Items</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Rental
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "rented", "maintenance"].map((s) => (
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
          <p className="text-lg mb-2">No rental items yet</p>
          <p className="text-sm">
            Add your first rental item to start earning.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((rental) => (
            <div
              key={rental.id}
              className="border rounded-lg p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm truncate">
                  {rental.title || rental.product_id}
                </h3>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${rental.is_available !== false ? "bg-ds-success" : "bg-ds-destructive"}`}
                />
              </div>
              <div className="space-y-2 text-sm text-ds-muted-foreground">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-medium text-ds-foreground">
                    {rental.rental_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price</span>
                  <span className="font-medium text-ds-foreground">
                    {rental.currency_code?.toUpperCase()}{" "}
                    {(rental.base_price / 100).toFixed(2)}
                  </span>
                </div>
                {rental.deposit_amount != null && (
                  <div className="flex justify-between">
                    <span>Deposit</span>
                    <span>
                      {rental.currency_code?.toUpperCase()}{" "}
                      {(rental.deposit_amount / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {rental.condition_on_listing && (
                  <div className="flex justify-between items-center">
                    <span>Condition</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${conditionColors[rental.condition_on_listing] || "bg-ds-muted"}`}
                    >
                      {rental.condition_on_listing.replace("_", " ")}
                    </span>
                  </div>
                )}
                {rental.min_duration && (
                  <div className="flex justify-between">
                    <span>Min duration</span>
                    <span>
                      {rental.min_duration}{" "}
                      {rental.rental_type === "hourly" ? "hrs" : "days"}
                    </span>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 text-sm text-ds-primary hover:underline text-center">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
