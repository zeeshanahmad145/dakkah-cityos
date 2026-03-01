import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight, ShoppingBag } from "@medusajs/icons"

interface Order {
  id: string
  display_id: number | undefined
  created_at: string
  status: string
  total: number
  currency_code: string
  items: Array<{
    id: string
    title: string
    thumbnail?: string
    quantity: number
  }>
}

interface RecentOrdersProps {
  orders: Order[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  pending: "bg-ds-warning text-ds-warning",
  completed: "bg-ds-success text-ds-success",
  canceled: "bg-ds-destructive text-ds-destructive",
  processing: "bg-ds-info text-ds-info",
  shipped: "bg-ds-accent/10 text-ds-accent",
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const prefix = useTenantPrefix()

  if (isLoading) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">
            Recent Orders
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-ds-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!orders?.length) {
    return (
      <div className="bg-ds-background rounded-lg border border-ds-border">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">
            Recent Orders
          </h2>
        </div>
        <div className="p-8 text-center">
          <ShoppingBag className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground">No orders yet</p>
          <Link
            to={`${prefix}/` as never}
            className="mt-4 inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
          >
            Start shopping
            <ChevronRight className="h-4 w-4 ms-1" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-lg border border-ds-border">
      <div className="p-4 border-b border-ds-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ds-foreground">
          Recent Orders
        </h2>
        <Link
          to={`${prefix}/account/orders` as never}
          className="text-sm font-medium text-ds-muted-foreground hover:text-ds-foreground"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-ds-border">
        {orders.slice(0, 3).map((order) => (
          <Link
            key={order.id}
            to={`${prefix}/account/orders/${order.id}` as never}
            className="flex items-center gap-4 p-4 hover:bg-ds-muted transition-colors"
          >
            {/* Thumbnails */}
            <div className="flex -space-x-2">
              {(order.items || []).slice(0, 3).map((item, i) => (
                <div
                  key={item.id}
                  className="w-10 h-10 rounded-md bg-ds-muted border-2 border-white overflow-hidden"
                  style={{ zIndex: 3 - i }}
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {(order.items?.length ?? 0) > 3 && (
                <div className="w-10 h-10 rounded-md bg-ds-muted border-2 border-white flex items-center justify-center text-xs font-medium text-ds-muted-foreground">
                  +{(order.items?.length ?? 0) - 3}
                </div>
              )}
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ds-foreground">
                Order #{order.display_id}
              </p>
              <p className="text-sm text-ds-muted-foreground">
                {new Date(order.created_at!).toLocaleDateString()}
              </p>
            </div>

            {/* Status & Total */}
            <div className="text-end">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  statusColors[order.status] || "bg-ds-muted text-ds-foreground"
                }`}
              >
                {order.status}
              </span>
              <p className="mt-1 text-sm font-semibold text-ds-foreground">
                {formatPrice(order.total, order.currency_code)}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-ds-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
