// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface ShippingExtensionRate {
  id: string
  name: string
  zone: string
  region: string
  method: string
  rate: number
  currency_code: string
  min_weight?: number
  max_weight?: number
  free_above_threshold?: number
  estimated_days: string
  status: string
  created_at: string
}

export const Route = createFileRoute(
  "/$tenant/$locale/vendor/shipping-extension",
)({
  component: VendorShippingExtensionRoute,
})

function VendorShippingExtensionRoute() {
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
    queryKey: ["vendor-shipping-extension", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/shipping-extension${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{
        items: ShippingExtensionRate[]
        count: number
      }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    inactive: "bg-ds-muted text-ds-foreground",
    draft: "bg-ds-warning/15 text-ds-warning",
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
        <h1 className="text-2xl font-bold">Shipping Configuration</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Rate
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "inactive", "draft"].map((s) => (
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
          <p className="text-lg mb-2">No shipping rates configured</p>
          <p className="text-sm">
            Add custom shipping rates, zones, and rules for your products.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Weight Range</th>
                <th className="py-3 px-4">Free Above</th>
                <th className="py-3 px-4">Est. Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((rate) => (
                <tr
                  key={rate.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 px-4 font-medium">{rate.name}</td>
                  <td className="py-4 px-4 text-ds-muted-foreground">
                    {rate.zone}
                  </td>
                  <td className="py-4 px-4 text-ds-muted-foreground">
                    {rate.region}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-ds-muted text-ds-muted-foreground">
                      {rate.method}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {rate.currency_code?.toUpperCase()}{" "}
                    {(rate.rate / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm text-ds-muted-foreground">
                    {rate.min_weight || rate.max_weight
                      ? `${rate.min_weight || 0}–${rate.max_weight || "∞"} kg`
                      : "—"}
                  </td>
                  <td className="py-4 px-4 text-ds-muted-foreground">
                    {rate.free_above_threshold
                      ? `${rate.currency_code?.toUpperCase()} ${(rate.free_above_threshold / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="py-4 px-4 text-sm text-ds-muted-foreground">
                    {rate.estimated_days || "—"}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[rate.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {rate.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-sm text-ds-primary hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
