import React from 'react'

interface TierData {
  name: string
  benefits: string[]
  price: number
  color?: string
}

interface MembershipTiersBlockProps {
  heading?: string
  tiers?: TierData[]
  showComparison?: boolean
  variant?: 'cards' | 'horizontal' | 'vertical'
}

const defaultTiers: TierData[] = [
  {
    name: 'Bronze',
    price: 19,
    color: '#CD7F32',
    benefits: ['5% discount on all services', 'Priority booking', 'Monthly newsletter', 'Birthday reward'],
  },
  {
    name: 'Silver',
    price: 39,
    color: '#C0C0C0',
    benefits: ['10% discount on all services', 'Priority booking', 'Free cancellation', 'Exclusive events', 'Referral bonus', 'Monthly newsletter'],
  },
  {
    name: 'Gold',
    price: 79,
    color: '#FFD700',
    benefits: ['20% discount on all services', 'VIP booking', 'Free cancellation', 'All exclusive events', 'Double referral bonus', 'Personal concierge', 'Free upgrades', 'Early access'],
  },
]

export const MembershipTiersBlock: React.FC<MembershipTiersBlockProps> = ({
  heading = 'Membership Tiers',
  tiers,
  showComparison = false,
  variant = 'cards',
}) => {
  const items = tiers && tiers.length > 0 ? tiers : defaultTiers

  const renderCardsVariant = () => (
    <div className={`grid gap-6 md:gap-8 mx-auto ${
      items.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
    }`}>
      {items.map((tier, index) => (
        <div
          key={index}
          className="relative flex flex-col rounded-xl border border-ds-border bg-ds-card overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="h-2" style={{ backgroundColor: tier.color || '#6366f1' }} />
          <div className="p-6 md:p-8 flex flex-col flex-1">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-ds-foreground mb-2" style={{ color: tier.color }}>
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-ds-foreground">${tier.price}</span>
                <span className="text-ds-muted-foreground text-sm">/month</span>
              </div>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {(tier.benefits || []).map((benefit, bi) => (
                <li key={bi} className="flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={tier.color || '#6366f1'} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-ds-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: tier.color || '#6366f1' }}
            >
              Join {tier.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderHorizontalVariant = () => (
    <div className="max-w-4xl mx-auto space-y-4">
      {items.map((tier, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row items-stretch rounded-xl border border-ds-border bg-ds-card overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="w-full sm:w-2 sm:h-auto h-2" style={{ backgroundColor: tier.color || '#6366f1' }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-1 p-5 gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-ds-foreground" style={{ color: tier.color }}>
                {tier.name}
              </h3>
              <p className="text-sm text-ds-muted-foreground mt-1">
                {tier.benefits.slice(0, 3).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl font-bold text-ds-foreground">${tier.price}</span>
                <span className="text-sm text-ds-muted-foreground">/mo</span>
              </div>
              <button
                className="px-6 py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: tier.color || '#6366f1' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderVerticalVariant = () => (
    <div className="max-w-md mx-auto space-y-6">
      {items.map((tier, index) => (
        <div
          key={index}
          className="rounded-xl border border-ds-border bg-ds-card overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-6 text-center" style={{ backgroundColor: `${tier.color || '#6366f1'}15` }}>
            <h3 className="text-2xl font-bold" style={{ color: tier.color }}>{tier.name}</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold text-ds-foreground">${tier.price}</span>
              <span className="text-ds-muted-foreground">/month</span>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-3 mb-6">
              {(tier.benefits || []).map((benefit, bi) => (
                <li key={bi} className="flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={tier.color || '#6366f1'} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-ds-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: tier.color || '#6366f1' }}
            >
              Join {tier.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderComparisonTable = () => {
    const allBenefits = Array.from(new Set(items.flatMap((t) => t.benefits)))
    return (
      <div className="mt-12 overflow-x-auto">
        <h3 className="text-xl font-bold text-ds-foreground text-center mb-6">Compare Tiers</h3>
        <table className="w-full border-collapse max-w-5xl mx-auto">
          <thead>
            <tr>
              <th className="text-left p-4 border-b border-ds-border text-ds-muted-foreground text-sm font-medium">Benefits</th>
              {items.map((tier, i) => (
                <th key={i} className="p-4 border-b border-ds-border text-center">
                  <span className="font-semibold" style={{ color: tier.color }}>{tier.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBenefits.map((benefit, bi) => (
              <tr key={bi} className="border-b border-ds-border">
                <td className="p-4 text-sm text-ds-foreground">{benefit}</td>
                {items.map((tier, ti) => (
                  <td key={ti} className="p-4 text-center">
                    {tier.benefits.includes(benefit) ? (
                      <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke={tier.color || '#6366f1'} strokeWidth={2}>
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
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {heading && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground text-center mb-8 md:mb-12">
            {heading}
          </h2>
        )}

        {variant === 'cards' && renderCardsVariant()}
        {variant === 'horizontal' && renderHorizontalVariant()}
        {variant === 'vertical' && renderVerticalVariant()}

        {showComparison && renderComparisonTable()}
      </div>
    </section>
  )
}
