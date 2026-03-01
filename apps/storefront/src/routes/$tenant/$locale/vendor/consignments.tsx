// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useState, useMemo } from "react"

interface ConsignmentItem {
  id: string
  item_name: string
  consignor: string
  price: number
  currency_code: string
  commission_percent: number
  sold_status: string
  sold_date?: string
  created_at: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/consignments")({
  component: VendorConsignmentsRoute,
})

function VendorConsignmentsRoute() {
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
    queryKey: ["vendor-consignments", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const url = `/vendor/consignments${params.toString() ? `?${params}` : ""}`
      return sdk.client.fetch<{ items: ConsignmentItem[]; count: number }>(
        url,
        {
          credentials: "include",
        },
      )
    },
  })

  const items = data?.items || []

  const statusColors: Record<string, string> = {
    available: "bg-ds-success/15 text-ds-success",
    sold: "bg-ds-info/15 text-ds-info",
    pending: "bg-ds-warning/15 text-ds-warning",
    returned: "bg-ds-destructive/15 text-ds-destructive",
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
        <h1 className="text-2xl font-bold">Consignment Items</h1>
        <button className="px-4 py-2 bg-ds-primary text-white rounded-lg hover:bg-ds-primary/90 transition">
          + Add Item
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "available", "sold", "pending", "returned"].map((s) => (
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
          <p className="text-lg mb-2">No consignment items yet</p>
          <p className="text-sm">
            Add items to start managing consignment inventory.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Consignor</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 px-4 font-medium">{item.item_name}</td>
                  <td className="py-4 px-4 text-ds-muted-foreground">
                    {item.consignor}
                  </td>
                  <td className="py-4 px-4">
                    {item.currency_code?.toUpperCase()}{" "}
                    {(item.price / 100).toFixed(2)}
                  </td>
                  <td className="py-4 px-4">{item.commission_percent}%</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[item.sold_status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {item.sold_status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-sm text-ds-primary hover:underline">
                      View Sales
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
