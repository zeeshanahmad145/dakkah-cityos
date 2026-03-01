import { Link } from "@tanstack/react-router"
import { Subscription } from "@/lib/types/subscriptions"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight, CreditCard } from "@medusajs/icons"
import { cn } from "@/lib/utils/cn"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  emptyMessage?: string
}

export function SubscriptionList({
  subscriptions,
  emptyMessage = "No subscriptions found",
}: SubscriptionListProps) {
  const prefix = useTenantPrefix()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-ds-success text-ds-success"
      case "paused":
        return "bg-ds-warning text-ds-warning"
      case "cancelled":
        return "bg-ds-destructive text-ds-destructive"
      case "expired":
        return "bg-ds-muted text-ds-foreground"
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
        <CreditCard className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4" />
        <p className="text-ds-muted-foreground">{emptyMessage}</p>
        <Link
          to={`${prefix}/subscriptions` as never}
          className="inline-block mt-4 text-sm font-medium text-ds-foreground hover:underline"
        >
          Browse subscription plans
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Link
          key={subscription.id}
          to={`${prefix}/account/subscriptions/${subscription.id}` as never}
          className="block bg-ds-background rounded-xl border border-ds-border p-6 hover:border-ds-border hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ds-foreground">
                {subscription.plan?.name || "Subscription"}
              </h3>
              <p className="text-sm text-ds-muted-foreground mt-0.5">
                {subscription.plan?.description}
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium capitalize",
                getStatusColor(subscription.status),
              )}
            >
              {subscription.status}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-ds-border">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-ds-muted-foreground">Price</p>
                <p className="font-semibold text-ds-foreground">
                  {formatPrice(
                    subscription.plan?.price ?? 0,
                    subscription.plan?.currency_code || "usd",
                  )}
                  /{subscription.plan?.billing_interval || "month"}
                </p>
              </div>
              <div>
                <p className="text-xs text-ds-muted-foreground">Next Billing</p>
                <p className="text-sm text-ds-foreground">
                  {subscription.next_billing_date
                    ? new Date(
                        subscription.next_billing_date,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <span className="text-sm text-ds-muted-foreground flex items-center gap-1">
              Manage
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
