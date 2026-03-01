import { useState } from "react"
import { useTenant } from "@/lib/context/tenant-context"
import { t } from "@/lib/i18n"
import { clsx } from "clsx"

interface Order {
  id: string
  display_id: string
  customer_name: string
  customer_email: string
  total: number
  currency?: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  created_at: string
}

interface ManageOrderListProps {
  orders?: Order[]
  locale?: string
}

const statusStyles: Record<string, string> = {
  pending: "bg-ds-warning/10 text-ds-warning",
  processing: "bg-ds-primary/10 text-ds-primary",
  shipped: "bg-ds-success/10 text-ds-success",
  delivered: "bg-ds-success/10 text-ds-success",
  cancelled: "bg-ds-destructive/10 text-ds-destructive",
}

export function ManageOrderList({ orders = [], locale: localeProp }: ManageOrderListProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              statusFilter === s
                ? "bg-ds-primary text-ds-primary-foreground"
                : "bg-ds-background border border-ds-border text-ds-muted hover:text-ds-text"
            )}
          >
            {s === "all" ? t(locale, "manage.all_statuses") : t(locale, `manage.${s}`)}
          </button>
        ))}
      </div>

      <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-background">
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.order_number")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.customer")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.total")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.status")}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.date")}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-ds-muted uppercase">{t(locale, "manage.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ds-muted">
                    {t(locale, "manage.no_orders")}
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-ds-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-ds-primary">#{order.display_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-ds-text">{order.customer_name}</p>
                        <p className="text-xs text-ds-muted">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ds-text">
                      {new Intl.NumberFormat(locale, { style: "currency", currency: order.currency || "USD" }).format(order.total / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("px-2 py-1 text-xs font-medium rounded-full", statusStyles[order.status])}>
                        {t(locale, `manage.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ds-muted">
                      {new Date(order.created_at!).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button type="button" className="p-1.5 text-ds-muted hover:text-ds-text hover:bg-ds-accent rounded transition-colors" title={t(locale, "manage.view")}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-ds-border text-xs text-ds-muted">
          {filtered.length} {t(locale, "manage.orders").toLowerCase()}
        </div>
      </div>
    </div>
  )
}
