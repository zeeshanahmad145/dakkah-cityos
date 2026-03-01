// @ts-nocheck
import { useState } from "react"
import { t, formatCurrency } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"

export interface BNPLProvider {
  id: string
  name: string
  logo: React.ReactNode
  minAmount: number
  maxAmount: number
  installments: number
  fees: number
}

interface BNPLOptionsProps {
  cartTotal: number
  currency?: string
  locale?: string
  onSelect?: (provider: BNPLProvider) => void
}

const DEFAULT_PROVIDERS: BNPLProvider[] = [
  {
    id: "tabby",
    name: "Tabby",
    logo: null,
    minAmount: 1,
    maxAmount: 5000,
    installments: 4,
    fees: 0,
  },
  {
    id: "tamara",
    name: "Tamara",
    logo: null,
    minAmount: 1,
    maxAmount: 4000,
    installments: 3,
    fees: 0,
  },
  {
    id: "postpay",
    name: "Postpay",
    logo: null,
    minAmount: 1,
    maxAmount: 3000,
    installments: 4,
    fees: 0,
  },
]

export default function BNPLOptions({ cartTotal, currency = "USD", locale: localeProp, onSelect }: BNPLOptionsProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const eligibleProviders = DEFAULT_PROVIDERS.filter(
    (p) => cartTotal >= p.minAmount && cartTotal <= p.maxAmount
  )

  const handleSelect = (provider: BNPLProvider) => {
    setSelectedId(provider.id)
    onSelect?.(provider)
  }

  if (eligibleProviders.length === 0) {
    return null
  }

  return (
    <div className="bg-ds-card border border-ds-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-ds-foreground mb-1">
        {t(locale, "checkout.bnpl_title") !== "checkout.bnpl_title"
          ? t(locale, "checkout.bnpl_title")
          : "Buy Now, Pay Later"}
      </h3>
      <p className="text-xs text-ds-muted mb-3">
        {t(locale, "checkout.bnpl_subtitle") !== "checkout.bnpl_subtitle"
          ? t(locale, "checkout.bnpl_subtitle")
          : "Split your purchase into interest-free payments"}
      </p>

      <div className="space-y-2">
        {eligibleProviders.map((provider) => {
          const installmentAmount = (cartTotal + provider.fees) / provider.installments
          const isSelected = selectedId === provider.id

          return (
            <button
              key={provider.id}
              onClick={() => handleSelect(provider)}
              className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors ${
                isSelected
                  ? "border-ds-primary bg-ds-surface"
                  : "border-ds-border bg-ds-card hover:bg-ds-surface"
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-ds-surface rounded-lg flex items-center justify-center">
                {provider.logo || (
                  <span className="text-xs font-bold text-ds-primary">
                    {provider.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 text-start">
                <p className="text-sm font-medium text-ds-foreground">{provider.name}</p>
                <p className="text-xs text-ds-muted">
                  {provider.installments}{" "}
                  {t(locale, "checkout.bnpl_payments_of") !== "checkout.bnpl_payments_of"
                    ? t(locale, "checkout.bnpl_payments_of")
                    : "payments of"}{" "}
                  {formatCurrency(installmentAmount, currency, locale as import("@/lib/i18n").SupportedLocale)}
                </p>
              </div>

              <div className="flex-shrink-0">
                {provider.fees === 0 && (
                  <span className="text-xs font-medium text-ds-primary px-2 py-0.5 bg-ds-surface rounded-full">
                    {t(locale, "checkout.bnpl_no_fees") !== "checkout.bnpl_no_fees"
                      ? t(locale, "checkout.bnpl_no_fees")
                      : "0% interest"}
                  </span>
                )}
              </div>

              <div className="flex-shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-ds-primary" : "border-ds-border"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-ds-primary" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedId && (
        <div className="mt-3 p-3 bg-ds-surface rounded-md border border-ds-border">
          <div className="flex items-center gap-2 text-xs text-ds-muted">
            <svg className="w-4 h-4 text-ds-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {t(locale, "checkout.bnpl_info") !== "checkout.bnpl_info"
                ? t(locale, "checkout.bnpl_info")
                : "You will be redirected to complete verification with the provider."}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
