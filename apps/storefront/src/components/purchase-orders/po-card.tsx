import { Link } from "@tanstack/react-router"
import { PurchaseOrder } from "@/lib/hooks/use-purchase-orders"
import { formatPrice } from "@/lib/utils/price"
import { cn } from "@/lib/utils/cn"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface POCardProps {
  purchaseOrder: PurchaseOrder
  compact?: boolean
}

export function POCard({ purchaseOrder: po, compact = false }: POCardProps) {
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
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatStatus = (status: PurchaseOrder["status"]) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (compact) {
    return (
      <Link
        to={`${prefix}/account/purchase-orders/${po.id}` as any}
        className="flex items-center justify-between p-4 bg-ds-background rounded-lg border border-ds-border hover:border-ds-border transition-colors"
      >
        <div>
          <p className="font-medium text-ds-foreground">{po.po_number}</p>
          <p className="text-sm text-ds-muted-foreground">
            {formatPrice(po.total, po.currency_code)}
          </p>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          getStatusColor(po.status)
        )}>
          {formatStatus(po.status)}
        </span>
      </Link>
    )
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link
            to={`${prefix}/account/purchase-orders/${po.id}` as any}
            className="font-semibold text-ds-foreground hover:text-ds-muted-foreground"
          >
            {po.po_number}
          </Link>
          <p className="text-sm text-ds-muted-foreground mt-0.5">
            {new Date(po.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          getStatusColor(po.status)
        )}>
          {formatStatus(po.status)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ds-border">
        <div>
          <p className="text-xs text-ds-muted-foreground">Items</p>
          <p className="font-medium text-ds-foreground">{po.items?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-ds-muted-foreground">Created By</p>
          <p className="font-medium text-ds-foreground">{po.created_by_name || "You"}</p>
        </div>
        <div className="text-end">
          <p className="text-xs text-ds-muted-foreground">Total</p>
          <p className="font-semibold text-ds-foreground">
            {formatPrice(po.total, po.currency_code)}
          </p>
        </div>
      </div>
    </div>
  )
}
