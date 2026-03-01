import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  ArrowPath,
  DocumentText,
  ArrowUturnLeft,
  ChatBubbleLeftRight,
} from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface OrderActionsProps {
  orderId: string
  status: string
  onReorder?: () => void
  onDownloadInvoice?: () => void
}

export function OrderActions({
  orderId,
  status,
  onReorder,
  onDownloadInvoice,
}: OrderActionsProps) {
  const prefix = useTenantPrefix()
  const canReturn = ["delivered", "completed"].includes(status.toLowerCase())
  const canTrack = ["shipped", "processing"].includes(status.toLowerCase())

  return (
    <div className="bg-ds-background rounded-xl border border-ds-border p-6">
      <h3 className="text-lg font-semibold text-ds-foreground mb-4">Actions</h3>

      <div className="space-y-3">
        {/* Reorder */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onReorder}
        >
          <ArrowPath className="w-4 h-4 me-2" />
          Reorder Items
        </Button>

        {/* Download Invoice */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onDownloadInvoice}
        >
          <DocumentText className="w-4 h-4 me-2" />
          Download Invoice
        </Button>

        {/* Track Order */}
        {canTrack && (
          <Link to={`${prefix}/account/orders/${orderId}/track` as never}>
            <Button variant="outline" className="w-full justify-start">
              <DocumentText className="w-4 h-4 me-2" />
              Track Shipment
            </Button>
          </Link>
        )}

        {/* Return Request */}
        {canReturn && (
          <Link to={`${prefix}/account/orders/${orderId}/return` as never}>
            <Button variant="outline" className="w-full justify-start">
              <ArrowUturnLeft className="w-4 h-4 me-2" />
              Request Return
            </Button>
          </Link>
        )}

        {/* Get Help */}
        <Button
          variant="ghost"
          className="w-full justify-start text-ds-muted-foreground"
        >
          <ChatBubbleLeftRight className="w-4 h-4 me-2" />
          Get Help with Order
        </Button>
      </div>
    </div>
  )
}
