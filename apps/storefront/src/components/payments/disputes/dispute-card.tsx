import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"
import { clsx } from "clsx"

interface DisputeInfo {
  id: string
  orderId: string
  reason: string
  description: string
  status: "open" | "under_review" | "resolved" | "rejected" | "escalated"
  createdAt: string
  updatedAt: string
  amount: number
  currency: string
  resolution?: string
}

interface DisputeCardProps {
  dispute: DisputeInfo
  onViewDetails?: (disputeId: string) => void
  locale?: string
}

const statusConfig: Record<string, { color: string; icon: string }> = {
  open: { color: "bg-ds-warning/10 text-ds-warning", icon: "●" },
  under_review: { color: "bg-ds-accent/10 text-ds-accent", icon: "◎" },
  resolved: { color: "bg-ds-success/10 text-ds-success", icon: "✓" },
  rejected: { color: "bg-ds-destructive/10 text-ds-destructive", icon: "✗" },
  escalated: { color: "bg-ds-destructive/10 text-ds-destructive", icon: "⚠" },
}

export function DisputeCard({
  dispute,
  onViewDetails,
  locale: localeProp,
}: DisputeCardProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const loc = locale as SupportedLocale
  const config = statusConfig[dispute.status] || statusConfig.open

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ds-muted-foreground">
            {t(locale, "disputes.order")} #{dispute.orderId}
          </p>
          <p className="text-lg font-semibold text-ds-foreground mt-1">{dispute.reason}</p>
        </div>
        <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", config.color)}>
          <span>{config.icon}</span>
          {t(locale, `disputes.${dispute.status}`)}
        </span>
      </div>

      <p className="text-sm text-ds-muted-foreground line-clamp-2">{dispute.description}</p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-ds-muted-foreground">{t(locale, "disputes.amount")}: </span>
            <span className="font-semibold text-ds-foreground">
              {formatCurrency((dispute.amount ?? 0), dispute.currency, loc)}
            </span>
          </div>
          <span className="text-xs text-ds-muted-foreground">
            {new Date(dispute.createdAt!).toLocaleDateString()}
          </span>
        </div>
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(dispute.id)}
            className="text-sm font-medium text-ds-primary hover:underline"
          >
            {t(locale, "disputes.view_details")}
          </button>
        )}
      </div>

      {dispute.resolution && (
        <div className="bg-ds-success/10 rounded-lg px-4 py-3">
          <p className="text-xs text-ds-muted-foreground mb-1">{t(locale, "disputes.resolution")}</p>
          <p className="text-sm text-ds-foreground">{dispute.resolution}</p>
        </div>
      )}
    </div>
  )
}
