import { Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useTenant, useTenantPrefix } from "@/lib/context/tenant-context"
import { FlashSaleCountdown } from "./flash-sale-countdown"

interface FlashSaleBannerProps {
  locale?: string
  title?: string
  endDate: string | Date
  backgroundGradient?: string
  ctaLink?: string
}

export function FlashSaleBanner({
  locale: localeProp,
  title,
  endDate,
  backgroundGradient,
  ctaLink,
}: FlashSaleBannerProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const prefix = useTenantPrefix()

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${backgroundGradient || "bg-gradient-to-r from-ds-destructive to-ds-warning"}`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 start-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 end-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative px-4 py-6 sm:px-8 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-start">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {title || t(locale, "flashSale.title")}
            </h2>
          </div>
          <p className="text-white/80 text-sm">
            {t(locale, "flashSale.hurry_up")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-white/80 text-xs uppercase tracking-wider font-medium">
            {t(locale, "flashSale.ends_in")}
          </p>
          <FlashSaleCountdown endDate={endDate} locale={locale} />
        </div>

        <Link
          to={ctaLink || `${prefix}/deals`}
          className="inline-flex items-center gap-2 bg-white text-ds-destructive font-bold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors text-sm"
        >
          {t(locale, "flashSale.shop_now")}
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
