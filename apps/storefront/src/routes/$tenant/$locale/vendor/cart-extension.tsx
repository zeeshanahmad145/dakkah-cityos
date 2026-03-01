// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface CartExtensionRule {
  id: string
  name: string
  type: string
  trigger_condition: string
  value: string
  min_cart_value?: number
  free_shipping_threshold?: number
  priority: number
  status: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/cart-extension")({
  component: VendorCartExtensionRoute,
})

function VendorCartExtensionRoute() {
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
    queryKey: ["vendor-cart-extension", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/cart-extension${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: CartExtensionRule[]; count: number }>(
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
    draft: "bg-ds-warning/15 text-ds-warning",
    scheduled: "bg-ds-info/15 text-ds-info",
  }

  const typeColors: Record<string, string> = {
    upsell: "bg-ds-primary/10 text-ds-primary",
    cross_sell: "bg-ds-primary/10 text-ds-primary",
    cart_minimum: "bg-ds-warning/10 text-ds-warning",
    free_shipping: "bg-ds-success/10 text-ds-success",
    bundle_discount: "bg-ds-info/10 text-ds-info",
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
        <h1 className="text-2xl font-bold">Cart Extensions</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Rule
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "active", "inactive", "draft", "scheduled"].map((s) => (
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
          <p className="text-lg mb-2">No cart extension rules yet</p>
          <p className="text-sm">
            Create upsell, cross-sell, and cart rules to boost conversions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((rule) => (
            <div
              key={rule.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[rule.type] || "bg-ds-muted/50 text-ds-foreground/80"}`}
                    >
                      {rule.type?.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[rule.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {rule.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-ds-muted-foreground mt-2">
                    <span>
                      <span className="font-medium text-ds-foreground/80">
                        Trigger:
                      </span>{" "}
                      {rule.trigger_condition}
                    </span>
                    <span>
                      <span className="font-medium text-ds-foreground/80">
                        Value:
                      </span>{" "}
                      {rule.value}
                    </span>
                    <span>
                      <span className="font-medium text-ds-foreground/80">
                        Priority:
                      </span>{" "}
                      {rule.priority}
                    </span>
                    {rule.free_shipping_threshold && (
                      <span>
                        <span className="font-medium text-ds-foreground/80">
                          Free Shipping Above:
                        </span>{" "}
                        ${(rule.free_shipping_threshold / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button className="text-sm text-ds-primary hover:underline ms-4">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
