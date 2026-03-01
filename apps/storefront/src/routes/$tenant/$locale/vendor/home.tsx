// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useMemo } from "react"

interface DashboardData {
  vendor_name: string
  total_products: number
  pending_orders: number
  revenue_this_month: number
  average_rating: number
  currency_code: string
  recent_orders: {
    id: string
    display_id: string
    total: number
    status: string
    created_at: string
  }[]
  recent_reviews: {
    id: string
    rating: number
    title: string
    content: string
    customer_name: string
    created_at: string
  }[]
}

export const Route = createFileRoute("/$tenant/$locale/vendor/home")({
  component: VendorHomeRoute,
})

function VendorHomeRoute() {
  const { tenant, locale } = Route.useParams() as {
    tenant: string
    locale: string
  }
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async () => {
      return sdk.client.fetch<DashboardData>("/vendor/dashboard", {
        credentials: "include",
      })
    },
  })

  const currency = data?.currency_code?.toUpperCase() || "USD"

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse mb-6" />
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
    { label: "Total Products", value: data?.total_products || 0 },
    { label: "Pending Orders", value: data?.pending_orders || 0 },
    {
      label: "Revenue This Month",
      value: `${currency} ${((data?.revenue_this_month || 0) / 100).toFixed(2)}`,
    },
    {
      label: "Average Rating",
      value: `${(data?.average_rating || 0).toFixed(1)} / 5.0`,
    },
  ]

  const recentOrders = data?.recent_orders || []
  const recentReviews = data?.recent_reviews || []

  const statusColors: Record<string, string> = {
    completed: "bg-ds-success/15 text-ds-success",
    pending: "bg-ds-warning/15 text-ds-warning",
    processing: "bg-ds-info/15 text-ds-info",
    cancelled: "bg-ds-destructive/15 text-ds-destructive",
    refunded: "bg-ds-muted text-ds-foreground",
  }

  const quickLinks = [
    { label: "Products", href: `/${tenant}/${locale}/vendor` },
    { label: "Orders", href: `/${tenant}/${locale}/vendor/orders` },
    { label: "Analytics", href: `/${tenant}/${locale}/vendor/analytics` },
    { label: "Transactions", href: `/${tenant}/${locale}/vendor/transactions` },
    { label: "Payouts", href: `/${tenant}/${locale}/vendor/payouts` },
    { label: "Inventory", href: `/${tenant}/${locale}/vendor/inventory` },
  ]

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {data?.vendor_name
            ? `Welcome back, ${data.vendor_name}`
            : "Vendor Dashboard"}
        </h1>
        <p className="text-ds-muted-foreground mt-1">
          Here's an overview of your store performance.
        </p>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            to={link.href}
            className="border rounded-lg p-4 text-center hover:shadow-md transition hover:border-ds-primary/40"
          >
            <span className="text-sm font-medium text-ds-primary">
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-ds-muted-foreground">
              <p className="text-sm">No recent orders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      #{order.display_id || order.id.slice(0, 8)}
                    </span>
                    <span className="text-sm text-ds-muted-foreground ms-3">
                      {new Date(order.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {currency} {(order.total / 100).toFixed(2)}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[order.status] || "bg-ds-muted text-ds-foreground"}`}
                    >
                      {order.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 text-ds-muted-foreground">
              <p className="text-sm">No recent reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < review.rating ? "text-ds-warning" : "text-ds-border"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {review.customer_name}
                      </span>
                    </div>
                    <span className="text-xs text-ds-muted-foreground/70">
                      {new Date(review.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <p className="text-sm font-medium">{review.title}</p>
                  )}
                  {review.content && (
                    <p className="text-sm text-ds-muted-foreground line-clamp-2">
                      {review.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
