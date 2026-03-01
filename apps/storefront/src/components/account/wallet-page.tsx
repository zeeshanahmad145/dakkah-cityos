import React, { useState } from "react"

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  holderName?: string
}

interface WalletTransaction {
  id: string
  date: string
  description: string
  amount: number
  status: "completed" | "pending" | "failed"
  paymentMethodLast4?: string
}

interface WalletPageProps {
  methods?: PaymentMethod[]
  transactions?: WalletTransaction[]
  currency?: string
  loading?: boolean
}

const sampleMethods: PaymentMethod[] = [
  { id: "1", brand: "Visa", last4: "4242", expiryMonth: 12, expiryYear: 2027, isDefault: true, holderName: "Ahmed Al-Salem" },
  { id: "2", brand: "Mastercard", last4: "8888", expiryMonth: 6, expiryYear: 2026, isDefault: false, holderName: "Ahmed Al-Salem" },
  { id: "3", brand: "Mada", last4: "1234", expiryMonth: 3, expiryYear: 2028, isDefault: false },
]

const sampleTransactions: WalletTransaction[] = [
  { id: "1", date: "2026-02-10", description: "Order #ORD-1234", amount: -15000, status: "completed", paymentMethodLast4: "4242" },
  { id: "2", date: "2026-02-08", description: "Order #ORD-1230", amount: -8500, status: "completed", paymentMethodLast4: "4242" },
  { id: "3", date: "2026-02-01", description: "Subscription Renewal", amount: -2999, status: "completed", paymentMethodLast4: "8888" },
  { id: "4", date: "2026-01-28", description: "Refund - Order #ORD-1200", amount: 4500, status: "completed", paymentMethodLast4: "4242" },
]

const brandIcons: Record<string, string> = {
  Visa: "💳",
  Mastercard: "💳",
  Mada: "💳",
  AMEX: "💳",
}

export function WalletPage({
  methods = sampleMethods,
  transactions = sampleTransactions,
  currency = "USD",
  loading = false,
}: WalletPageProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(Math.abs(amount) / 100)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ds-foreground">Payment Methods</h2>
          <p className="text-sm text-ds-muted-foreground">{methods.length} saved method{methods.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Add Payment Method
        </button>
      </div>

      {showAddForm && (
        <div className="bg-ds-background rounded-lg border border-ds-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ds-foreground">Add New Card</h3>
          <div>
            <label className="block text-xs font-medium text-ds-muted-foreground mb-1">Cardholder Name</label>
            <input
              type="text"
              placeholder="Name on card"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ds-muted-foreground mb-1">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              maxLength={19}
              className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ds-muted-foreground mb-1">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                maxLength={5}
                className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ds-muted-foreground mb-1">CVV</label>
              <input
                type="text"
                placeholder="123"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 text-sm bg-ds-muted border border-ds-border rounded-md text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-1 focus:ring-ds-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Save Card
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium bg-ds-muted text-ds-muted-foreground rounded-lg hover:bg-ds-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`bg-ds-background rounded-lg border p-4 ${
              method.isDefault ? "border-ds-primary" : "border-ds-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ds-muted flex items-center justify-center">
                  <span className="text-lg">{brandIcons[method.brand] || "💳"}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ds-foreground">
                      {method.brand} •••• {method.last4}
                    </p>
                    {method.isDefault && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-ds-primary/10 text-ds-primary rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ds-muted-foreground">
                    Expires {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                    {method.holderName && ` · ${method.holderName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button className="text-xs text-ds-primary hover:underline">
                    Set Default
                  </button>
                )}
                {deleteConfirm === method.id ? (
                  <div className="flex items-center gap-1">
                    <button className="px-2 py-1 text-xs font-medium bg-ds-destructive text-white rounded hover:opacity-90">
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-xs text-ds-muted-foreground hover:text-ds-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(method.id)}
                    className="text-xs text-ds-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ds-foreground mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <span className="text-3xl block mb-3">📄</span>
            <p className="text-sm text-ds-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-ds-background rounded-lg border border-ds-border divide-y divide-ds-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ds-foreground">{tx.description}</p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(tx.date!).toLocaleDateString()}
                    {tx.paymentMethodLast4 && ` · •••• ${tx.paymentMethodLast4}`}
                  </p>
                </div>
                <div className="text-end">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? "text-ds-success" : "text-ds-foreground"}`}>
                    {tx.amount > 0 ? "+" : "-"}{formatPrice(tx.amount ?? 0)}
                  </p>
                  <span
                    className={`text-xs ${
                      tx.status === "completed"
                        ? "text-ds-success"
                        : tx.status === "pending"
                        ? "text-ds-warning"
                        : "text-ds-destructive"
                    }`}
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
