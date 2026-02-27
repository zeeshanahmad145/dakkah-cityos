import React from 'react'

interface PlanData {
  name: string
  price: number
  interval?: string
  features: string[]
}

interface SubscriptionPlansBlockProps {
  heading?: string
  plans?: PlanData[]
  billingToggle?: boolean
  highlightedPlan?: string
  variant?: 'cards' | 'table' | 'minimal'
}

const defaultPlans: PlanData[] = [
  {
    name: 'Starter',
    price: 9,
    interval: 'month',
    features: ['5 Bookings/month', 'Email support', 'Basic analytics', 'Single user'],
  },
  {
    name: 'Professional',
    price: 29,
    interval: 'month',
    features: ['Unlimited bookings', 'Priority support', 'Advanced analytics', 'Up to 5 users', 'API access', 'Custom branding'],
  },
  {
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'Unlimited users', 'SLA guarantee', 'White-label', 'SSO'],
  },
]

export const SubscriptionPlansBlock: React.FC<SubscriptionPlansBlockProps> = ({
  heading = 'Choose Your Plan',
  plans,
  billingToggle = true,
  highlightedPlan = 'Professional',
  variant = 'cards',
}) => {
  const [isYearly, setIsYearly] = React.useState(false)
  const items = plans && plans.length > 0 ? plans : defaultPlans

  const getPrice = (price: number) => isYearly ? Math.round(price * 10) : price
  const getPeriod = () => isYearly ? '/year' : '/month'

  const renderCardsVariant = () => (
    <div className={`grid gap-6 md:gap-8 mx-auto ${
      items.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
    }`}>
      {items.map((plan, index) => {
        const isHighlighted = plan.name === highlightedPlan
        return (
          <div
            key={index}
            className={`relative flex flex-col rounded-xl border p-6 md:p-8 transition-shadow ${
              isHighlighted
                ? 'border-ds-primary bg-ds-card shadow-xl scale-[1.02]'
                : 'border-ds-border bg-ds-card hover:shadow-lg'
            }`}
          >
            {isHighlighted && (
              <div className="absolute -top-3 start-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-ds-primary text-ds-primary-foreground text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-ds-foreground mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ds-foreground">${getPrice(plan.price)}</span>
                <span className="text-ds-muted-foreground text-sm">{getPeriod()}</span>
              </div>
              {isYearly && (
                <p className="text-xs text-ds-success mt-1">Save ${plan.price * 2}/year</p>
              )}
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {(plan.features || []).map((feature, fi) => (
                <li key={fi} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-ds-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-ds-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isHighlighted
                  ? 'bg-ds-primary text-ds-primary-foreground hover:opacity-90'
                  : 'border border-ds-border text-ds-foreground hover:bg-ds-muted'
              }`}
            >
              Get Started
            </button>
          </div>
        )
      })}
    </div>
  )

  const renderTableVariant = () => {
    const allFeatures = Array.from(new Set(items.flatMap((p) => p.features)))
    return (
      <div className="overflow-x-auto max-w-5xl mx-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 border-b border-ds-border text-ds-muted-foreground text-sm font-medium">Features</th>
              {items.map((plan, i) => (
                <th key={i} className={`p-4 border-b text-center ${plan.name === highlightedPlan ? 'border-ds-primary bg-ds-primary/5' : 'border-ds-border'}`}>
                  <div className="font-semibold text-ds-foreground">{plan.name}</div>
                  <div className="text-2xl font-bold text-ds-foreground mt-1">${getPrice(plan.price)}<span className="text-sm font-normal text-ds-muted-foreground">{getPeriod()}</span></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature, fi) => (
              <tr key={fi} className="border-b border-ds-border">
                <td className="p-4 text-sm text-ds-foreground">{feature}</td>
                {items.map((plan, pi) => (
                  <td key={pi} className={`p-4 text-center ${plan.name === highlightedPlan ? 'bg-ds-primary/5' : ''}`}>
                    {plan.features.includes(feature) ? (
                      <svg className="w-5 h-5 text-ds-success mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-ds-muted-foreground/30 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {items.map((plan, i) => (
                <td key={i} className={`p-4 text-center ${plan.name === highlightedPlan ? 'bg-ds-primary/5' : ''}`}>
                  <button className={`px-6 py-2.5 rounded-lg font-semibold text-sm ${
                    plan.name === highlightedPlan
                      ? 'bg-ds-primary text-ds-primary-foreground'
                      : 'border border-ds-border text-ds-foreground hover:bg-ds-muted'
                  }`}>
                    Choose Plan
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const renderMinimalVariant = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      {items.map((plan, index) => {
        const isHighlighted = plan.name === highlightedPlan
        return (
          <div
            key={index}
            className={`flex items-center justify-between p-5 rounded-xl border transition-colors ${
              isHighlighted ? 'border-ds-primary bg-ds-primary/5' : 'border-ds-border bg-ds-card'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ds-foreground">{plan.name}</h3>
                {isHighlighted && (
                  <span className="px-2 py-0.5 bg-ds-primary text-ds-primary-foreground text-xs font-medium rounded-full">Popular</span>
                )}
              </div>
              <p className="text-sm text-ds-muted-foreground mt-1">{plan.features.slice(0, 3).join(' · ')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl font-bold text-ds-foreground">${getPrice(plan.price)}</span>
                <span className="text-sm text-ds-muted-foreground">{getPeriod()}</span>
              </div>
              <button className={`px-5 py-2 rounded-lg font-semibold text-sm ${
                isHighlighted
                  ? 'bg-ds-primary text-ds-primary-foreground'
                  : 'border border-ds-border text-ds-foreground hover:bg-ds-muted'
              }`}>
                Select
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {heading && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground text-center mb-4">
            {heading}
          </h2>
        )}

        {billingToggle && (
          <div className="flex items-center justify-center gap-3 mb-8 md:mb-12">
            <span className={`text-sm font-medium ${!isYearly ? 'text-ds-foreground' : 'text-ds-muted-foreground'}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isYearly ? 'bg-ds-primary' : 'bg-ds-muted'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-ds-background shadow-sm ring-0 transition-transform ${isYearly ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-ds-foreground' : 'text-ds-muted-foreground'}`}>
              Yearly
              <span className="ms-1 text-xs text-ds-success">(Save 17%)</span>
            </span>
          </div>
        )}

        {variant === 'cards' && renderCardsVariant()}
        {variant === 'table' && renderTableVariant()}
        {variant === 'minimal' && renderMinimalVariant()}
      </div>
    </section>
  )
}
