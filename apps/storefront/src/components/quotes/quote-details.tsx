import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/utils/sdk";
import { Button } from "@/components/ui/button";

interface QuoteItem {
  id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  sku?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  custom_price?: number;
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  customer_notes?: string;
  internal_notes?: string;
  discount_reason?: string;
  created_at: string;
  valid_until?: string;
  items: QuoteItem[];
}

interface QuoteDetailsProps {
  quote: Quote;
}

export function QuoteDetails({ quote }: QuoteDetailsProps) {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return sdk.client.fetch(`/store/quotes/${quote.id}/accept`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quote.id] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (reason: string) => {
      return sdk.client.fetch(`/store/quotes/${quote.id}/decline`, {
        method: "POST",
        credentials: "include",
        body: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", quote.id] });
      setShowDeclineForm(false);
    },
  });

  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const canAccept = quote.status === "approved" && !isExpired;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
          <p className="text-muted-foreground">
            Created {new Date(quote.created_at).toLocaleDateString()}
          </p>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      {/* Expiration Warning */}
      {quote.valid_until && (
        <div className={`p-4 rounded-lg border ${isExpired ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <p className={isExpired ? "text-red-700" : "text-blue-700"}>
            {isExpired 
              ? `This quote expired on ${new Date(quote.valid_until).toLocaleDateString()}`
              : `Valid until ${new Date(quote.valid_until).toLocaleDateString()}`
            }
          </p>
        </div>
      )}

      {/* Items */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="font-semibold">Quote Items</h2>
        </div>
        <div className="divide-y">
          {quote.items.map((item, idx) => (
            <div key={item.id || idx} className="p-4 flex items-center gap-4">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.title || (item as any).name || "Item"}</p>
                {item.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                )}
                <p className="text-sm">Qty: {item.quantity}</p>
              </div>
              <div className="text-end">
                {item.custom_price && item.custom_price !== item.unit_price ? (
                  <>
                    <p className="font-semibold text-ds-success">
                      ${(Number(item.custom_price || 0) / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground line-through">
                      ${(Number(item.unit_price || 0) / 100).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold">
                    ${(Number(item.unit_price || 0) / 100).toFixed(2)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Total: ${(Number((item as any).total || (Number(item.custom_price || item.unit_price || 0) * item.quantity)) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${(Number(quote.subtotal || 0) / 100).toFixed(2)}</span>
        </div>
        {(quote.discount_total || (quote as any).discount || 0) > 0 && (
          <div className="flex justify-between text-ds-success">
            <span>Discount</span>
            <span>-${(Number(quote.discount_total || (quote as any).discount || 0) / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${(Number(quote.tax_total || (quote as any).tax || 0) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>${(Number(quote.total || 0) / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      {quote.customer_notes && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your Notes</h3>
          <p className="text-muted-foreground">{quote.customer_notes}</p>
        </div>
      )}

      {quote.discount_reason && (
        <div className="border rounded-lg p-4 bg-ds-success">
          <h3 className="font-semibold mb-2 text-ds-success">Discount Reason</h3>
          <p className="text-ds-success">{quote.discount_reason}</p>
        </div>
      )}

      {/* Actions */}
      {canAccept && (
        <div className="flex gap-4">
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="flex-1"
          >
            {acceptMutation.isPending ? "Processing..." : "Accept Quote"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowDeclineForm(true)}
          >
            Decline
          </Button>
        </div>
      )}

      {showDeclineForm && (
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Decline Quote</h3>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Please let us know why you're declining this quote (optional)"
            className="w-full min-h-24 p-3 border rounded-lg resize-none"
          />
          <div className="flex gap-4">
            <Button
              variant="danger"
              onClick={() => declineMutation.mutate(declineReason)}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? "Declining..." : "Confirm Decline"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeclineForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-ds-muted text-ds-foreground",
    submitted: "bg-ds-info text-ds-info",
    under_review: "bg-ds-warning text-ds-warning",
    approved: "bg-ds-success text-ds-success",
    rejected: "bg-ds-destructive text-ds-destructive",
    accepted: "bg-ds-success text-ds-success",
    declined: "bg-ds-warning/15 text-ds-warning",
    expired: "bg-ds-muted text-ds-foreground",
  };

  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
  };

  return (
    <span className={`px-3 py-1.5 rounded text-sm font-medium ${styles[status] || "bg-ds-muted"}`}>
      {labels[status] || status}
    </span>
  );
}
