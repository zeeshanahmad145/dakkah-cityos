import { Link } from "@tanstack/react-router"
import { formatPrice } from "@/lib/utils/price"
import { cn } from "@/lib/utils/cn"
import { ChevronRight } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface CompanyOrder {
  id: string
  display_id: string
  status: string
  total: number
  currency_code: string
  created_at: string
  ordered_by: string
  item_count: number
}

interface CompanyOrdersProps {
  orders: CompanyOrder[]
}

export function CompanyOrders({ orders }: CompanyOrdersProps) {
  const prefix = useTenantPrefix()
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-ds-success text-ds-success"
      case "pending":
      case "processing":
        return "bg-ds-warning text-ds-warning"
      case "shipped":
        return "bg-ds-info text-ds-info"
      case "cancelled":
        return "bg-ds-destructive text-ds-destructive"
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (orders.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
        <p className="text-ds-muted-foreground">No company orders yet</p>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ds-muted border-b border-ds-border">
            <tr>
              <th className="px-6 py-3 text-start text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-start text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                Ordered By
              </th>
              <th className="px-6 py-3 text-start text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-start text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-end text-xs font-semibold text-ds-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ds-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-ds-muted">
                <td className="px-6 py-4">
                  <p className="font-medium text-ds-foreground">
                    #{order.display_id}
                  </p>
                  <p className="text-sm text-ds-muted-foreground">
                    {order.item_count} items
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-ds-muted-foreground">
                  {order.ordered_by}
                </td>
                <td className="px-6 py-4 text-sm text-ds-muted-foreground">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium capitalize",
                      getStatusColor(order.status),
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-end font-medium text-ds-foreground">
                  {formatPrice(order.total, order.currency_code)}
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`${prefix}/account/orders/${order.id}` as never}
                    className="text-ds-muted-foreground hover:text-ds-muted-foreground"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
