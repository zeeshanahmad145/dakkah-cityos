// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface VolumeDeal {
  id: string
  name: string
  description?: string
  product_id: string
  tiers: any[]
  min_order_qty: number
  max_discount_percent: number
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/volume-deals")({
  component: VendorVolumeDealsRoute,
})

function VendorVolumeDealsRoute() {
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
    queryKey: ["vendor-volume-deals", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/volume-deals${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: VolumeDeal[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    active: "bg-ds-success/15 text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
    expired: "bg-ds-destructive/15 text-ds-destructive",
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
        <h1 className="text-2xl font-bold">Volume Deals</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Deal
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "draft", "expired"].map((s) => (
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
          <p className="text-lg mb-2">No volume deals yet</p>
          <p className="text-sm">
            Create your first volume deal to offer bulk pricing discounts to
            buyers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((deal) => {
            const tiers = Array.isArray(deal.tiers) ? deal.tiers : []
            return (
              <div
                key={deal.id}
                className="border rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{deal.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[deal.status] || "bg-ds-muted text-ds-foreground"}`}
                      >
                        {deal.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-ds-info/15 text-ds-info font-medium">
                        Up to {deal.max_discount_percent}% OFF
                      </span>
                    </div>
                    {deal.description && (
                      <p className="text-ds-muted-foreground text-sm mb-3">
                        {deal.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {deal.min_order_qty}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Min Qty
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">
                          {deal.max_discount_percent}%
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Max Discount
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{tiers.length}</p>
                        <p className="text-xs text-ds-muted-foreground">
                          Tiers
                        </p>
                      </div>
                      <div className="bg-ds-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm font-medium">
                          {new Date(deal.created_at!).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-ds-muted-foreground">
                          Created
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="text-sm text-ds-primary hover:underline ms-4">
                    View Details
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
