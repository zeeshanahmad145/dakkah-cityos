import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { ShoppingBag, CurrencyDollar, ClockSolid } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface VendorStats {
  total_earnings: number
  total_orders: number
  products_count: number
  pending_payout: number
  commission_rate: number
  commission_type: string
}

interface Payout {
  id: string
  amount: number
  status: string
  created_at: string
}

export function VendorDashboard() {
  const prefix = useTenantPrefix()

  // Fetch vendor dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        stats: VendorStats
        recent_payouts: Payout[]
      }>("/vendor/dashboard", {
        credentials: "include",
      })
      return response
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = dashboardData?.stats
  const recentPayouts = dashboardData?.recent_payouts || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your products, orders, and payouts
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Total Earnings
            </span>
            <CurrencyDollar className="w-5 h-5 text-ds-success" />
          </div>
          <p className="text-2xl font-bold">
            ${(stats?.total_earnings || 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">After commission</p>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-ds-info" />
          </div>
          <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime orders</p>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Products</span>
            <ShoppingBag className="w-5 h-5 text-ds-accent" />
          </div>
          <p className="text-2xl font-bold">{stats?.products_count || 0}</p>
          <Link
            to={`${prefix}/vendor/products` as never}
            className="text-xs text-primary hover:underline"
          >
            Manage products
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Pending Payout
            </span>
            <ClockSolid className="w-5 h-5 text-ds-warning" />
          </div>
          <p className="text-2xl font-bold">
            ${(stats?.pending_payout || 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Available to withdraw
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={`${prefix}/vendor/products` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <ShoppingBag className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Manage Products</h3>
            <p className="text-sm text-muted-foreground">
              Add, edit, or remove your products
            </p>
          </div>
        </Link>

        <Link to={`${prefix}/vendor/orders` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <ShoppingBag className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">View Orders</h3>
            <p className="text-sm text-muted-foreground">
              Track and fulfill orders
            </p>
          </div>
        </Link>

        <Link to={`${prefix}/vendor/payouts` as never}>
          <div className="border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <CurrencyDollar className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Payouts</h3>
            <p className="text-sm text-muted-foreground">
              View earnings and request payouts
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Payouts */}
      <div className="border rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Payouts</h2>
        </div>
        {recentPayouts.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No payouts yet
          </div>
        ) : (
          <div className="divide-y">
            {recentPayouts.slice(0, 5).map((payout) => (
              <div
                key={payout.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">
                    ${Number(payout.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payout.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <PayoutStatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Info */}
      {stats && (
        <div className="border rounded-lg p-6 bg-muted/20">
          <h3 className="font-semibold mb-2">Commission Rate</h3>
          <p className="text-muted-foreground">
            {stats.commission_type === "percentage"
              ? `${stats.commission_rate}% of each sale`
              : `$${stats.commission_rate.toFixed(2)} per sale`}
          </p>
        </div>
      )}
    </div>
  )
}

function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-ds-warning text-ds-warning",
    processing: "bg-ds-info text-ds-info",
    completed: "bg-ds-success text-ds-success",
    failed: "bg-ds-destructive text-ds-destructive",
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-ds-muted"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
