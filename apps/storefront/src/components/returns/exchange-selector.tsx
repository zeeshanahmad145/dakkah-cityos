import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface ExchangeOptionInfo {
  id: string
  title: string
  variant: string
  thumbnail?: string
  priceDifference?: { amount: number; currency: string }
  available: boolean
}

interface ReturnableItemInfo {
  id: string
  title: string
  thumbnail?: string
  quantity: number
  maxReturnQuantity: number
  price: { amount: number; currency: string }
}

interface ExchangeSelectorProps {
  originalItem: ReturnableItemInfo
  exchangeOptions: ExchangeOptionInfo[]
  selectedOptionId?: string
  onSelect: (optionId: string) => void
  locale?: string
  className?: string
}

export function ExchangeSelector({
  originalItem,
  exchangeOptions,
  selectedOptionId,
  onSelect,
  locale: localeProp,
  className,
}: ExchangeSelectorProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="bg-ds-muted rounded-lg p-4">
        <p className="text-xs text-ds-muted-foreground mb-2">{t(locale, "returns.original_item")}</p>
        <div className="flex items-center gap-3">
          {originalItem.thumbnail && (
            <img loading="lazy" src={originalItem.thumbnail} alt={originalItem.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ds-foreground truncate">{originalItem.title}</p>
            <p className="text-xs text-ds-muted-foreground">
              {formatCurrency((originalItem.price.amount ?? 0), originalItem.price.currency, locale as SupportedLocale)}
            </p>
          </div>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-ds-foreground">
        {t(locale, "returns.select_exchange")}
      </h4>

      {!exchangeOptions.length ? (
        <div className="bg-ds-muted rounded-lg p-6 text-center">
          <p className="text-sm text-ds-muted-foreground">{t(locale, "returns.no_exchange_options")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exchangeOptions.map((option) => {
            const isSelected = selectedOptionId === option.id
            return (
              <button
                key={option.id}
                onClick={() => option.available && onSelect(option.id)}
                disabled={!option.available}
                className={clsx(
                  "w-full text-start rounded-lg border p-3 transition-all",
                  isSelected
                    ? "border-ds-primary bg-ds-primary/5 ring-2 ring-ds-primary"
                    : "border-ds-border bg-ds-background hover:border-ds-foreground",
                  !option.available && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {option.thumbnail && (
                    <img loading="lazy" src={option.thumbnail} alt={option.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ds-foreground">{option.title}</p>
                    <p className="text-xs text-ds-muted-foreground">{option.variant}</p>
                  </div>
                  {option.priceDifference && option.priceDifference.amount !== 0 && (
                    <span className={clsx(
                      "text-xs font-medium flex-shrink-0",
                      option.priceDifference.amount > 0 ? "text-ds-destructive" : "text-ds-success"
                    )}>
                      {option.priceDifference.amount > 0 ? "+" : ""}
                      {formatCurrency((option.priceDifference.amount ?? 0), option.priceDifference.currency, locale as SupportedLocale)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
