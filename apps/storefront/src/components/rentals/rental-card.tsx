import { t, formatCurrency } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/i18n"
import { Link } from "@tanstack/react-router"
import type { RentalItem } from "@/lib/hooks/use-rentals"

const conditionStyles: Record<string, string> = {
  new: "bg-ds-success/20 text-ds-success",
  "like-new": "bg-ds-primary/20 text-ds-primary",
  good: "bg-ds-warning/20 text-ds-warning",
  fair: "bg-ds-muted text-ds-muted-foreground",
}

const conditionKeys: Record<string, string> = {
  new: "rental.new",
  "like-new": "rental.like_new",
  good: "rental.good",
  fair: "rental.fair",
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${filled ? "text-ds-warning" : "text-ds-muted"}`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  )
}

export function RentalCard({
  rental,
  locale,
  prefix,
}: {
  rental: RentalItem
  locale: string
  prefix: string
}) {
  return (
    <div className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:border-ds-ring transition-colors">
      <Link to={`${prefix}/rentals/${rental.id}` as never} className="block">
        <div className="relative aspect-[4/3] bg-ds-muted overflow-hidden">
          {rental.thumbnail ? (
            <img
              src={rental.thumbnail}
              alt={rental.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-ds-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {rental.condition && (
            <span
              className={`absolute top-2 start-2 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                conditionStyles[rental.condition] || conditionStyles.good
              }`}
            >
              {t(locale, conditionKeys[rental.condition] || "rental.good")}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`${prefix}/rentals/${rental.id}` as never} className="block">
          <h3 className="font-semibold text-ds-foreground line-clamp-2 group-hover:text-ds-primary transition-colors">
            {rental.title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-bold text-ds-foreground">
            {formatCurrency(
              rental.pricePerDay.amount,
              rental.pricePerDay.currencyCode,
              locale as SupportedLocale,
            )}
          </span>
          <span className="text-sm text-ds-muted-foreground">
            {t(locale, "rental.per_day")}
          </span>
          {rental.pricePerWeek && (
            <span className="text-sm text-ds-muted-foreground">
              {formatCurrency(
                rental.pricePerWeek.amount,
                rental.pricePerWeek.currencyCode,
                locale as SupportedLocale,
              )}
              {t(locale, "rental.per_week")}
            </span>
          )}
        </div>

        {rental.rating && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= Math.round(rental.rating!.average)}
                />
              ))}
            </div>
            <span className="text-xs text-ds-muted-foreground">
              ({rental.rating.count})
            </span>
          </div>
        )}

        {rental.location && (
          <div className="flex items-center gap-1.5 text-sm text-ds-muted-foreground">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <span className="truncate">{rental.location}</span>
          </div>
        )}

        {rental.deposit && (
          <p className="text-xs text-ds-muted-foreground">
            {t(locale, "rental.deposit")}:{" "}
            {formatCurrency(
              rental.deposit.amount,
              rental.deposit.currencyCode,
              locale as SupportedLocale,
            )}
          </p>
        )}

        <Link
          to={`${prefix}/rentals/${rental.id}` as never}
          className="block w-full text-center px-4 py-2.5 text-sm font-medium rounded-lg bg-ds-primary text-ds-primary-foreground hover:bg-ds-primary/90 transition-colors"
        >
          {t(locale, "rental.rent_now")}
        </Link>
      </div>
    </div>
  )
}
