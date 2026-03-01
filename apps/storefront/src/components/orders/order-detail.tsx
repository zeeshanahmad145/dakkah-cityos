import { formatPrice } from "@/lib/utils/price"
import { ShoppingBag, TruckFast, MapPin, CreditCard } from "@medusajs/icons"

interface OrderItem {
  id: string
  title: string
  description?: string
  thumbnail?: string
  quantity: number
  unit_price: number
  total: number
}

interface Address {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

interface Order {
  id: string
  display_id: number
  created_at: string
  status: string
  fulfillment_status: string
  payment_status: string
  currency_code: string
  items: OrderItem[]
  shipping_address?: Address
  billing_address?: Address
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  total: number
  shipping_methods?: Array<{
    id: string
    name: string
    price: number
  }>
  payments?: Array<{
    id: string
    provider_id: string
    amount: number
  }>
  fulfillments?: Array<{
    id: string
    tracking_numbers?: string[]
    tracking_links?: Array<{ url: string }>
    shipped_at?: string
  }>
}

interface OrderDetailProps {
  order: Order
}

const statusColors: Record<string, string> = {
  pending: "bg-ds-warning text-ds-warning",
  completed: "bg-ds-success text-ds-success",
  canceled: "bg-ds-destructive text-ds-destructive",
  processing: "bg-ds-info text-ds-info",
  shipped: "bg-ds-accent/10 text-ds-accent",
  requires_action: "bg-ds-warning/15 text-ds-warning",
  not_fulfilled: "bg-ds-warning text-ds-warning",
  fulfilled: "bg-ds-success text-ds-success",
  partially_fulfilled: "bg-ds-info text-ds-info",
}

const statusLabels: Record<string, string> = {
  not_fulfilled: "Processing",
  partially_fulfilled: "Partially Shipped",
  fulfilled: "Shipped",
  returned: "Returned",
  canceled: "Canceled",
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-ds-background rounded-lg border border-ds-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ds-foreground">Order #{order.display_id}</h1>
            <p className="text-sm text-ds-muted-foreground mt-1">
              Placed on{" "}
              {new Date(order.created_at!).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full ${
              statusColors[order.fulfillment_status] || "bg-ds-muted text-ds-foreground"
            }`}
          >
            {statusLabels[order.fulfillment_status] || order.fulfillment_status}
          </span>
        </div>
      </div>

      {/* Tracking */}
      {order.fulfillments?.some((f) => f.tracking_numbers?.length) && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <TruckFast className="h-5 w-5 text-ds-muted-foreground" />
            <h2 className="text-lg font-semibold text-ds-foreground">Tracking</h2>
          </div>
          {order.fulfillments?.map((fulfillment) =>
            fulfillment.tracking_numbers?.map((tracking, idx) => (
              <div key={tracking} className="flex items-center justify-between py-2">
                <span className="text-sm text-ds-muted-foreground">Tracking #{idx + 1}</span>
                <span className="text-sm font-medium text-ds-foreground">{tracking}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
        <div className="p-4 border-b border-ds-border">
          <h2 className="text-lg font-semibold text-ds-foreground">Items</h2>
        </div>
        <div className="divide-y divide-ds-border">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="w-20 h-20 rounded-md bg-ds-muted overflow-hidden flex-shrink-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ds-muted-foreground">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ds-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-ds-muted-foreground mt-1">{item.description}</p>
                )}
                <p className="text-sm text-ds-muted-foreground mt-1">Qty: {item.quantity}</p>
              </div>
              <div className="text-end">
                <p className="font-medium text-ds-foreground">
                  {formatPrice(item.total, order.currency_code)}
                </p>
                <p className="text-sm text-ds-muted-foreground">
                  {formatPrice(item.unit_price, order.currency_code)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-ds-background rounded-lg border border-ds-border p-6">
        <h2 className="text-lg font-semibold text-ds-foreground mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Subtotal</span>
            <span className="text-ds-foreground">{formatPrice(order.subtotal, order.currency_code)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-ds-muted-foreground">Discount</span>
              <span className="text-ds-success">
                -{formatPrice(order.discount_total, order.currency_code)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Shipping</span>
            <span className="text-ds-foreground">
              {order.shipping_total === 0
                ? "Free"
                : formatPrice(order.shipping_total, order.currency_code)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Tax</span>
            <span className="text-ds-foreground">{formatPrice(order.tax_total, order.currency_code)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-3 border-t border-ds-border">
            <span className="text-ds-foreground">Total</span>
            <span className="text-ds-foreground">{formatPrice(order.total, order.currency_code)}</span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {order.shipping_address && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-ds-muted-foreground" />
              <h2 className="text-lg font-semibold text-ds-foreground">Shipping Address</h2>
            </div>
            <div className="text-sm text-ds-muted-foreground space-y-1">
              <p className="font-medium text-ds-foreground">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
              <p>
                {order.shipping_address.city}
                {order.shipping_address.province && `, ${order.shipping_address.province}`}{" "}
                {order.shipping_address.postal_code}
              </p>
              <p className="uppercase">{order.shipping_address.country_code}</p>
              {order.shipping_address.phone && <p className="mt-2">{order.shipping_address.phone}</p>}
            </div>
          </div>
        )}

        {order.billing_address && (
          <div className="bg-ds-background rounded-lg border border-ds-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-ds-muted-foreground" />
              <h2 className="text-lg font-semibold text-ds-foreground">Billing Address</h2>
            </div>
            <div className="text-sm text-ds-muted-foreground space-y-1">
              <p className="font-medium text-ds-foreground">
                {order.billing_address.first_name} {order.billing_address.last_name}
              </p>
              <p>{order.billing_address.address_1}</p>
              {order.billing_address.address_2 && <p>{order.billing_address.address_2}</p>}
              <p>
                {order.billing_address.city}
                {order.billing_address.province && `, ${order.billing_address.province}`}{" "}
                {order.billing_address.postal_code}
              </p>
              <p className="uppercase">{order.billing_address.country_code}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
