import { Link } from "@tanstack/react-router"
import { useTenantPrefix, useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { useParams } from "@tanstack/react-router"
import type { POI } from "@/lib/hooks/use-content"

interface POICardComponentProps {
  poi: POI
  variant?: "default" | "compact" | "map-popup"
  locale?: string
}

function StarRating({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-3.5 w-3.5 ${star <= Math.round(average) ? "text-ds-warning" : "text-ds-muted"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-ds-muted-foreground">({count})</span>
    </div>
  )
}

export function POICardComponent({
  poi,
  variant = "default",
  locale: localeProp,
}: POICardComponentProps) {
  const prefix = useTenantPrefix()
  const { locale: ctxLocale } = useTenant()
  const { locale: paramLocale } = useParams({ strict: false }) as {
    locale: string
  }
  const locale = localeProp || paramLocale || ctxLocale || "en"

  if (variant === "map-popup") {
    return (
      <div className="p-3 bg-ds-background rounded-lg min-w-[200px]">
        <h4 className="text-sm font-semibold text-ds-foreground mb-1">
          {poi.name}
        </h4>
        {poi.category && (
          <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-ds-muted text-ds-muted-foreground rounded mb-1">
            {poi.category}
          </span>
        )}
        <p className="text-xs text-ds-muted-foreground mb-1">{poi.address}</p>
        {poi.rating && (
          <StarRating average={poi.rating.average} count={poi.rating.count} />
        )}
        <Link
          to={`${prefix}/places/${poi.id}` as never}
          className="text-xs text-ds-primary mt-1 block hover:underline"
        >
          {t(locale, "blocks.view_details")}
        </Link>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <Link
        to={`${prefix}/places/${poi.id}` as never}
        className="flex items-center gap-3 p-3 bg-ds-background rounded-lg border border-ds-border hover:border-ds-primary transition-colors"
      >
        {poi.thumbnail && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-ds-muted">
            <img
              loading="lazy"
              src={poi.thumbnail}
              alt={poi.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-ds-foreground">{poi.name}</h4>
          <p className="text-xs text-ds-muted-foreground truncate">
            {poi.address}
          </p>
        </div>
        {poi.rating && (
          <StarRating average={poi.rating.average} count={poi.rating.count} />
        )}
        {poi.distance && (
          <span className="text-xs text-ds-muted-foreground flex-shrink-0">
            {poi.distance}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      to={`${prefix}/places/${poi.id}` as never}
      className="group flex flex-col bg-ds-background rounded-lg border border-ds-border overflow-hidden hover:border-ds-primary transition-colors"
    >
      {poi.thumbnail && (
        <div className="aspect-video bg-ds-muted overflow-hidden relative">
          <img
            src={poi.thumbnail}
            alt={poi.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {poi.category && (
            <span className="absolute top-3 start-3 px-2 py-0.5 text-xs font-medium bg-ds-background/90 text-ds-foreground rounded">
              {poi.category}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-ds-foreground mb-1">
          {poi.name}
        </h3>
        <p className="text-sm text-ds-muted-foreground mb-2 flex items-start gap-1">
          <svg
            className="h-4 w-4 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-1">{poi.address}</span>
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {poi.rating && (
              <StarRating
                average={poi.rating.average}
                count={poi.rating.count}
              />
            )}
            {poi.distance && (
              <span className="text-xs text-ds-muted-foreground">
                {poi.distance}
              </span>
            )}
          </div>
        </div>
        {poi.phone && (
          <div className="mt-3 pt-3 border-t border-ds-border">
            <span className="text-sm text-ds-primary flex items-center gap-1">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {poi.phone}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
