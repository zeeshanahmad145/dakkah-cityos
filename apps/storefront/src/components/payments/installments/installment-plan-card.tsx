import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface InstallmentPlanInfo {
  id: string
  installments: number
  monthlyAmount: number
  totalAmount: number
  currency: string
  interestRate: number
  processingFee?: number
  firstPaymentDate?: string
  status?: "active" | "completed" | "overdue" | "cancelled"
}

interface InstallmentPlanCardProps {
  plan: InstallmentPlanInfo
  currency?: string
  onViewDetails?: (planId: string) => void
  locale?: string
}

const statusConfig: Record<string, { color: string; icon: string }> = {
  active: { color: "bg-ds-success/10 text-ds-success", icon: "●" },
  completed: { color: "bg-ds-accent/10 text-ds-accent", icon: "✓" },
  overdue: { color: "bg-ds-destructive/10 text-ds-destructive", icon: "!" },
  cancelled: { color: "bg-ds-muted text-ds-muted-foreground", icon: "✗" },
}

export function InstallmentPlanCard({
  plan,
  currency = "USD",
  onViewDetails,
  locale: localeProp,
}: InstallmentPlanCardProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const loc = locale as SupportedLocale
  const cur = plan.currency || currency
  const config = statusConfig[plan.status || "active"] || statusConfig.active

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ds-muted-foreground">{t(locale, "installments.plan")}</p>
          <p className="text-xl font-bold text-ds-foreground">
            {plan.installments}x {formatCurrency((plan.monthlyAmount ?? 0), cur, loc)}
          </p>
        </div>
        {plan.status && (
          <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", config.color)}>
            <span>{config.icon}</span>
            {t(locale, `installments.${plan.status}`)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-ds-muted rounded-lg p-3">
          <p className="text-xs text-ds-muted-foreground mb-1">{t(locale, "installments.total_cost")}</p>
          <p className="font-semibold text-ds-foreground">{formatCurrency((plan.totalAmount ?? 0), cur, loc)}</p>
        </div>
        <div className="bg-ds-muted rounded-lg p-3">
          <p className="text-xs text-ds-muted-foreground mb-1">{t(locale, "installments.interest_rate")}</p>
          <p className="font-semibold text-ds-foreground">
            {plan.interestRate === 0 ? t(locale, "installments.no_interest") : `${plan.interestRate}%`}
          </p>
        </div>
      </div>

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(plan.id)}
          className="w-full py-2.5 text-sm font-medium text-ds-primary bg-ds-primary/5 border border-ds-primary/20 rounded-lg hover:bg-ds-primary/10 transition-colors"
        >
          {t(locale, "installments.view_schedule")}
        </button>
      )}
    </div>
  )
}
