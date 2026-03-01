import { t, formatNumber, formatDate, type SupportedLocale } from "../../lib/i18n"
import { useTenant } from "../../lib/context/tenant-context"
import type { PointsHistoryProps } from "@cityos/design-system"

const typeColors: Record<string, string> = {
  earned: "text-ds-success",
  redeemed: "text-ds-primary",
  expired: "text-ds-destructive",
}

const typeIcons: Record<string, string> = {
  earned: "+",
  redeemed: "-",
  expired: "-",
}

export function PointsHistory({
  activities,
  hasMore,
  onLoadMore,
  locale: localeProp,
  className,
}: PointsHistoryProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"

  return (
    <div className={`bg-ds-background border border-ds-border rounded-lg p-4 md:p-6 ${className || ""}`}>
      <h3 className="font-semibold text-ds-foreground mb-4">
        {t(locale, "loyalty.points_history")}
      </h3>

      {activities.length === 0 ? (
        <p className="text-sm text-ds-muted-foreground text-center py-6">
          {t(locale, "loyalty.no_activity")}
        </p>
      ) : (
        <div className="space-y-0 divide-y divide-ds-border">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  activity.type === "earned"
                    ? "bg-ds-success/10 text-ds-success"
                    : activity.type === "redeemed"
                      ? "bg-ds-primary/10 text-ds-primary"
                      : "bg-ds-destructive/10 text-ds-destructive"
                }`}>
                  {typeIcons[activity.type]}
                </div>
                <div>
                  <p className="text-sm text-ds-foreground">{activity.description}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {formatDate(activity.date, locale as SupportedLocale)}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${typeColors[activity.type] || "text-ds-foreground"}`}>
                {typeIcons[activity.type]}{formatNumber(activity.points, locale as SupportedLocale)}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full mt-4 py-2 text-sm font-medium text-ds-primary hover:text-ds-primary/80 transition-colors"
        >
          {t(locale, "loyalty.load_more")}
        </button>
      )}
    </div>
  )
}
