// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/context/auth-context"
import { useMemo } from "react"

interface WalletData {
  balance: number
  pending: number
  total_earned: number
  currency_code: string
  transactions: WalletTransaction[]
}

interface WalletTransaction {
  id: string
  date: string
  type: string
  amount: number
  reference: string
  currency_code: string
}

export const Route = createFileRoute("/$tenant/$locale/vendor/wallet")({
  component: VendorWalletRoute,
})

function VendorWalletRoute() {
  const auth = useAuth()

  const vendorId = useMemo(() => {
    const user = auth?.user || auth?.customer
    if (user?.vendor_id) return user.vendor_id
    if (user?.metadata?.vendor_id) return user.metadata.vendor_id
    if (user?.id) return user.id
    return "current-vendor"
  }, [auth])

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-wallet"],
    queryFn: async () => {
      const url = `/vendor/wallet`
      return sdk.client.fetch<WalletData>(url, {
        credentials: "include",
      })
    },
  })

  const typeColors: Record<string, string> = {
    payout: "text-ds-success",
    sale: "text-ds-success",
    refund: "text-ds-destructive",
    fee: "text-ds-destructive",
    adjustment: "text-ds-warning",
    withdrawal: "text-ds-primary",
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currency = data?.currency_code?.toUpperCase() || "USD"
  const transactions = data?.transactions || []

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-ds-muted-foreground text-sm mt-1">
          Financial overview and transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border rounded-lg p-6 bg-ds-success/10">
          <p className="text-sm text-ds-muted-foreground mb-1">
            Available Balance
          </p>
          <p className="text-3xl font-bold text-ds-success">
            {currency} {((data?.balance || 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-ds-warning/10">
          <p className="text-sm text-ds-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold text-ds-warning">
            {currency} {((data?.pending || 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="border rounded-lg p-6 bg-ds-info/10">
          <p className="text-sm text-ds-muted-foreground mb-1">Total Earned</p>
          <p className="text-3xl font-bold text-ds-info">
            {currency} {((data?.total_earned || 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-ds-muted-foreground">
          <p className="text-lg mb-2">No transactions yet</p>
          <p className="text-sm">
            Transactions will appear here once you start earning.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-ds-muted-foreground">
                <th className="pb-3 pe-4">Date</th>
                <th className="pb-3 pe-4">Type</th>
                <th className="pb-3 pe-4 text-right">Amount</th>
                <th className="pb-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b hover:bg-ds-muted/50 transition"
                >
                  <td className="py-4 pe-4 text-sm text-ds-muted-foreground">
                    {new Date(tx.date!).toLocaleDateString()}
                  </td>
                  <td className="py-4 pe-4">
                    <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-ds-muted text-ds-foreground capitalize">
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`py-4 pe-4 text-right font-medium ${typeColors[tx.type] || "text-ds-foreground"}`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {currency} {(Math.abs(tx.amount) / 100).toFixed(2)}
                  </td>
                  <td className="py-4 text-sm text-ds-muted-foreground font-mono">
                    {tx.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
