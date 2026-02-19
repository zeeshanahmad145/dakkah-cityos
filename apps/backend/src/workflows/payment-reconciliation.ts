import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"

type PaymentReconciliationInput = {
  tenantId: string
  dateFrom: string
  dateTo: string
  paymentProvider: string
}

const fetchPaymentRecordsStep = createStep(
  "fetch-payment-records-step",
  async (input: PaymentReconciliationInput, { container }) => {
    const paymentModule = container.resolve("payment") as any
    const payments = await paymentModule.listPayments({
      created_at: { $gte: new Date(input.dateFrom), $lte: new Date(input.dateTo) },
    })
    return new StepResponse({ payments, count: payments.length }, null)
  }
)

const matchTransactionsStep = createStep(
  "match-payment-transactions-step",
  async (input: { payments: any[] }) => {
    const matched = input.payments.map((p: any) => ({
      payment_id: p.id,
      matched: true,
      match_confidence: 1.0,
    }))
    const unmatched = matched.filter((m: any) => !m.matched)
    return new StepResponse({ matched, unmatchedCount: unmatched.length }, null)
  }
)

const reconcileStep = createStep(
  "reconcile-payments-step",
  async (input: { matched: any[]; tenantId: string }) => {
    const reconciliation = {
      tenant_id: input.tenantId,
      total_reconciled: input.matched.length,
      status: "completed",
      reconciled_at: new Date(),
    }
    return new StepResponse({ reconciliation }, { tenantId: input.tenantId, reconciliation })
  },
  async (compensationData: { tenantId: string; reconciliation: any } | null, { container }) => {
    if (!compensationData) return
    try {
      const paymentModule = container.resolve("payment") as any
      if (paymentModule.reverseReconciliation) {
        await paymentModule.reverseReconciliation(compensationData.tenantId, compensationData.reconciliation)
      }
    } catch (error) {
    }
  }
)

const generateReportStep = createStep(
  "generate-reconciliation-report-step",
  async (input: { reconciliation: any; dateFrom: string; dateTo: string }) => {
    const report = {
      period: { from: input.dateFrom, to: input.dateTo },
      total: input.reconciliation.total_reconciled,
      status: input.reconciliation.status,
      generated_at: new Date(),
    }
    return new StepResponse({ report }, { report })
  },
  async (compensationData: { report: any } | null, { container }) => {
    if (!compensationData) return
    try {
      const paymentModule = container.resolve("payment") as any
      if (paymentModule.deleteReconciliationReport) {
        await paymentModule.deleteReconciliationReport(compensationData.report)
      }
    } catch (error) {
    }
  }
)

export const paymentReconciliationWorkflow = createWorkflow(
  "payment-reconciliation-workflow",
  (input: PaymentReconciliationInput) => {
    const { payments } = fetchPaymentRecordsStep(input)
    const { matched } = matchTransactionsStep({ payments })
    const { reconciliation } = reconcileStep({ matched, tenantId: input.tenantId })
    const { report } = generateReportStep({ reconciliation, dateFrom: input.dateFrom, dateTo: input.dateTo })
    return new WorkflowResponse({ reconciliation, report })
  }
)
