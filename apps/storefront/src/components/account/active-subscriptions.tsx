import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight, CreditCard, ArrowPath } from "@medusajs/icons"
import type { Subscription } from "@/lib/types/subscriptions"

interface ActiveSubscriptionsProps {
  subscriptions: Subscription[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  active: "bg-ds-success text-ds-success",
  paused: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  past_due: "bg-ds-warning/15 text-ds-warning",
}

export function ActiveSubscriptions({ subscriptions, isLoading }: ActiveSubscriptionsProps) {
  const prefix = useTenantPrefix()

  if (isLoading) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">Active Subscriptions</h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-ds-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "active") || []

  if (!activeSubscriptions.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">Active Subscriptions</h2>
        </div>
        <div className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground">No active subscriptions</p>
          <Link
            to={`${prefix}/subscriptions` as any}
            className="mt-4 inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
          >
            Browse plans
            <ChevronRight className="h-4 w-4 ms-1" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border">
      <div className="p-4 border-b border-ds-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ds-foreground">Active Subscriptions</h2>
        <Link
          to={`${prefix}/account/subscriptions` as any}
          className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground"
        >
          Manage
        </Link>
      </div>
      <div className="divide-y divide-ds-border">
        {activeSubscriptions.slice(0, 2).map((subscription) => (
          <Link
            key={subscription.id}
            to={`${prefix}/account/subscriptions/${subscription.id}` as any}
            className="flex items-center gap-4 p-4 hover:bg-ds-muted transition-colors"
          >
            <div className="p-3 bg-ds-muted rounded-lg">
              <ArrowPath className="h-5 w-5 text-ds-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ds-foreground">{subscription.plan?.name || "Subscription"}</p>
              <p className="text-sm text-ds-muted-foreground">
                {formatPrice(subscription.plan?.price ?? 0, subscription.plan?.currency_code || "usd")} /{" "}
                {subscription.billing_interval}
              </p>
            </div>

            <div className="text-end">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  statusColors[subscription.status] || "bg-ds-muted text-ds-foreground"
                }`}
              >
                {subscription.status}
              </span>
              <p className="mt-1 text-xs text-ds-muted-foreground">
                Next: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-ds-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
