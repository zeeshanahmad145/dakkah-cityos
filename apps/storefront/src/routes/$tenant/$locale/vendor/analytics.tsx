// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useMemo } from "react"

interface AnalyticsData {
  total_revenue: number
  total_orders: number
  avg_order_value: number
  conversion_rate: number
  currency_code: string
  top_products: {
    id: string
    name: string
    units_sold: number
    revenue: number
  }[]
  recent_orders: {
    id: string
    display_id: string
    total: number
    status: string
    created_at: string
  }[]
  order_trends: {
    date: string
    orders: number
    revenue: number
  }[]
}

export const Route = createFileRoute("/$tenant/$locale/vendor/analytics")({
  component: VendorAnalyticsRoute,
})

function VendorAnalyticsRoute() {
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-analytics"],
    queryFn: async () => {
      return sdk.client.fetch<AnalyticsData>("/vendor/analytics", {
        credentials: "include",
      })
    },
  })

  const currency = data?.currency_code?.toUpperCase() || "USD"

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                <div className="h-6 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
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

  const stats = [
    {
      label: "Total Revenue",
      value: `${currency} ${((data?.total_revenue || 0) / 100).toFixed(2)}`,
    },
    { label: "Total Orders", value: data?.total_orders || 0 },
    {
      label: "Avg Order Value",
      value: `${currency} ${((data?.avg_order_value || 0) / 100).toFixed(2)}`,
    },
    {
      label: "Conversion Rate",
      value: `${(data?.conversion_rate || 0).toFixed(1)}%`,
    },
  ]

  const topProducts = data?.top_products || []
  const recentOrders = data?.recent_orders || []
  const orderTrends = data?.order_trends || []

  const statusColors: Record<string, string> = {
    completed: "bg-ds-success/15 text-ds-success",
    pending: "bg-ds-warning/15 text-ds-warning",
    processing: "bg-ds-info/15 text-ds-info",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    refunded: "bg-ds-muted text-ds-foreground",
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="border rounded-lg p-6">
            <p className="text-sm text-ds-muted-foreground mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Trends</h2>
          {orderTrends.length === 0 ? (
            <div className="text-center py-8 text-ds-muted-foreground">
              <p className="text-sm">No trend data available yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orderTrends.map((trend) => (
                <div
                  key={trend.date}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ds-muted-foreground">
                    {new Date(trend.date!).toLocaleDateString()}
                  </span>
                  <div className="flex gap-4">
                    <span>{trend.orders} orders</span>
                    <span className="font-medium">
                      {currency} {(trend.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-ds-muted-foreground">
              <p className="text-sm">No product data available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ds-muted-foreground/70 w-6">
                      #{idx + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-ds-muted-foreground">
                    <span>{product.units_sold} sold</span>
                    <span className="font-medium">
                      {currency} {(product.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-ds-muted-foreground">
            <p className="text-sm">No recent orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-ds-muted-foreground">
                  <th className="pb-3 pe-4">Order</th>
                  <th className="pb-3 pe-4 text-right">Total</th>
                  <th className="pb-3 pe-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-ds-muted/50 transition"
                  >
                    <td className="py-4 pe-4 font-medium">
                      #{order.display_id || order.id.slice(0, 8)}
                    </td>
                    <td className="py-4 pe-4 text-right">
                      {currency} {(order.total / 100).toFixed(2)}
                    </td>
                    <td className="py-4 pe-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[order.status] || "bg-ds-muted text-ds-foreground"}`}
                      >
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-ds-muted-foreground">
                      {new Date(order.created_at!).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
