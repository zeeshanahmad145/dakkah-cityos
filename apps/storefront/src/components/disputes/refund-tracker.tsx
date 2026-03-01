// @ts-nocheck
import { t, formatCurrency } from "../../lib/i18n"

interface RefundTrackerProps {
  disputeId: string
  status: string
  amount: number
  currency: string
  locale: string
}

const STEPS = ["submitted", "reviewing", "approved", "refunded"] as const
const DENIED_STEP = "denied"

function getActiveStepIndex(status: string): number {
  if (status === DENIED_STEP) return 2
  const idx = STEPS.indexOf(status as (typeof STEPS)[number])
  return idx >= 0 ? idx : 0
}

export default function RefundTracker({
  disputeId,
  status,
  amount,
  currency,
  locale,
}: RefundTrackerProps) {
  const activeIndex = getActiveStepIndex(status)
  const isDenied = status === DENIED_STEP

  const steps = STEPS.map((step, index) => {
    if (index === 2 && isDenied) {
      return { key: DENIED_STEP, label: t(locale, "disputes.refund.denied") }
    }
    return { key: step, label: t(locale, `disputes.refund.${step}`) }
  })

  return (
    <div className="bg-ds-card rounded-xl border border-ds-border p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ds-foreground">
            {t(locale, "disputes.refund.title")}
          </h3>
          <p className="text-sm text-ds-muted-foreground mt-1">
            {t(locale, "disputes.dispute")} #{disputeId}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-ds-foreground">
            {formatCurrency(amount, currency, locale as import("@/lib/i18n").SupportedLocale)}
          </p>
          <p className="text-xs text-ds-muted-foreground">{currency}</p>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < activeIndex
            const isActive = index === activeIndex
            const isUpcoming = index > activeIndex
            const isDeniedStep = step.key === DENIED_STEP && isDenied

            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1 relative"
              >
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-4 start-1/2 w-full h-0.5 ${
                      isCompleted ? "bg-ds-success" : "bg-ds-border"
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDeniedStep
                      ? "bg-ds-destructive text-white"
                      : isCompleted
                        ? "bg-ds-success text-white"
                        : isActive
                          ? "bg-ds-primary text-white"
                          : "bg-ds-muted text-ds-muted-foreground"
                  }`}
                >
                  {isDeniedStep
                    ? "✗"
                    : isCompleted
                      ? "✓"
                      : index + 1}
                </div>

                <span
                  className={`text-xs mt-2 text-center ${
                    isDeniedStep
                      ? "text-ds-destructive font-medium"
                      : isActive
                        ? "text-ds-primary font-medium"
                        : isCompleted
                          ? "text-ds-success"
                          : "text-ds-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {!isDenied && status !== "refunded" && (
        <div className="bg-ds-surface rounded-lg px-4 py-3">
          <p className="text-xs text-ds-muted-foreground">
            {t(locale, "disputes.refund.estimated_timeline")}
          </p>
          <p className="text-sm text-ds-foreground mt-1">
            {t(locale, "disputes.refund.timeline_info")}
          </p>
        </div>
      )}

      {isDenied && (
        <div className="bg-ds-destructive/10 rounded-lg px-4 py-3">
          <p className="text-xs text-ds-muted-foreground">
            {t(locale, "disputes.refund.denied_info")}
          </p>
        </div>
      )}

      {status === "refunded" && (
        <div className="bg-ds-success/10 rounded-lg px-4 py-3">
          <p className="text-sm text-ds-success font-medium">
            {t(locale, "disputes.refund.completed")}
          </p>
        </div>
      )}
    </div>
  )
}
