import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface InstallmentScheduleEntry {
  number: number
  dueDate: string
  amount: number
  status: "paid" | "upcoming" | "overdue" | "cancelled"
  paidDate?: string
}

interface InstallmentScheduleProps {
  entries: InstallmentScheduleEntry[]
  currency?: string
  locale?: string
  loading?: boolean
}

const entryStatusConfig: Record<string, { color: string; icon: string }> = {
  paid: { color: "bg-ds-success/10 text-ds-success", icon: "✓" },
  upcoming: { color: "bg-ds-warning/10 text-ds-warning", icon: "○" },
  overdue: { color: "bg-ds-destructive/10 text-ds-destructive", icon: "!" },
  cancelled: { color: "bg-ds-muted text-ds-muted-foreground", icon: "✗" },
}

export function InstallmentSchedule({
  entries,
  currency = "USD",
  locale: localeProp,
  loading = false,
}: InstallmentScheduleProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const loc = locale as SupportedLocale

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!entries.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border p-8 text-center">
        <p className="text-ds-muted-foreground">{t(locale, "installments.no_schedule")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-ds-foreground">{t(locale, "installments.schedule")}</h4>
      <div className="space-y-2">
        {entries.map((entry) => {
          const config = entryStatusConfig[entry.status] || entryStatusConfig.upcoming

          return (
            <div
              key={entry.number}
              className="flex items-center gap-3 p-3 bg-ds-background rounded-lg border border-ds-border"
            >
              <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0", config.color)}>
                {config.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ds-foreground">
                  {t(locale, "installments.payment_number")} #{entry.number}
                </p>
                <p className="text-xs text-ds-muted-foreground">
                  {t(locale, "installments.due_date")}: {new Date(entry.dueDate!).toLocaleDateString()}
                  {entry.paidDate && (
                    <span className="ms-2">· {t(locale, "installments.paid_on")}: {new Date(entry.paidDate!).toLocaleDateString()}</span>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-semibold text-ds-foreground">
                  {formatCurrency((entry.amount ?? 0), currency, loc)}
                </span>
                <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", config.color)}>
                  {t(locale, `installments.${entry.status}`)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
