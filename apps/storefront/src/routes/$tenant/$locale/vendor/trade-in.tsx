// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface TradeInOffer {
  id: string
  item_name: string
  condition: string
  offered_value: number
  currency_code: string
  status: string
  customer_name: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/trade-in")({
  component: VendorTradeInRoute,
})

function VendorTradeInRoute() {
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
    queryKey: ["vendor-trade-in", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/trade-in${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: TradeInOffer[]; count: number }>(url, {
        credentials: "include",
      })
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    pending: "bg-ds-warning/15 text-ds-warning",
    accepted: "bg-ds-success/15 text-ds-success",
    rejected: "bg-ds-destructive/15 text-ds-destructive",
    completed: "bg-ds-info/15 text-ds-info",
    evaluating: "bg-ds-primary/15 text-ds-primary",
  }

  const conditionColors: Record<string, string> = {
    excellent: "text-ds-success",
    good: "text-ds-primary",
    fair: "text-ds-warning",
    poor: "text-ds-destructive",
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
        <h1 className="text-2xl font-bold">Trade-In Program</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Create Offer
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "pending", "evaluating", "accepted", "rejected", "completed"].map(
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
          <p className="text-lg mb-2">No trade-in offers yet</p>
          <p className="text-sm">
            Create trade-in offers to accept used items from customers.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="pb-3 pe-4">Item</th>
                <th className="pb-3 pe-4">Condition</th>
                <th className="pb-3 pe-4 text-right">Offered Value</th>
                <th className="pb-3 pe-4">Customer</th>
                <th className="pb-3 pe-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((offer) => (
                <tr
                  key={offer.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 pe-4 font-medium">{offer.item_name}</td>
                  <td className="py-4 pe-4">
                    <span
                      className={`text-sm font-medium capitalize ${conditionColors[offer.condition] || "text-ds-muted-foreground"}`}
                    >
                      {offer.condition}
                    </span>
                  </td>
                  <td className="py-4 pe-4 text-right">
                    {offer.currency_code?.toUpperCase()}{" "}
                    {(offer.offered_value / 100).toFixed(2)}
                  </td>
                  <td className="py-4 pe-4 text-sm text-ds-muted-foreground">
                    {offer.customer_name}
                  </td>
                  <td className="py-4 pe-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[offer.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {offer.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <button className="text-sm text-ds-primary hover:underline">
                      Evaluate
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
