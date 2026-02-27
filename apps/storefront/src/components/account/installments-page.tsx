import React, { useState } from "react"

interface InstallmentPayment {
  id: string
  dueDate: string
  amount: number
  status: "paid" | "upcoming" | "overdue"
  paidDate?: string
}

interface InstallmentPlan {
  id: string
  productName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  nextPaymentDate: string
  status: "active" | "completed" | "overdue" | "defaulted"
  installments: number
  completedInstallments: number
  payments: InstallmentPayment[]
}

interface InstallmentsPageProps {
  plans?: InstallmentPlan[]
  currency?: string
  loading?: boolean
}

const samplePlans: InstallmentPlan[] = [
  {
    id: "1",
    productName: "MacBook Pro 16\"",
    totalAmount: 249900,
    paidAmount: 124950,
    remainingAmount: 124950,
    nextPaymentDate: "2026-03-01",
    status: "active",
    installments: 4,
    completedInstallments: 2,
    payments: [
      { id: "p1", dueDate: "2026-01-01", amount: 62475, status: "paid", paidDate: "2026-01-01" },
      { id: "p2", dueDate: "2026-02-01", amount: 62475, status: "paid", paidDate: "2026-02-01" },
      { id: "p3", dueDate: "2026-03-01", amount: 62475, status: "upcoming" },
      { id: "p4", dueDate: "2026-04-01", amount: 62475, status: "upcoming" },
    ],
  },
  {
    id: "2",
    productName: "Smart TV 55\"",
    totalAmount: 89900,
    paidAmount: 29967,
    remainingAmount: 59933,
    nextPaymentDate: "2026-02-10",
    status: "overdue",
    installments: 6,
    completedInstallments: 2,
    payments: [
      { id: "p5", dueDate: "2025-12-10", amount: 14984, status: "paid", paidDate: "2025-12-10" },
      { id: "p6", dueDate: "2026-01-10", amount: 14983, status: "paid", paidDate: "2026-01-12" },
      { id: "p7", dueDate: "2026-02-10", amount: 14983, status: "overdue" },
      { id: "p8", dueDate: "2026-03-10", amount: 14983, status: "upcoming" },
      { id: "p9", dueDate: "2026-04-10", amount: 14983, status: "upcoming" },
      { id: "p10", dueDate: "2026-05-10", amount: 14984, status: "upcoming" },
    ],
  },
]

export function InstallmentsPage({ plans = samplePlans, currency = "USD", loading = false }: InstallmentsPageProps) {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-ds-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-ds-success/10", text: "text-ds-success", label: "Active" },
    completed: { bg: "bg-ds-info/10", text: "text-ds-info", label: "Completed" },
    overdue: { bg: "bg-ds-destructive/10", text: "text-ds-destructive", label: "Overdue" },
    defaulted: { bg: "bg-ds-destructive/10", text: "text-ds-destructive", label: "Defaulted" },
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ds-foreground">Installment Plans</h2>
        <p className="text-sm text-ds-muted-foreground">{plans.length} active plan{plans.length !== 1 ? "s" : ""}</p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
          <span className="text-3xl block mb-3">📋</span>
          <p className="text-sm text-ds-muted-foreground">No installment plans found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const progress = (plan.completedInstallments / plan.installments) * 100
            const style = statusStyles[plan.status]
            const isExpanded = expandedPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`bg-ds-background rounded-lg border overflow-hidden ${
                  plan.status === "overdue" ? "border-ds-destructive/50" : "border-ds-border"
                }`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ds-foreground">{plan.productName}</p>
                      <p className="text-xs text-ds-muted-foreground mt-0.5">
                        {plan.completedInstallments} of {plan.installments} payments completed
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>

                  <div className="w-full bg-ds-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        plan.status === "overdue" ? "bg-ds-destructive" : "bg-ds-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-ds-muted-foreground">Total</p>
                      <p className="text-sm font-semibold text-ds-foreground">{formatPrice(plan.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ds-muted-foreground">Paid</p>
                      <p className="text-sm font-semibold text-ds-success">{formatPrice(plan.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ds-muted-foreground">Remaining</p>
                      <p className="text-sm font-semibold text-ds-foreground">{formatPrice(plan.remainingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ds-muted-foreground">Next Payment</p>
                      <p className={`text-sm font-semibold ${plan.status === "overdue" ? "text-ds-destructive" : "text-ds-foreground"}`}>
                        {new Date(plan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {plan.status !== "completed" && (
                      <button className="px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                        Pay Early
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="px-4 py-2 text-sm font-medium bg-ds-muted text-ds-foreground rounded-lg hover:bg-ds-muted/80 transition-colors"
                    >
                      {isExpanded ? "Hide History" : "Payment History"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-ds-border bg-ds-muted/30">
                    <div className="p-4 space-y-2">
                      {(plan.payments || []).map((payment) => (
                        <div
                          key={payment.id}
                          className={`flex items-center justify-between p-2 rounded-md ${
                            payment.status === "overdue" ? "bg-ds-destructive/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                payment.status === "paid"
                                  ? "bg-ds-success"
                                  : payment.status === "overdue"
                                  ? "bg-ds-destructive"
                                  : "bg-ds-muted-foreground"
                              }`}
                            />
                            <div>
                              <p className="text-sm text-ds-foreground">
                                Due {new Date(payment.dueDate).toLocaleDateString()}
                              </p>
                              {payment.paidDate && (
                                <p className="text-xs text-ds-muted-foreground">
                                  Paid {new Date(payment.paidDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ds-foreground">
                              {formatPrice(payment.amount)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                payment.status === "paid"
                                  ? "bg-ds-success/10 text-ds-success"
                                  : payment.status === "overdue"
                                  ? "bg-ds-destructive/10 text-ds-destructive"
                                  : "bg-ds-muted text-ds-muted-foreground"
                              }`}
                            >
                              {payment.status === "paid" ? "Paid" : payment.status === "overdue" ? "Overdue" : "Upcoming"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
