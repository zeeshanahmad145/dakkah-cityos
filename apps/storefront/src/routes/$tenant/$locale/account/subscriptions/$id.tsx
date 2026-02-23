import { createFileRoute, Link } from "@tanstack/react-router"
import { getMedusaPublishableKey } from "@/lib/utils/env"
import { AccountLayout } from "@/components/account"
import { useSubscription, usePauseSubscription, useResumeSubscription, useCancelSubscription } from "@/lib/hooks/use-subscriptions"
import { formatPrice } from "@/lib/utils/price"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Spinner, ArrowPath, Pause, TriangleRightMini, XMark, CheckCircleSolid } from "@medusajs/icons"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/account/subscriptions/$id")({
  loader: async ({ params }) => {
    try {
      const { getServerBaseUrl, fetchWithTimeout } = await import("@/lib/utils/env")
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/subscriptions/${params.id}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: data.item || data.subscription || data }
    } catch { return { item: null } }
  },
  component: SubscriptionDetailPage,
})

const statusColors: Record<string, string> = {
  active: "bg-ds-success text-ds-success",
  paused: "bg-ds-warning text-ds-warning",
  canceled: "bg-ds-destructive text-ds-destructive",
  past_due: "bg-ds-warning/15 text-ds-warning",
}

function SubscriptionDetailPage() {
  const { tenant, locale, id } = Route.useParams() as { tenant: string; locale: string; id: string }
  const { data: subscription, isLoading, refetch } = useSubscription(id)
  const pauseMutation = usePauseSubscription()
  const resumeMutation = useResumeSubscription()
  const cancelMutation = useCancelSubscription()
  const baseHref = `/${tenant}/${locale}`
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handlePause = async () => {
    setActionLoading("pause")
    try {
      await pauseMutation.mutateAsync({ subscriptionId: id })
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  const handleResume = async () => {
    setActionLoading("resume")
    try {
      await resumeMutation.mutateAsync(id)
      refetch()
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    setActionLoading("cancel")
    try {
      await cancelMutation.mutateAsync({ subscriptionId: id })
      refetch()
      setShowCancelConfirm(false)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8 animate-spin text-ds-muted-foreground" />
        </div>
      </AccountLayout>
    )
  }

  if (!subscription) {
    return (
      <AccountLayout>
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <p className="text-ds-muted-foreground mb-4">Subscription not found</p>
          <Link
            to={`${baseHref}/account/subscriptions` as any}
            className="text-sm font-medium text-ds-foreground hover:underline"
          >
            Back to subscriptions
          </Link>
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to={`${baseHref}/account/subscriptions` as any}
          className="inline-flex items-center text-sm text-ds-muted-foreground hover:text-ds-foreground"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to subscriptions
        </Link>

        {/* Header */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-ds-muted rounded-lg">
              <ArrowPath className="h-6 w-6 text-ds-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-ds-foreground">{subscription.plan.name}</h1>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    statusColors[subscription.status] || "bg-ds-muted text-ds-foreground"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              <p className="text-ds-muted-foreground mt-1">
                {formatPrice(subscription.plan.price, subscription.plan.currency_code)} /{" "}
                {subscription.billing_interval}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-ds-muted-foreground">Current Period</p>
              <p className="text-sm font-medium text-ds-foreground">
                {new Date(subscription.current_period_start).toLocaleDateString()} -{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-ds-muted-foreground">Next Billing Date</p>
              <p className="text-sm font-medium text-ds-foreground">
                {subscription.status === "active"
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-ds-muted-foreground">Started</p>
              <p className="text-sm font-medium text-ds-foreground">
                {new Date(subscription.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-ds-muted-foreground">Billing Interval</p>
              <p className="text-sm font-medium text-ds-foreground capitalize">
                {subscription.billing_interval}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">Plan Features</h2>
          <ul className="space-y-3">
            {subscription.plan.features?.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <CheckCircleSolid className="h-5 w-5 text-ds-success" />
                <span className="text-sm text-ds-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        {subscription.status !== "canceled" && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <h2 className="text-lg font-semibold text-ds-foreground mb-4">Manage Subscription</h2>
            
            {!showCancelConfirm ? (
              <div className="flex flex-wrap gap-3">
                {subscription.status === "active" && (
                  <Button
                    variant="outline"
                    size="fit"
                    onClick={handlePause}
                    disabled={actionLoading === "pause"}
                  >
                    {actionLoading === "pause" ? (
                      <Spinner className="animate-spin h-4 w-4 me-2" />
                    ) : (
                      <Pause className="h-4 w-4 me-2" />
                    )}
                    Pause subscription
                  </Button>
                )}
                
                {subscription.status === "paused" && (
                  <Button
                    variant="outline"
                    size="fit"
                    onClick={handleResume}
                    disabled={actionLoading === "resume"}
                  >
                    {actionLoading === "resume" ? (
                      <Spinner className="animate-spin h-4 w-4 me-2" />
                    ) : (
                      <TriangleRightMini className="h-4 w-4 me-2" />
                    )}
                    Resume subscription
                  </Button>
                )}
                
                <Button
                  variant="danger"
                  size="fit"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  <XMark className="h-4 w-4 me-2" />
                  Cancel subscription
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-ds-destructive rounded-lg">
                  <p className="text-sm font-medium text-ds-destructive">
                    Are you sure you want to cancel?
                  </p>
                  <p className="text-sm text-ds-destructive mt-1">
                    You'll lose access to all features at the end of your current billing period.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="fit" onClick={() => setShowCancelConfirm(false)}>
                    Keep subscription
                  </Button>
                  <Button
                    variant="danger"
                    size="fit"
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                  >
                    {actionLoading === "cancel" ? (
                      <Spinner className="animate-spin h-4 w-4 me-2" />
                    ) : null}
                    Yes, cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
