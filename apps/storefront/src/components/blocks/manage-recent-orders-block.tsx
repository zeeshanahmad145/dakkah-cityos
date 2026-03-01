import React from "react"
import { t } from "@/lib/i18n"
import { useManageOrders } from "@/lib/hooks/use-manage-data"
import { SectionCard } from "@/components/manage/ui/section-card"
import { StatusBadge } from "@/components/manage/ui/status-badge"

interface ManageRecentOrdersBlockProps {
  heading?: string
  limit?: number
  showStatus?: boolean
  locale?: string
}

export const ManageRecentOrdersBlock: React.FC<
  ManageRecentOrdersBlockProps
> = ({ heading, limit = 5, showStatus = true, locale = "en" }) => {
  const { data, isLoading } = useManageOrders(limit, 0)
  const orders = (data as any)?.orders || []

  if (isLoading) {
    return (
      <section className="py-6">
        <SectionCard title={heading || t(locale, "manage.recent_orders")}>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-ds-muted rounded w-20" />
                <div className="h-4 bg-ds-muted rounded w-32 flex-1" />
                <div className="h-4 bg-ds-muted rounded w-16" />
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    )
  }

  return (
    <section className="py-6">
      <SectionCard title={heading || t(locale, "manage.recent_orders")}>
        {orders.length === 0 ? (
          <p className="text-sm text-ds-muted-foreground text-center py-8">
            {t(locale, "manage.no_orders")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ds-border">
                  <th className="text-start py-2 pe-4 font-medium text-ds-muted-foreground">
                    {t(locale, "manage.order_number")}
                  </th>
                  <th className="text-start py-2 pe-4 font-medium text-ds-muted-foreground">
                    {t(locale, "manage.customer")}
                  </th>
                  <th className="text-start py-2 pe-4 font-medium text-ds-muted-foreground">
                    {t(locale, "manage.total")}
                  </th>
                  {showStatus && (
                    <th className="text-start py-2 pe-4 font-medium text-ds-muted-foreground">
                      {t(locale, "manage.status")}
                    </th>
                  )}
                  <th className="text-start py-2 font-medium text-ds-muted-foreground">
                    {t(locale, "manage.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-ds-border last:border-b-0"
                  >
                    <td className="py-2.5 pe-4 text-ds-text font-medium">
                      #{order.display_id || order.id?.slice(-6)}
                    </td>
                    <td className="py-2.5 pe-4 text-ds-text">
                      {order.customer?.first_name
                        ? `${order.customer.first_name} ${order.customer.last_name || ""}`
                        : order.email || "—"}
                    </td>
                    <td className="py-2.5 pe-4 text-ds-text">
                      {order.total != null
                        ? `${(order.total / 100).toFixed(2)} ${order.currency_code?.toUpperCase() || ""}`
                        : "—"}
                    </td>
                    {showStatus && (
                      <td className="py-2.5 pe-4">
                        <StatusBadge status={order.status || "pending"} />
                      </td>
                    )}
                    <td className="py-2.5 text-ds-muted-foreground">
                      {order.created_at
                        ? new Date(order.created_at!).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </section>
  )
}
