import { Link } from "@tanstack/react-router"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface OrderItem {
  title: string
  thumbnail?: string
  quantity: number
}

interface OrderCardProps {
  id: string
  displayId: string
  createdAt: string
  status: string
  total: number
  currencyCode: string
  items: OrderItem[]
}

export function OrderCard({
  id,
  displayId,
  createdAt,
  status,
  total,
  currencyCode,
  items,
}: OrderCardProps) {
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
      case "refunded":
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Link
      to={`${prefix}/account/orders/${id}` as never}
      className="block bg-ds-background rounded-xl border border-ds-border p-6 hover:border-ds-border hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-ds-foreground">Order #{displayId}</p>
          <p className="text-sm text-ds-muted-foreground">
            {formatDate(createdAt)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
          {items.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg bg-ds-muted border-2 border-white overflow-hidden"
            >
              {item.thumbnail ? (
                <img
                  loading="lazy"
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground text-xs">
                  No img
                </div>
              )}
            </div>
          ))}
          {items.length > 3 && (
            <div className="w-12 h-12 rounded-lg bg-ds-muted border-2 border-white flex items-center justify-center text-xs font-medium text-ds-muted-foreground">
              +{items.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm text-ds-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-ds-border">
        <span className="font-semibold text-ds-foreground">
          {formatPrice(total, currencyCode)}
        </span>
        <span className="text-sm text-ds-muted-foreground flex items-center gap-1">
          View details
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
