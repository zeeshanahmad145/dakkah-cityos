import { PurchaseOrder } from "@/lib/hooks/use-purchase-orders"
import { formatPrice } from "@/lib/utils/price"
import { cn } from "@/lib/utils/cn"

interface PODetailProps {
  purchaseOrder: PurchaseOrder
}

export function PODetail({ purchaseOrder: po }: PODetailProps) {
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
      default:
        return "bg-ds-muted text-ds-foreground"
    }
  }

  const formatStatus = (status: PurchaseOrder["status"]) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (date?: string) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-ds-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ds-foreground">{po.po_number}</h2>
            <p className="text-ds-muted-foreground mt-1">Created {formatDate(po.created_at)}</p>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            getStatusColor(po.status)
          )}>
            {formatStatus(po.status)}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-6 grid grid-cols-2 gap-6 border-b border-ds-border">
        <div>
          <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Created By</p>
          <p className="text-sm text-ds-foreground mt-1">{po.created_by_name || "You"}</p>
        </div>
        {po.approved_by && (
          <div>
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Approved By</p>
            <p className="text-sm text-ds-foreground mt-1">{po.approved_by_name ?? "N/A"}</p>
          </div>
        )}
        {po.submitted_at && (
          <div>
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Submitted</p>
            <p className="text-sm text-ds-foreground mt-1">{formatDate(po.submitted_at)}</p>
          </div>
        )}
        {po.approved_at && (
          <div>
            <p className="text-xs text-ds-muted-foreground uppercase tracking-wider">Approved</p>
            <p className="text-sm text-ds-foreground mt-1">{formatDate(po.approved_at)}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="p-6 border-b border-ds-border">
        <h3 className="text-sm font-semibold text-ds-foreground mb-4">Line Items</h3>
        <div className="space-y-3">
          {(po.items || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-ds-border last:border-0">
              <div>
                <p className="font-medium text-ds-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-ds-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="text-end">
                <p className="text-sm text-ds-muted-foreground">
                  {formatPrice(item.unit_price ?? 0, po.currency_code)} x {item.quantity}
                </p>
                <p className="font-medium text-ds-foreground">
                  {formatPrice(item.total ?? 0, po.currency_code)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-6 bg-ds-muted">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Subtotal</span>
            <span className="text-ds-foreground">{formatPrice(po.subtotal ?? 0, po.currency_code)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Shipping</span>
            <span className="text-ds-foreground">{formatPrice(po.shipping_total ?? 0, po.currency_code)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ds-muted-foreground">Tax</span>
            <span className="text-ds-foreground">{formatPrice(po.tax_total ?? 0, po.currency_code)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-ds-border">
            <span className="font-semibold text-ds-foreground">Total</span>
            <span className="font-semibold text-ds-foreground">
              {formatPrice(po.total ?? 0, po.currency_code)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="p-6 border-t border-ds-border">
          <p className="text-xs text-ds-muted-foreground uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-ds-muted-foreground">{po.notes}</p>
        </div>
      )}
    </div>
  )
}
