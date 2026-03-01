import { t } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface ReturnTrackingEvent {
  id: string
  status: string
  description: string
  timestamp: string
  completed: boolean
}

interface ReturnStatusProps {
  returnId: string
  status: "initiated" | "label-generated" | "shipped" | "received" | "inspected" | "refunded"
  events: ReturnTrackingEvent[]
  refundAmount?: { amount: number; currency: string }
  refundMethod?: string
  locale?: string
  className?: string
}

const statusSteps = [
  "initiated",
  "label-generated",
  "shipped",
  "received",
  "inspected",
  "refunded",
] as const

const statusI18n: Record<string, string> = {
  initiated: "returns.status_initiated",
  "label-generated": "returns.status_label_generated",
  shipped: "returns.status_shipped",
  received: "returns.status_received",
  inspected: "returns.status_inspected",
  refunded: "returns.status_refunded",
}

export function ReturnStatus({
  returnId,
  status,
  events,
  refundAmount,
  refundMethod,
  locale: localeProp,
  className,
}: ReturnStatusProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const currentIndex = statusSteps.indexOf(status)

  return (
    <div className={clsx("bg-ds-card border border-ds-border rounded-xl p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-ds-foreground">
            {t(locale, "returns.return_status")}
          </h3>
          <p className="text-xs text-ds-muted-foreground mt-0.5">
            {t(locale, "returns.return_id")}: {returnId}
          </p>
        </div>
        <span className={clsx(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          status === "refunded" ? "bg-ds-success/10 text-ds-success" : "bg-ds-primary/10 text-ds-primary"
        )}>
          {t(locale, statusI18n[status] || "returns.status_initiated")}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-8">
        {statusSteps.map((step, index) => (
          <div key={step} className="flex-1 flex items-center">
            <div className={clsx(
              "w-3 h-3 rounded-full flex-shrink-0",
              index <= currentIndex ? "bg-ds-primary" : "bg-ds-border"
            )} />
            {index < statusSteps.length - 1 && (
              <div className={clsx(
                "flex-1 h-0.5",
                index < currentIndex ? "bg-ds-primary" : "bg-ds-border"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statusSteps.map((step, index) => (
          <span
            key={step}
            className={clsx(
              "text-xs",
              index <= currentIndex ? "text-ds-foreground font-medium" : "text-ds-muted-foreground"
            )}
          >
            {t(locale, statusI18n[step])}
          </span>
        ))}
      </div>

      {events.length > 0 && (
        <div className="border-t border-ds-border pt-4">
          <h4 className="text-sm font-semibold text-ds-foreground mb-3">
            {t(locale, "returns.timeline")}
          </h4>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className={clsx(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  event.completed ? "bg-ds-success" : "bg-ds-border"
                )} />
                <div>
                  <p className="text-sm text-ds-foreground">{event.description}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(event.timestamp!).toLocaleString(locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {refundAmount && status === "refunded" && (
        <div className="border-t border-ds-border pt-4 mt-4">
          <div className="bg-ds-success/10 rounded-lg p-3">
            <p className="text-sm font-semibold text-ds-success">
              {t(locale, "returns.refund_issued")}: {refundAmount.currency} {refundAmount.amount.toFixed(2)}
            </p>
            {refundMethod && (
              <p className="text-xs text-ds-success/80 mt-0.5">
                {t(locale, "returns.via")} {refundMethod}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
