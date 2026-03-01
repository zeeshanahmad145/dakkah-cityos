import { Subscription } from "@/lib/types/subscriptions"
import { formatPrice } from "@/lib/utils/price"
import { cn } from "@/lib/utils/cn"

interface SubscriptionDetailProps {
  subscription: Subscription
}

export function SubscriptionDetail({ subscription }: SubscriptionDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-ds-success text-ds-success"
      case "paused":
        return "bg-ds-warning text-ds-warning"
      case "cancelled":
        return "bg-ds-destructive text-ds-destructive"
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-ds-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ds-foreground">
              {subscription.plan?.name || "Subscription"}
            </h2>
            <p className="text-ds-muted-foreground mt-1">
              {subscription.plan?.description}
            </p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium capitalize",
              getStatusColor(subscription.status),
            )}
          >
            {subscription.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Pricing */}
        <div>
          <h3 className="text-sm font-semibold text-ds-foreground mb-3">
            Pricing
          </h3>
          <div className="bg-ds-muted rounded-lg p-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ds-foreground">
                {formatPrice(
                  subscription.plan?.price ?? 0,
                  subscription.plan?.currency_code || "usd",
                )}
              </span>
              <span className="text-ds-muted-foreground">
                /{subscription.plan?.billing_interval || "month"}
              </span>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div>
          <h3 className="text-sm font-semibold text-ds-foreground mb-3">
            Billing Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                Start Date
              </p>
              <p className="text-sm text-ds-foreground mt-1">
                {formatDate(subscription.current_period_start)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                Next Billing
              </p>
              <p className="text-sm text-ds-foreground mt-1">
                {formatDate(subscription.next_billing_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                Billing Cycle
              </p>
              <p className="text-sm text-ds-foreground mt-1 capitalize">
                {subscription.plan?.billing_interval || "month"}ly
              </p>
            </div>
            <div>
              <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">
                Auto-Renew
              </p>
              <p className="text-sm text-ds-foreground mt-1">
                {subscription.status === "active" ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        {subscription.plan?.features &&
          (subscription.plan?.features as string[]).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ds-foreground mb-3">
                Included Features
              </h3>
              <ul className="space-y-2">
                {(subscription.plan?.features as string[]).map(
                  (feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-ds-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-ds-success" />
                      {feature}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
      </div>
    </div>
  )
}
