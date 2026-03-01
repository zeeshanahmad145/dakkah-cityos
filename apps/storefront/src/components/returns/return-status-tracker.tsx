import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface ReturnTrackingEvent {
  id: string
  status: string
  description: string
  timestamp: string
  completed: boolean
}

interface ReturnStatusTrackerProps {
  returnId: string
  status: "initiated" | "label-generated" | "shipped" | "received" | "inspected" | "refunded"
  events: ReturnTrackingEvent[]
  refundAmount?: { amount: number; currency: string }
  refundMethod?: string
  locale?: string
  className?: string
}

const statusSteps = [
  { key: "initiated", icon: "📋", i18nKey: "returns.status_initiated" },
  { key: "label-generated", icon: "🏷️", i18nKey: "returns.status_label_generated" },
  { key: "shipped", icon: "📦", i18nKey: "returns.status_shipped" },
  { key: "received", icon: "📥", i18nKey: "returns.status_received" },
  { key: "inspected", icon: "🔍", i18nKey: "returns.status_inspected" },
  { key: "refunded", icon: "💰", i18nKey: "returns.status_refunded" },
]

export function ReturnStatusTracker({
  returnId,
  status,
  events,
  refundAmount,
  refundMethod,
  locale: localeProp,
  className,
}: ReturnStatusTrackerProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const currentIndex = statusSteps.findIndex((s) => s.key === status)

  return (
    <div className={clsx("bg-ds-card border border-ds-border rounded-xl overflow-hidden", className)}>
      <div className="p-6 border-b border-ds-border">
        <h3 className="text-lg font-semibold text-ds-foreground">
          {t(locale, "returns.return_status")}
        </h3>
        <p className="text-sm text-ds-muted-foreground mt-0.5">
          {t(locale, "returns.return_id")}: {returnId}
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentIndex
            const isCurrent = index === currentIndex
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                    isCurrent && "ring-2 ring-ds-primary ring-offset-2 ring-offset-ds-background",
                    isCompleted ? "bg-ds-success text-white" : "bg-ds-muted text-ds-muted-foreground"
                  )}>
                    {step.icon}
                  </div>
                  <span className={clsx(
                    "text-[10px] mt-1 text-center whitespace-nowrap",
                    isCompleted ? "text-ds-foreground font-medium" : "text-ds-muted-foreground"
                  )}>
                    {t(locale, step.i18nKey)}
                  </span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={clsx(
                    "flex-1 h-0.5 mx-1",
                    index < currentIndex ? "bg-ds-success" : "bg-ds-border"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {events.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ds-foreground">{t(locale, "returns.timeline")}</h4>
            {events.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className={clsx(
                  "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                  event.completed ? "bg-ds-success" : "bg-ds-border"
                )} />
                <div>
                  <p className="text-sm text-ds-foreground">{event.description}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(event.timestamp!).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {refundAmount && status === "refunded" && (
          <div className="mt-6 p-4 bg-ds-success/10 rounded-lg">
            <p className="text-sm text-ds-success font-medium">
              {t(locale, "returns.refund_issued")}
            </p>
            <p className="text-lg font-bold text-ds-foreground mt-1">
              {formatCurrency((refundAmount.amount ?? 0), refundAmount.currency, locale as SupportedLocale)}
            </p>
            {refundMethod && (
              <p className="text-xs text-ds-muted-foreground mt-0.5">
                {t(locale, "returns.via")} {refundMethod}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
