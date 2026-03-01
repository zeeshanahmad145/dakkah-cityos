import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { clsx } from "clsx"

interface ReturnableItem {
  id: string
  title: string
  thumbnail?: string
  quantity: number
  maxReturnQuantity: number
  price: { amount: number; currency: string }
}

interface ExchangeOption {
  id: string
  title: string
  variant: string
  thumbnail?: string
  priceDifference?: { amount: number; currency: string }
  available: boolean
}

interface ExchangeSelectorProps {
  originalItem: ReturnableItem
  exchangeOptions: ExchangeOption[]
  selectedOptionId?: string
  onSelect: (optionId: string) => void
  locale: string
  className?: string
}

export function ExchangeSelector({
  originalItem,
  exchangeOptions,
  selectedOptionId,
  onSelect,
  locale,
  className,
}: ExchangeSelectorProps) {
  if (!exchangeOptions.length) {
    return (
      <div className={clsx("bg-ds-muted rounded-lg p-8 text-center", className)}>
        <p className="text-ds-muted-foreground">{t(locale, "delivery.no_exchange_options")}</p>
      </div>
    )
  }

  return (
    <div className={clsx("bg-ds-background rounded-xl border border-ds-border overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "delivery.select_exchange")}
        </h3>
      </div>

      <div className="p-6 border-b border-ds-border">
        <p className="text-xs font-medium text-ds-muted-foreground uppercase tracking-wider mb-2">
          {t(locale, "delivery.original_item")}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
            {originalItem.thumbnail ? (
              <img loading="lazy" src={originalItem.thumbnail} alt={originalItem.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs">
                No img
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ds-foreground truncate">{originalItem.title}</p>
            <p className="text-sm text-ds-muted-foreground">
              {formatCurrency((originalItem.price.amount ?? 0), originalItem.price.currency, locale as SupportedLocale)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-medium text-ds-muted-foreground uppercase tracking-wider mb-3">
          {t(locale, "delivery.exchange_for")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exchangeOptions.map((option) => {
            const isSelected = selectedOptionId === option.id

            return (
              <button
                key={option.id}
                onClick={() => option.available && onSelect(option.id)}
                disabled={!option.available}
                className={clsx(
                  "text-start rounded-lg border p-3 transition-all",
                  isSelected
                    ? "border-ds-foreground bg-ds-primary/5 ring-2 ring-ds-primary"
                    : "border-ds-border bg-ds-background hover:border-ds-foreground",
                  !option.available && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
                    {option.thumbnail ? (
                      <img loading="lazy" src={option.thumbnail} alt={option.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ds-foreground text-sm truncate">{option.title}</p>
                    <p className="text-xs text-ds-muted-foreground">{option.variant}</p>

                    {option.priceDifference && option.priceDifference.amount !== 0 && (
                      <p
                        className={clsx(
                          "text-xs font-medium mt-1",
                          option.priceDifference.amount > 0 ? "text-ds-destructive" : "text-ds-success"
                        )}
                      >
                        {option.priceDifference.amount > 0 ? "+" : ""}
                        {formatCurrency(
                          option.priceDifference.amount,
                          option.priceDifference.currency,
                          locale as SupportedLocale
                        )}
                      </p>
                    )}

                    {!option.available && (
                      <span className="inline-block mt-1 text-xs text-ds-muted-foreground">
                        {t(locale, "delivery.unavailable")}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-ds-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-ds-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
