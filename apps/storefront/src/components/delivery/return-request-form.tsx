import { useState, useRef } from "react"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { clsx } from "clsx"

interface ReturnableItem {
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
  photos?: File[]
}

interface ReturnRequestFormProps {
  orderId: string
  items: ReturnableItem[]
  reasons: string[]
  onSubmit: (data: ReturnRequestData) => void
  onCancel: () => void
  locale: string
  className?: string
}

export function ReturnRequestForm({
  orderId,
  items,
  reasons,
  onSubmit,
  onCancel,
  locale,
  className,
}: ReturnRequestFormProps) {
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { quantity: number; reason: string }>
  >({})
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [refundPreference, setRefundPreference] = useState<"original" | "store-credit">("original")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: { quantity: maxQty, reason: reasons[0] || "" } }
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity },
    }))
  }

  const updateReason = (itemId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) return
    setIsSubmitting(true)
    try {
      onSubmit({
        items: Object.entries(selectedItems).map(([itemId, data]) => ({
          itemId,
          quantity: data.quantity,
          reason: data.reason,
        })),
        notes: notes || undefined,
        preferRefund: refundPreference,
        photos: photos.length > 0 ? photos : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasSelectedItems = Object.keys(selectedItems).length > 0

  return (
    <div className={clsx("bg-ds-background rounded-xl border border-ds-border overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "delivery.return_request")}
        </h3>
        <p className="text-sm text-ds-muted-foreground mt-1">
          {t(locale, "delivery.select_items_to_return")}
        </p>
      </div>

      <div className="divide-y divide-ds-border">
        {items.map((item) => {
          const isSelected = !!selectedItems[item.id]
          const selectedData = selectedItems[item.id]

          return (
            <div key={item.id} className="p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => toggleItem(item.id, item.maxReturnQuantity)}
                  className={clsx(
                    "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1",
                    isSelected
                      ? "bg-ds-primary border-ds-foreground"
                      : "border-ds-border hover:border-ds-foreground"
                  )}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-ds-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="w-16 h-16 rounded-lg bg-ds-muted overflow-hidden flex-shrink-0">
                  {item.thumbnail ? (
                    <img loading="lazy" src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs">
                      No img
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-ds-foreground">{item.title}</h4>
                    <p className="text-sm font-medium text-ds-foreground flex-shrink-0">
                      {formatCurrency((item.price.amount ?? 0), item.price.currency, locale as SupportedLocale)}
                    </p>
                  </div>
                  <p className="text-sm text-ds-muted-foreground">Qty: {item.quantity}</p>

                  {isSelected && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-sm">{t(locale, "delivery.return_reason")}</Label>
                        <select
                          value={selectedData.reason}
                          onChange={(e) => updateReason(item.id, e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-ds-border bg-ds-background px-3 py-2 text-sm text-ds-foreground"
                        >
                          {reasons.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>

                      {item.maxReturnQuantity > 1 && (
                        <div>
                          <Label className="text-sm">Qty to return</Label>
                          <select
                            value={selectedData.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="mt-1 block w-full max-w-[100px] rounded-lg border border-ds-border bg-ds-background px-3 py-2 text-sm text-ds-foreground"
                          >
                            {Array.from({ length: item.maxReturnQuantity }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasSelectedItems && (
        <div className="p-6 border-t border-ds-border space-y-4">
          <div>
            <Label className="text-sm font-medium">{t(locale, "delivery.return_notes")}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(locale, "delivery.return_notes_placeholder")}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-ds-border bg-ds-background px-3 py-2 text-sm text-ds-foreground placeholder:text-ds-muted-foreground resize-none"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">{t(locale, "delivery.upload_photos")}</Label>
            <p className="text-xs text-ds-muted-foreground mt-0.5 mb-2">
              {t(locale, "delivery.upload_photos_desc")}
            </p>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-16 h-16 rounded-lg bg-ds-muted overflow-hidden">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Return photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-0.5 end-0.5 w-4 h-4 rounded-full bg-ds-destructive text-ds-destructive-foreground flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-ds-border flex items-center justify-center text-ds-muted-foreground hover:border-ds-foreground hover:text-ds-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">{t(locale, "delivery.refund_preference")}</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-ds-border cursor-pointer hover:bg-ds-muted transition-colors">
                <input
                  type="radio"
                  name="refundPreference"
                  value="original"
                  checked={refundPreference === "original"}
                  onChange={() => setRefundPreference("original")}
                  className="accent-ds-primary"
                />
                <span className="text-sm text-ds-foreground">
                  {t(locale, "delivery.refund_original")}
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-ds-border cursor-pointer hover:bg-ds-muted transition-colors">
                <input
                  type="radio"
                  name="refundPreference"
                  value="store-credit"
                  checked={refundPreference === "store-credit"}
                  onChange={() => setRefundPreference("store-credit")}
                  className="accent-ds-primary"
                />
                <span className="text-sm text-ds-foreground">
                  {t(locale, "delivery.refund_store_credit")}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-t border-ds-border flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          {t(locale, "common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!hasSelectedItems || isSubmitting}
        >
          {isSubmitting ? t(locale, "common.loading") : t(locale, "delivery.submit_return")}
        </Button>
      </div>
    </div>
  )
}
