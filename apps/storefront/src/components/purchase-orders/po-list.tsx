import { Link } from "@tanstack/react-router"
import { PurchaseOrder } from "@/lib/hooks/use-purchase-orders"
import { formatPrice } from "@/lib/utils/price"
import { ChevronRight, DocumentText } from "@medusajs/icons"
import { cn } from "@/lib/utils/cn"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface POListProps {
  purchaseOrders: PurchaseOrder[]
  emptyMessage?: string
}

export function POList({
  purchaseOrders,
  emptyMessage = "No purchase orders found",
}: POListProps) {
  const prefix = useTenantPrefix()

  const getStatusColor = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "draft":
        return "bg-ds-muted text-ds-foreground"
      case "pending_approval":
        return "bg-ds-warning text-ds-warning"
      case "approved":
        return "bg-ds-success text-ds-success"
      case "rejected":
        return "bg-ds-destructive text-ds-destructive"
      case "submitted":
        return "bg-ds-info text-ds-info"
      case "fulfilled":
        return "bg-ds-accent/10 text-ds-accent"
      case "cancelled":
        return "bg-ds-muted text-ds-muted-foreground"
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatStatus = (status: PurchaseOrder["status"]) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (purchaseOrders.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
        <DocumentText className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4" />
        <p className="text-ds-muted-foreground">{emptyMessage}</p>
        <Link
          to={`${prefix}/account/purchase-orders/new` as never}
          className="inline-block mt-4 text-sm font-medium text-ds-foreground hover:underline"
        >
          Create your first purchase order
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {purchaseOrders.map((po) => (
        <Link
          key={po.id}
          to={`${prefix}/account/purchase-orders/${po.id}` as never}
          className="block bg-ds-background rounded-xl border border-ds-border p-6 hover:border-ds-border hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ds-foreground">
                {po.po_number}
              </h3>
              <p className="text-sm text-ds-muted-foreground mt-0.5">
                Created {formatDate(po.created_at)}
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                getStatusColor(po.status),
              )}
            >
              {formatStatus(po.status)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-ds-border">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-ds-muted-foreground">Items</p>
                <p className="font-medium text-ds-foreground">
                  {po.items?.length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-ds-muted-foreground">Total</p>
                <p className="font-semibold text-ds-foreground">
                  {formatPrice(po.total ?? 0, po.currency_code)}
                </p>
              </div>
            </div>
            <span className="text-sm text-ds-muted-foreground flex items-center gap-1">
              View details
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
