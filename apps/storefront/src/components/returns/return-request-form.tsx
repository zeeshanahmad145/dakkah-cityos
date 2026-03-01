import { useState } from "react"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface ReturnableItemInfo {
  id: string
  title: string
  thumbnail?: string
  quantity: number
  maxReturnQuantity: number
  price: { amount: number; currency: string }
}

interface ReturnRequestData {
  items: { itemId: string; quantity: number; reason: string }[]
  notes?: string
  preferRefund?: "original" | "store-credit"
}

interface ReturnRequestFormProps {
  orderId: string
  items: ReturnableItemInfo[]
  reasons: string[]
  onSubmit: (data: ReturnRequestData) => void
  onCancel: () => void
  locale?: string
  className?: string
}

export function ReturnRequestForm({
  orderId,
  items,
  reasons,
  onSubmit,
  onCancel,
  locale: localeProp,
  className,
}: ReturnRequestFormProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [step, setStep] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string }>>({})
  const [notes, setNotes] = useState("")
  const [refundMethod, setRefundMethod] = useState<"original" | "store-credit">("original")

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      const item = items.find((i) => i.id === itemId)
      return { ...prev, [itemId]: { quantity: item?.maxReturnQuantity || 1, reason: reasons[0] || "" } }
    })
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity },
    }))
  }

  const updateItemReason = (itemId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }))
  }

  const handleSubmit = () => {
    const data: ReturnRequestData = {
      items: Object.entries(selectedItems).map(([itemId, { quantity, reason }]) => ({
        itemId,
        quantity,
        reason,
      })),
      notes: notes || undefined,
      preferRefund: refundMethod,
    }
    onSubmit(data)
  }

  const hasSelection = Object.keys(selectedItems).length > 0

  return (
    <div className={clsx("bg-ds-card border border-ds-border rounded-xl overflow-hidden", className)}>
      <div className="p-6 border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "returns.request_title")}
        </h3>
        <p className="text-sm text-ds-muted-foreground mt-1">
          {t(locale, "returns.order_id")}: {orderId}
        </p>

        <div className="flex items-center gap-2 mt-4">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                s <= step ? "bg-ds-primary text-ds-primary-foreground" : "bg-ds-muted text-ds-muted-foreground"
              )}>
                {s + 1}
              </div>
              <span className={clsx("text-xs", s <= step ? "text-ds-foreground" : "text-ds-muted-foreground")}>
                {t(locale, `returns.step_${s + 1}`)}
              </span>
              {s < 2 && <div className={clsx("flex-1 h-px", s < step ? "bg-ds-primary" : "bg-ds-border")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-ds-foreground mb-3">
              {t(locale, "returns.select_items")}
            </p>
            {items.map((item) => {
              const isSelected = !!selectedItems[item.id]
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "rounded-lg border p-3 transition-all cursor-pointer",
                    isSelected ? "border-ds-primary bg-ds-primary/5" : "border-ds-border bg-ds-background hover:border-ds-foreground"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                      isSelected ? "bg-ds-primary border-ds-primary" : "border-ds-border"
                    )}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-ds-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {item.thumbnail && (
                      <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ds-foreground">{item.title}</p>
                      <p className="text-xs text-ds-muted-foreground">
                        {formatCurrency((item.price.amount ?? 0), item.price.currency, locale as SupportedLocale)}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 ps-8 space-y-2" role="group" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-ds-muted-foreground">{t(locale, "returns.quantity")}:</label>
                        <select
                          value={selectedItems[item.id].quantity}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                          className="px-2 py-1 text-xs rounded bg-ds-background text-ds-foreground border border-ds-border"
                        >
                          {Array.from({ length: item.maxReturnQuantity }, (_, i) => i + 1).map((q) => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-ds-muted-foreground block mb-1">{t(locale, "returns.reason")}:</label>
                        <select
                          value={selectedItems[item.id].reason}
                          onChange={(e) => updateItemReason(item.id, e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded bg-ds-background text-ds-foreground border border-ds-border"
                        >
                          {reasons.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ds-foreground block mb-2">
                {t(locale, "returns.additional_notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(locale, "returns.notes_placeholder")}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg bg-ds-background text-ds-foreground border border-ds-border focus:outline-none focus:ring-2 focus:ring-ds-primary resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-ds-foreground">
              {t(locale, "returns.refund_method")}
            </p>
            {(["original", "store-credit"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setRefundMethod(method)}
                className={clsx(
                  "w-full text-start rounded-lg border p-4 transition-all",
                  refundMethod === method
                    ? "border-ds-primary bg-ds-primary/5 ring-2 ring-ds-primary"
                    : "border-ds-border bg-ds-background hover:border-ds-foreground"
                )}
              >
                <span className="font-medium text-sm text-ds-foreground">
                  {t(locale, `returns.refund_${method.replace("-", "_")}`)}
                </span>
                <p className="text-xs text-ds-muted-foreground mt-0.5">
                  {t(locale, `returns.refund_${method.replace("-", "_")}_desc`)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-ds-border flex items-center justify-between gap-3">
        <button
          onClick={step > 0 ? () => setStep(step - 1) : onCancel}
          className="px-4 py-2 text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors"
        >
          {step > 0 ? t(locale, "common.back") : t(locale, "common.cancel")}
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && !hasSelection}
            className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t(locale, "common.next")}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            {t(locale, "returns.submit")}
          </button>
        )}
      </div>
    </div>
  )
}
