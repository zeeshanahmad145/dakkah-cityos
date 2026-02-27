import React from 'react'
import { Badge } from '../ui/badge'
import { t } from '@/lib/i18n'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  description?: string
  price: {
    monthly: number
    yearly: number
    currency?: string
  }
  features: PlanFeature[]
  cta?: {
    text: string
    url: string
  }
  popular?: boolean
  badge?: string
}

interface PricingBlockProps {
  heading?: string
  description?: string
  plans: Plan[]
  billingToggle?: boolean
  highlightedPlan?: string
  locale?: string
}

export const PricingBlock: React.FC<PricingBlockProps> = ({
  heading,
  description,
  plans,
  billingToggle = true,
  highlightedPlan,
  locale = 'en',
}) => {
  const [isYearly, setIsYearly] = React.useState(false)

  if (!plans || !plans.length) return null

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1 max-w-md',
    2: 'grid-cols-1 md:grid-cols-2 max-w-4xl',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl',
  }

  const cols = gridCols[Math.min(plans.length, 4)] || gridCols[3]

  const formatPrice = (amount: number, currency?: string) => {
    const sym = currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : '$'
    return `${sym}${amount}`
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {heading && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground text-center mb-4">
            {heading}
          </h2>
        )}
        {description && (
          <p className="text-ds-muted-foreground text-center max-w-2xl mx-auto mb-8">
            {description}
          </p>
        )}

        {billingToggle && (
          <div className="flex items-center justify-center gap-3 mb-8 md:mb-12">
            <span className={`text-sm font-medium ${!isYearly ? 'text-ds-foreground' : 'text-ds-muted-foreground'}`}>
              {t(locale, 'blocks.monthly')}
            </span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isYearly ? 'bg-ds-primary' : 'bg-ds-muted'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-ds-background shadow-sm ring-0 transition-transform ${isYearly ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-ds-foreground' : 'text-ds-muted-foreground'}`}>
              {t(locale, 'blocks.yearly')}
            </span>
          </div>
        )}

        <div className={`grid gap-6 md:gap-8 mx-auto ${cols}`}>
          {plans.map((plan) => {
            const isHighlighted = plan.popular || plan.id === highlightedPlan
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-lg border p-6 md:p-8 ${
                  isHighlighted
                    ? 'border-ds-primary bg-ds-card shadow-lg scale-[1.02]'
                    : 'border-ds-border bg-ds-card'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                    <Badge variant="default" size="sm">{plan.badge}</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-sm text-ds-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-ds-foreground">
                    {formatPrice(isYearly ? plan.price.yearly : plan.price.monthly, plan.price.currency)}
                  </span>
                  <span className="text-ds-muted-foreground text-sm ms-1">
                    {isYearly ? t(locale, 'blocks.per_year') : t(locale, 'blocks.per_month')}
                  </span>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {(plan.features || []).map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-ds-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-ds-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-ds-foreground' : 'text-ds-muted-foreground'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.cta && (
                  <a
                    href={plan.cta.url}
                    className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      isHighlighted
                        ? 'bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90'
                        : 'border border-ds-border text-ds-foreground hover:bg-ds-muted'
                    }`}
                  >
                    {plan.cta.text}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
