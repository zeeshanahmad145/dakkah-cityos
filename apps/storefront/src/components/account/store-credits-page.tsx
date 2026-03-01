import React, { useState } from "react"

interface CreditTransaction {
  id: string
  date: string
  description: string
  amount: number
  balance: number
  type: "credit" | "debit"
}

interface StoreCreditsPageProps {
  balance?: number
  currency?: string
  transactions?: CreditTransaction[]
  expiringAmount?: number
  expiringDate?: string
  autoApply?: boolean
  loading?: boolean
}

const sampleTransactions: CreditTransaction[] = [
  { id: "1", date: "2026-02-10", description: "Refund - Order #1234", amount: 2500, balance: 7500, type: "credit" },
  { id: "2", date: "2026-02-05", description: "Purchase - Order #1230", amount: -1500, balance: 5000, type: "debit" },
  { id: "3", date: "2026-01-20", description: "Gift Card Redemption", amount: 5000, balance: 6500, type: "credit" },
  { id: "4", date: "2026-01-15", description: "Loyalty Points Conversion", amount: 1500, balance: 1500, type: "credit" },
]

const fundPresets = [1000, 2500, 5000, 10000]

export function StoreCreditsPage({
  balance = 7500,
  currency = "USD",
  transactions = sampleTransactions,
  expiringAmount = 1500,
  expiringDate = "2026-03-15",
  autoApply: initialAutoApply = true,
  loading = false,
}: StoreCreditsPageProps) {
  const [autoApply, setAutoApply] = useState(initialAutoApply)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [transferEmail, setTransferEmail] = useState("")
  const [transferAmount, setTransferAmount] = useState("")

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-ds-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-ds-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-ds-background rounded-lg border border-ds-border p-6">
        <p className="text-sm text-ds-muted-foreground mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-ds-foreground">{formatPrice(balance)}</p>

        {expiringAmount > 0 && expiringDate && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-ds-warning/10 rounded-md">
            <svg className="w-4 h-4 text-ds-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-xs text-ds-warning">
              {formatPrice(expiringAmount)} expiring on {new Date(expiringDate).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setShowAddFunds(!showAddFunds); setShowTransfer(false) }}
            className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Add Funds
          </button>
          <button
            onClick={() => { setShowTransfer(!showTransfer); setShowAddFunds(false) }}
            className="px-4 py-2 text-sm font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors border border-ds-border"
          >
            Transfer
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-ds-muted-foreground">Auto-apply credits at checkout</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoApply}
            onClick={() => setAutoApply(!autoApply)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              autoApply ? "bg-ds-primary" : "bg-ds-muted"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                autoApply ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {showAddFunds && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ds-foreground">Add Funds</h3>
          <div className="grid grid-cols-4 gap-2">
            {fundPresets.map((amount) => (
              <button
                key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount("") }}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  selectedAmount === amount
                    ? "border-ds-primary bg-ds-primary/10 text-ds-primary"
                    : "border-ds-border text-ds-muted-foreground hover:bg-ds-muted"
                }`}
              >
                {formatPrice(amount)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ds-muted-foreground">or</span>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
              className="flex-1 px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
            />
          </div>
          <button className="w-full px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Add {selectedAmount ? formatPrice(selectedAmount) : customAmount ? `$${customAmount}` : "Funds"}
          </button>
        </div>
      )}

      {showTransfer && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ds-foreground">Transfer Credits</h3>
          <div>
            <label className="block text-xs font-medium text-ds-muted-foreground mb-1">Recipient email</label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ds-muted-foreground mb-1">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
            />
          </div>
          <button className="w-full px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Transfer Credits
          </button>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-ds-foreground mb-4">Credit History</h3>
        {transactions.length === 0 ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <span className="text-3xl block mb-3">💳</span>
            <p className="text-sm text-ds-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-ds-background rounded-lg border border-ds-border overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 bg-ds-muted border-b border-ds-border text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
              <span>Description</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Balance</span>
            </div>
            <div className="divide-y divide-ds-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-1 md:gap-4 md:items-center">
                  <p className="text-sm text-ds-foreground">{tx.description}</p>
                  <span className="text-sm text-ds-muted-foreground">
                    {new Date(tx.date!).toLocaleDateString()}
                  </span>
                  <span className={`text-sm font-medium ${tx.type === "credit" ? "text-ds-success" : "text-ds-destructive"}`}>
                    {tx.type === "credit" ? "+" : ""}{formatPrice(tx.amount ?? 0)}
                  </span>
                  <span className="text-sm text-ds-muted-foreground">{formatPrice(tx.balance ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
