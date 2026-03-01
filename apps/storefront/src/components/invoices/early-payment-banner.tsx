import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { CheckCircleSolid, ClockSolid } from "@medusajs/icons"
import { useState } from "react"

interface EarlyPaymentBannerProps {
  invoiceId: string
  invoiceTotal: number
  currencyCode: string
}

export function EarlyPaymentBanner({ 
  invoiceId, 
  invoiceTotal,
  currencyCode 
}: EarlyPaymentBannerProps) {
  const queryClient = useQueryClient()
  const [showConfirm, setShowConfirm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["early-payment", invoiceId],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        available: boolean
        discount_percentage: number
        discounted_amount: number
        savings: number
        days_remaining: number
        deadline: string
      }>(`/store/invoices/${invoiceId}/early-payment`, {
        credentials: "include",
      })
      return response
    },
  })

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await sdk.client.fetch(`/store/invoices/${invoiceId}/early-payment`, {
        method: "POST",
        credentials: "include",
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-payment", invoiceId] })
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] })
      setShowConfirm(false)
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount)
  }

  if (isLoading || !data?.available) {
    return null
  }

  return (
    <div className="border border-ds-success bg-ds-success rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-ds-success flex items-center justify-center">
            <ClockSolid className="w-5 h-5 text-ds-success" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-ds-success">Early Payment Discount Available</h3>
          <p className="text-sm text-ds-success mt-1">
            Pay within {data.days_remaining} day{data.days_remaining !== 1 ? "s" : ""} and 
            save {data.discount_percentage}% on this invoice.
          </p>
          
          <div className="mt-3 flex items-center gap-6">
            <div>
              <p className="text-xs text-ds-success uppercase tracking-wider">Original Amount</p>
              <p className="font-medium text-ds-muted-foreground line-through">
                {formatCurrency(invoiceTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ds-success uppercase tracking-wider">Discounted Amount</p>
              <p className="font-bold text-ds-success text-lg">
                {formatCurrency(data.discounted_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ds-success uppercase tracking-wider">You Save</p>
              <p className="font-bold text-ds-success">
                {formatCurrency(data.savings)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {showConfirm ? (
              <>
                <p className="text-sm text-ds-success">Apply discount and pay now?</p>
                <Button
                  size="sm"
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? "Applying..." : "Yes, Pay Now"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowConfirm(true)}
              >
                Apply Discount
              </Button>
            )}
          </div>

          <p className="text-xs text-ds-success mt-3">
            Offer expires: {new Date(data.deadline!).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
