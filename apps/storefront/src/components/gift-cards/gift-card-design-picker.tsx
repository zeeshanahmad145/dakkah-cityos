import { t } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { GiftCardDesignPickerProps } from "@cityos/design-system"

const categoryIcons: Record<string, string> = {
  birthday: "🎂",
  holiday: "🎄",
  "thank-you": "🙏",
  celebration: "🎉",
  general: "🎁",
}

export function GiftCardDesignPicker({
  designs,
  selectedDesignId,
  onSelect,
  locale: localeProp,
  className,
}: GiftCardDesignPickerProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-ds-foreground mb-3">
        {t(locale, "giftCards.choose_design")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {designs.map((design: any) => (
          <button
            key={design.id}
            type="button"
            onClick={() => onSelect(design.id)}
            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[3/2] ${
              selectedDesignId === design.id
                ? "border-ds-primary ring-2 ring-ds-primary/20"
                : "border-ds-border hover:border-ds-primary/50"
            }`}
          >
            {design.imageUrl ? (
              <img
                src={design.imageUrl}
                alt={design.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-1"
                style={{
                  background: `linear-gradient(135deg, ${design.colors.primary}, ${design.colors.secondary})`,
                }}
              >
                <span className="text-2xl">
                  {categoryIcons[design.category] || "🎁"}
                </span>
                <span className="text-xs font-medium text-white/90">
                  {design.name}
                </span>
              </div>
            )}
            {selectedDesignId === design.id && (
              <div className="absolute top-1 end-1 w-5 h-5 bg-ds-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-ds-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
