import { useState } from "react"
import { t, formatCurrency, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { GiftCardAmountSelectorProps } from "@cityos/design-system"

export function GiftCardAmountSelector({
  presetAmounts,
  selectedAmount,
  customAmount,
  currencyCode = "USD",
  minAmount = 5,
  maxAmount = 1000,
  onAmountChange,
  locale: localeProp,
  className,
}: GiftCardAmountSelectorProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [isCustom, setIsCustom] = useState(
    selectedAmount !== undefined && !presetAmounts.includes(selectedAmount)
  )
  const [customValue, setCustomValue] = useState(customAmount?.toString() || "")

  const handlePresetClick = (amount: number) => {
    setIsCustom(false)
    setCustomValue("")
    onAmountChange(amount)
  }

  const handleCustomChange = (value: string) => {
    setCustomValue(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num >= minAmount && num <= maxAmount) {
      onAmountChange(num)
    }
  }

  const handleCustomFocus = () => {
    setIsCustom(true)
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-ds-foreground mb-3">
        {t(locale, "giftCards.select_amount")}
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {presetAmounts.map((amount: any) => (
          <button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
              selectedAmount === amount && !isCustom
                ? "bg-ds-primary text-ds-primary-foreground"
                : "bg-ds-muted text-ds-foreground hover:bg-ds-muted/80"
            }`}
          >
            {formatCurrency(amount, currencyCode, locale as SupportedLocale)}
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm text-ds-muted-foreground block mb-1.5">
          {t(locale, "giftCards.custom_amount")}
        </label>
        <input
          type="number"
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          onFocus={handleCustomFocus}
          placeholder={`${minAmount} - ${maxAmount}`}
          min={minAmount}
          max={maxAmount}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-ds-foreground bg-ds-background transition-all ${
            isCustom ? "border-ds-primary ring-2 ring-ds-primary/20" : "border-ds-border"
          }`}
        />
      </div>
    </div>
  )
}
