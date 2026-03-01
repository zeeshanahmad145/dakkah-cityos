import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils/price"
import { Clock, Check, XMark } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface PendingApproval {
  id: string
  type: "purchase_order" | "quote_request" | "limit_increase"
  title: string
  requestedBy: string
  requestedAt: string
  amount?: number
  currencyCode?: string
  details?: string
}

interface ApprovalQueueProps {
  items: PendingApproval[]
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
}

export function ApprovalQueue({
  items,
  onApprove,
  onReject,
}: ApprovalQueueProps) {
  const prefix = useTenantPrefix()
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeLabel = (type: PendingApproval["type"]) => {
    switch (type) {
      case "purchase_order":
        return "Purchase Order"
      case "quote_request":
        return "Quote Request"
      case "limit_increase":
        return "Limit Increase"
    }
  }

  const getTypeColor = (type: PendingApproval["type"]) => {
    switch (type) {
      case "purchase_order":
        return "bg-ds-info text-ds-info"
      case "quote_request":
        return "bg-ds-accent/10 text-ds-accent"
      case "limit_increase":
        return "bg-ds-warning text-ds-warning"
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-ds-background rounded-xl border border-ds-border p-12 text-center">
        <Check className="w-12 h-12 text-ds-success mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-ds-foreground mb-2">
          All Caught Up
        </h3>
        <p className="text-ds-muted-foreground">
          No pending approvals at this time
        </p>
      </div>
    )
  }

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border overflow-hidden">
      <div className="px-6 py-4 border-b border-ds-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ds-foreground">
          Pending Approvals
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-ds-warning text-ds-warning">
          {items.length} pending
        </span>
      </div>

      <div className="divide-y divide-ds-border">
        {items.map((item) => (
          <div key={item.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-ds-warning flex items-center justify-center mt-1">
                  <Clock className="w-5 h-5 text-ds-warning" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-ds-foreground">
                      {item.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <p className="text-sm text-ds-muted-foreground mt-1">
                    Requested by {item.requestedBy} on{" "}
                    {formatDate(item.requestedAt)}
                  </p>
                  {item.details && (
                    <p className="text-sm text-ds-muted-foreground mt-2">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>

              {item.amount !== undefined && item.currencyCode && (
                <p className="text-xl font-bold text-ds-foreground">
                  {formatPrice(item.amount, item.currencyCode)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-ds-border">
              {item.type === "purchase_order" && (
                <Link
                  to={`${prefix}/account/purchase-orders/${item.id}` as never}
                  className="text-sm text-ds-muted-foreground hover:text-ds-foreground"
                >
                  View Details
                </Link>
              )}
              {item.type !== "purchase_order" && <div />}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject?.(item.id)}
                  className="text-ds-destructive hover:text-ds-destructive hover:bg-ds-destructive"
                >
                  <XMark className="w-4 h-4 me-1" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => onApprove?.(item.id)}>
                  <Check className="w-4 h-4 me-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
