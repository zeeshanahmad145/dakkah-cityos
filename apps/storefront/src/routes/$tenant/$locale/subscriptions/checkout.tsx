import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import {
  useSubscriptionPlan,
  useCreateSubscription,
} from "@/lib/hooks/use-subscriptions"
import { CheckCircleSolid, Spinner, ArrowLeft, LockClosedSolid } from "@medusajs/icons"

export const Route = createFileRoute("/$tenant/$locale/subscriptions/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (search.plan as string) || "",
  }),
  component: SubscriptionCheckoutPage,
  head: () => ({
    meta: [
      { title: "Subscription Checkout | Dakkah CityOS" },
      { name: "description", content: "Complete your subscription on Dakkah CityOS" },
    ],
  }),
})

function SubscriptionCheckoutPage() {
  const { tenant, locale } = Route.useParams()
  const { plan: planHandle } = Route.useSearch()
  const navigate = useNavigate()

  const { data: plan, isLoading } = useSubscriptionPlan(planHandle)
  const createSubscription = useCreateSubscription()

  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  )
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubscribe = async () => {
    if (!plan) return

    setIsProcessing(true)
    try {
      await createSubscription.mutateAsync({
        plan_id: plan.id,
      })

      navigate({
        to: `/${tenant}/${locale}/subscriptions/success`,
        search: { plan: plan.handle },
      })
    } catch (error) {
      console.error("Failed to create subscription:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <Spinner className="w-8 h-8 text-ds-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ds-foreground mb-2">
            Plan Not Found
          </h1>
          <p className="text-ds-muted-foreground mb-6">
            The selected plan could not be found.
          </p>
          <button
            onClick={() => navigate({ to: `/${tenant}/${locale}/subscriptions` })}
            className="btn-enterprise-primary"
          >
            View All Plans
          </button>
        </div>
      </div>
    )
  }

  const yearlyPrice = Math.round(plan.price ?? 0 * 10) // 2 months free
  const selectedPrice =
    billingInterval === "yearly" ? yearlyPrice : plan.price ?? 0

  return (
    <div className="min-h-screen bg-ds-muted py-12">
      <div className="content-container max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate({ to: `/${tenant}/${locale}/subscriptions` })}
          className="flex items-center gap-2 text-ds-muted-foreground hover:text-ds-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </button>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <div className="enterprise-card">
              <div className="enterprise-card-header">
                <h1 className="text-xl font-semibold text-ds-foreground">
                  Complete Your Subscription
                </h1>
              </div>
              <div className="enterprise-card-body space-y-8">
                {/* Billing Interval Toggle */}
                <div>
                  <label className="block text-sm font-medium text-ds-foreground mb-3">
                    Billing Interval
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setBillingInterval("monthly")}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 text-center transition-all ${
                        billingInterval === "monthly"
                          ? "border-ds-foreground bg-ds-muted"
                          : "border-ds-border hover:border-ds-border"
                      }`}
                    >
                      <div className="font-medium text-ds-foreground">Monthly</div>
                      <div className="text-sm text-ds-muted-foreground">
                        {formatPrice(plan.price ?? 0, plan.currency_code)}/month
                      </div>
                    </button>
                    <button
                      onClick={() => setBillingInterval("yearly")}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 text-center transition-all relative ${
                        billingInterval === "yearly"
                          ? "border-ds-foreground bg-ds-muted"
                          : "border-ds-border hover:border-ds-border"
                      }`}
                    >
                      <span className="absolute -top-2 end-2 badge-success text-xs">
                        Save 17%
                      </span>
                      <div className="font-medium text-ds-foreground">Yearly</div>
                      <div className="text-sm text-ds-muted-foreground">
                        {formatPrice(yearlyPrice, plan.currency_code)}/year
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Method Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-ds-foreground mb-3">
                    Payment Method
                  </label>
                  <div className="border border-ds-border rounded-lg p-4 bg-ds-muted">
                    <p className="text-sm text-ds-muted-foreground text-center">
                      Payment integration coming soon. Trial will start
                      immediately.
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <div className="text-sm text-ds-muted-foreground">
                  By subscribing, you agree to our{" "}
                  <a href="#" className="text-ds-foreground underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-ds-foreground underline">
                    Privacy Policy
                  </a>
                  .
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full btn-enterprise-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Spinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LockClosedSolid className="w-4 h-4" />
                      {plan.trial_days
                        ? `Start ${plan.trial_days}-Day Free Trial`
                        : `Subscribe for ${formatPrice(selectedPrice, plan.currency_code)}/${billingInterval === "yearly" ? "year" : "month"}`}
                    </>
                  )}
                </button>

                {plan.trial_days && (
                  <p className="text-sm text-ds-muted-foreground text-center">
                    You won't be charged until your trial ends on{" "}
                    {new Date(
                      Date.now() + plan.trial_days * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="enterprise-card sticky top-24">
              <div className="enterprise-card-header">
                <h2 className="font-semibold text-ds-foreground">Order Summary</h2>
              </div>
              <div className="enterprise-card-body space-y-4">
                {/* Plan Details */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-ds-foreground">{plan.name}</div>
                    <div className="text-sm text-ds-muted-foreground">
                      {billingInterval === "yearly"
                        ? "Billed yearly"
                        : "Billed monthly"}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-medium text-ds-foreground">
                      {formatPrice(selectedPrice, plan.currency_code)}
                    </div>
                    <div className="text-sm text-ds-muted-foreground">
                      /{billingInterval === "yearly" ? "year" : "month"}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-ds-border pt-4">
                  <div className="text-sm font-medium text-ds-foreground mb-3">
                    Included Features
                  </div>
                  <ul className="space-y-2">
                    {((plan.features as string[] | undefined) ?? []).slice(0, 5).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-ds-muted-foreground"
                      >
                        <CheckCircleSolid className="w-4 h-4 text-ds-success flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                    {((plan.features as string[] | undefined) ?? []).length > 5 && (
                      <li className="text-sm text-ds-muted-foreground">
                        + {((plan.features as string[] | undefined) ?? []).length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Total */}
                <div className="border-t border-ds-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-ds-foreground">
                      Due Today
                    </span>
                    <span className="text-xl font-bold text-ds-foreground">
                      {plan.trial_days
                        ? formatPrice(0, plan.currency_code)
                        : formatPrice(selectedPrice, plan.currency_code)}
                    </span>
                  </div>
                  {plan.trial_days && (
                    <p className="text-sm text-ds-muted-foreground mt-1">
                      Then{" "}
                      {formatPrice(selectedPrice, plan.currency_code)}/
                      {billingInterval === "yearly" ? "year" : "month"} after
                      trial
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
