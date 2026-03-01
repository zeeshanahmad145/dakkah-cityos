import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { formatPrice } from "@/lib/utils/price"
import { ShoppingBag, ChevronRight, MagnifyingGlass } from "@medusajs/icons"
import { useState } from "react"
import { Input } from "@/components/ui/input"

interface OrderItem {
  id: string
  title: string
  thumbnail?: string
  quantity: number
}

interface Order {
  id: string
  display_id: number | undefined
  created_at: string
  status: string
  fulfillment_status: string
  payment_status: string
  total: number
  currency_code: string
  items: OrderItem[]
}

interface OrderListProps {
  orders: Order[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  pending: "bg-ds-warning text-ds-warning",
  completed: "bg-ds-success text-ds-success",
  canceled: "bg-ds-destructive text-ds-destructive",
  processing: "bg-ds-info text-ds-info",
  shipped: "bg-ds-accent/10 text-ds-accent",
  requires_action: "bg-ds-warning/15 text-ds-warning",
}

const fulfillmentStatusLabels: Record<string, string> = {
  not_fulfilled: "Processing",
  partially_fulfilled: "Partially Shipped",
  fulfilled: "Shipped",
  partially_shipped: "Partially Shipped",
  shipped: "Shipped",
  partially_returned: "Partially Returned",
  returned: "Returned",
  canceled: "Canceled",
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  const prefix = useTenantPrefix()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.display_id?.toString().includes(searchQuery) ||
      (order.items || []).some((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    const matchesStatus =
      statusFilter === "all" || order.fulfillment_status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted-foreground" />
          <Input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 h-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-ds-border rounded-md text-sm"
        >
          <option value="all">All statuses</option>
          <option value="not_fulfilled">Processing</option>
          <option value="fulfilled">Shipped</option>
          <option value="returned">Returned</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Order List */}
      {!filteredOrders?.length ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-ds-muted-foreground mx-auto mb-4" />
          <p className="text-ds-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "No orders match your filters"
              : "No orders yet"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link
              to={`${prefix}/store` as never}
              className="mt-4 inline-flex items-center text-sm font-medium text-ds-foreground hover:underline"
            >
              Start shopping
              <ChevronRight className="h-4 w-4 ms-1" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`${prefix}/account/orders/${order.id}` as never}
              className="flex items-center gap-4 p-4 bg-ds-background rounded-lg border border-ds-border hover:border-ds-border transition-colors"
            >
              {/* Thumbnails */}
              <div className="flex -space-x-2 flex-shrink-0">
                {(order.items || []).slice(0, 3).map((item, i) => (
                  <div
                    key={item.id}
                    className="w-12 h-12 rounded-md bg-ds-muted border-2 border-white overflow-hidden"
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
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
                {(order.items?.length ?? 0) > 3 && (
                  <div className="w-12 h-12 rounded-md bg-ds-muted border-2 border-white flex items-center justify-center text-xs font-medium text-ds-muted-foreground">
                    +{(order.items?.length ?? 0) - 3}
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ds-foreground">
                    Order #{order.display_id}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      statusColors[order.fulfillment_status] ||
                      "bg-ds-muted text-ds-foreground"
                    }`}
                  >
                    {fulfillmentStatusLabels[order.fulfillment_status] ||
                      order.fulfillment_status}
                  </span>
                </div>
                <p className="text-sm text-ds-muted-foreground mt-1">
                  {new Date(order.created_at!).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-ds-muted-foreground">
                  {order.items?.length ?? 0}{" "}
                  {(order.items?.length ?? 0) === 1 ? "item" : "items"}
                </p>
              </div>

              {/* Total */}
              <div className="text-end flex-shrink-0">
                <p className="text-lg font-semibold text-ds-foreground">
                  {formatPrice(order.total, order.currency_code)}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-ds-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
