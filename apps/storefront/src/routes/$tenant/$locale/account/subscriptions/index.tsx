import { createFileRoute, Link } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { useCustomerSubscriptions } from "@/lib/hooks/use-subscriptions"
import { formatPrice } from "@/lib/utils/price"
import { CreditCard, ChevronRight, ArrowPath } from "@medusajs/icons"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/account/subscriptions/")(
  {
    component: SubscriptionsPage,
  },
)

const statusColors: Record<string, string> = {
  active: "bg-ds-success text-ds-success",
  paused: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  past_due: "bg-ds-warning/15 text-ds-warning",
  trialing: "bg-ds-info text-ds-info",
}

function SubscriptionsPage() {
  const { tenant, locale } = Route.useParams()
  const { data: subscriptions, isLoading } = useCustomerSubscriptions()
  const baseHref = `/${tenant}/${locale}`

  return (
    <AccountLayout
      title={t(locale, "account.subscriptions_title", "Subscriptions")}
      description={t(
        locale,
        "account.subscriptions_description",
        "Manage your active subscriptions",
      )}
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-ds-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : !subscriptions?.length ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <CreditCard className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground mb-4">No subscriptions yet</p>
          <Link
            to={`${baseHref}/subscriptions` as never}
            className="inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
          >
            Browse subscription plans
            <ChevronRight className="h-4 w-4 ms-1" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Link
              key={subscription.id}
              to={
                `${baseHref}/account/subscriptions/${subscription.id}` as never
              }
              className="block bg-ds-background rounded-lg border border-ds-border p-6 hover:border-ds-border transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-ds-muted rounded-lg">
                    <ArrowPath className="h-6 w-6 text-ds-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ds-foreground">
                      {subscription.plan?.name || "Subscription"}
                    </h3>
                    <p className="text-sm text-ds-muted-foreground mt-1">
                      {formatPrice(
                        subscription.plan?.price ?? 0,
                        subscription.plan?.currency_code || "usd",
                      )}{" "}
                      / {subscription.billing_interval}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          statusColors[subscription.status] ||
                          "bg-ds-muted text-ds-foreground"
                        }`}
                      >
                        {subscription.status}
                      </span>
                      {subscription.status === "active" && (
                        <span className="text-xs text-ds-muted-foreground">
                          Renews{" "}
                          {new Date(
                            subscription.current_period_end!,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-ds-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
