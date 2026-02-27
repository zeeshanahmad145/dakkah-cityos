
import { CheckCircleSolid } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import type { SubscriptionPlan } from "../../lib/types/subscriptions"

interface PlanCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
}

export function PlanCard({ plan, isCurrentPlan }: PlanCardProps) {
  const prefix = useTenantPrefix()

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const intervalLabel = {
    monthly: "/month",
    yearly: "/year",
    quarterly: "/quarter",
    weekly: "/week",
  }

  return (
    <div
      className={`
        relative bg-ds-background rounded-2xl border-2 transition-all duration-300
        ${
          plan.is_popular
            ? "border-ds-foreground shadow-xl scale-[1.02]"
            : "border-ds-border hover:border-ds-border hover:shadow-lg"
        }
        ${isCurrentPlan ? "ring-2 ring-ds-success ring-offset-2" : ""}
      `}
    >
      {plan.is_popular && (
        <div className="absolute -top-4 start-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1.5 bg-ds-primary text-ds-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wide">
            Most Popular
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 end-4">
          <span className="inline-flex items-center px-3 py-1 bg-ds-success text-ds-primary-foreground text-xs font-semibold rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-ds-foreground mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-ds-muted-foreground">{plan.description}</p>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-ds-foreground">
              {formatPrice(plan.price, plan.currency_code)}
            </span>
            <span className="text-ds-muted-foreground text-lg">
              {intervalLabel[plan.billing_interval]}
            </span>
          </div>
          {plan.trial_days && (
            <p className="text-sm text-ds-success font-medium mt-2">
              {plan.trial_days}-day free trial
            </p>
          )}
          {plan.setup_fee && (
            <p className="text-xs text-ds-muted-foreground mt-1">
              + {formatPrice(plan.setup_fee, plan.currency_code)} setup fee
            </p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {(plan.features || []).map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircleSolid className="w-5 h-5 text-ds-success flex-shrink-0 mt-0.5" />
              <span className="text-sm text-ds-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 px-6 rounded-xl bg-ds-muted text-ds-muted-foreground font-medium cursor-not-allowed"
          >
            Current Plan
          </button>
        ) : (
          <a
            href={`${prefix}/subscriptions/checkout?plan=${plan.handle}`}
            className={`
              w-full py-3 px-6 rounded-xl font-medium text-center block transition-all duration-200
              ${
                plan.is_popular
                  ? "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary"
                  : "bg-ds-background text-ds-foreground border-2 border-ds-foreground hover:bg-ds-primary hover:text-ds-primary-foreground"
              }
            `}
          >
            {plan.trial_days ? "Start Free Trial" : "Get Started"}
          </a>
        )}
      </div>
    </div>
  )
}

interface PlanComparisonTableProps {
  plans: SubscriptionPlan[]
}

export function PlanComparisonTable({
  plans,
}: PlanComparisonTableProps) {
  const prefix = useTenantPrefix()

  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features || []))
  )

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ds-border">
            <th className="text-start py-4 px-4 text-sm font-medium text-ds-muted-foreground">
              Features
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className={`text-center py-4 px-4 ${plan.is_popular ? "bg-ds-muted" : ""}`}
              >
                <div className="font-semibold text-ds-foreground">{plan.name}</div>
                <div className="text-2xl font-bold text-ds-foreground mt-1">
                  {formatPrice(plan.price, plan.currency_code)}
                  <span className="text-sm font-normal text-ds-muted-foreground">
                    /mo
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ds-border">
          {allFeatures.map((feature, index) => (
            <tr key={index}>
              <td className="py-3 px-4 text-sm text-ds-muted-foreground">{feature}</td>
              {plans.map((plan) => (
                <td
                  key={plan.id}
                  className={`py-3 px-4 text-center ${plan.is_popular ? "bg-ds-muted" : ""}`}
                >
                  {plan.features.includes(feature) ? (
                    <CheckCircleSolid className="w-5 h-5 text-ds-success mx-auto" />
                  ) : (
                    <span className="text-ds-muted-foreground">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-ds-border">
            <td className="py-6 px-4"></td>
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={`py-6 px-4 text-center ${plan.is_popular ? "bg-ds-muted" : ""}`}
              >
                <a
                  href={`${prefix}/subscriptions/checkout?plan=${plan.handle}`}
                  className={`
                    inline-flex items-center justify-center py-2.5 px-6 rounded-lg font-medium transition-all duration-200
                    ${
                      plan.is_popular
                        ? "bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary"
                        : "bg-ds-background text-ds-foreground border border-ds-border hover:bg-ds-muted"
                    }
                  `}
                >
                  Choose Plan
                </a>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
