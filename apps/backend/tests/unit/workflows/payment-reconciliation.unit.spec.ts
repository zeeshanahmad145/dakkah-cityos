jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => {
    return { run: jest.fn(), config, fn }
  }),
  createStep: jest.fn((_name, fn) => fn),
  StepResponse: jest.fn((data) => data),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Payment Reconciliation Workflow", () => {
  let fetchPaymentRecordsStep: any
  let fetchOrderRecordsStep: any
  let matchTransactionsStep: any
  let reconcileStep: any
  let generateReportStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/payment-reconciliation.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    fetchPaymentRecordsStep = calls.find((c: any) => c[0] === "fetch-payment-records-step")?.[1]
    fetchOrderRecordsStep = calls.find((c: any) => c[0] === "fetch-order-records-step")?.[1]
    matchTransactionsStep = calls.find((c: any) => c[0] === "match-payment-transactions-step")?.[1]
    reconcileStep = calls.find((c: any) => c[0] === "reconcile-payments-step")?.[1]
    generateReportStep = calls.find((c: any) => c[0] === "generate-reconciliation-report-step")?.[1]
  })

  describe("matchTransactionsStep", () => {
    it("should match payments to orders by reference_id with confidence 1.0", async () => {
      const payments = [{ id: "pay_1", amount: 100, reference_id: "order_1", created_at: "2025-01-01T10:00:00Z" }]
      const orders = [{ id: "order_1", total: 100, created_at: "2025-01-01T10:00:00Z" }]
      const result = await matchTransactionsStep({ payments, orders })
      expect(result.matchedCount).toBe(1)
      expect(result.unmatchedCount).toBe(0)
      expect(result.matched[0].confidence).toBe(1.0)
      expect(result.matched[0].payment_id).toBe("pay_1")
      expect(result.matched[0].order_id).toBe("order_1")
    })

    it("should match by amount and date proximity with confidence 0.8", async () => {
      const payments = [{ id: "pay_1", amount: 50, reference_id: null, created_at: "2025-01-01T10:00:00Z" }]
      const orders = [{ id: "order_1", total: 50, created_at: "2025-01-01T12:00:00Z" }]
      const result = await matchTransactionsStep({ payments, orders })
      expect(result.matchedCount).toBe(1)
      expect(result.matched[0].confidence).toBe(0.8)
    })

    it("should not match when amount difference exceeds tolerance", async () => {
      const payments = [{ id: "pay_1", amount: 100, reference_id: null, created_at: "2025-01-01T10:00:00Z" }]
      const orders = [{ id: "order_1", total: 200, created_at: "2025-01-01T10:00:00Z" }]
      const result = await matchTransactionsStep({ payments, orders })
      expect(result.matchedCount).toBe(0)
      expect(result.unmatchedCount).toBe(1)
      expect(result.unmatched[0].reason).toContain("No matching order")
    })

    it("should not match when date difference exceeds 24 hours and no reference", async () => {
      const payments = [{ id: "pay_1", amount: 100, reference_id: null, created_at: "2025-01-01T10:00:00Z" }]
      const orders = [{ id: "order_1", total: 100, created_at: "2025-01-05T10:00:00Z" }]
      const result = await matchTransactionsStep({ payments, orders })
      expect(result.matchedCount).toBe(0)
      expect(result.unmatchedCount).toBe(1)
    })

    it("should handle multiple payments and avoid duplicate order matching", async () => {
      const payments = [
        { id: "pay_1", amount: 50, reference_id: "order_1", created_at: "2025-01-01T10:00:00Z" },
        { id: "pay_2", amount: 50, reference_id: null, created_at: "2025-01-01T10:00:00Z" },
      ]
      const orders = [{ id: "order_1", total: 50, created_at: "2025-01-01T10:00:00Z" }]
      const result = await matchTransactionsStep({ payments, orders })
      expect(result.matchedCount).toBe(1)
      expect(result.unmatchedCount).toBe(1)
    })

    it("should handle empty payments array", async () => {
      const result = await matchTransactionsStep({ payments: [], orders: [] })
      expect(result.matchedCount).toBe(0)
      expect(result.unmatchedCount).toBe(0)
      expect(result.totalPayments).toBe(0)
    })
  })

  describe("reconcileStep", () => {
    it("should mark status as completed when all matched", async () => {
      const matched = [{ confidence: 1.0 }, { confidence: 0.8 }]
      const result = await reconcileStep({ matched, unmatchedCount: 0, tenantId: "tenant_1" })
      expect(result.reconciliation.status).toBe("completed")
      expect(result.reconciliation.total_reconciled).toBe(2)
      expect(result.reconciliation.total_unmatched).toBe(0)
    })

    it("should mark status as partial when there are unmatched payments", async () => {
      const matched = [{ confidence: 1.0 }]
      const result = await reconcileStep({ matched, unmatchedCount: 3, tenantId: "tenant_1" })
      expect(result.reconciliation.status).toBe("partial")
      expect(result.reconciliation.total_unmatched).toBe(3)
    })

    it("should count high and low confidence matches separately", async () => {
      const matched = [{ confidence: 1.0 }, { confidence: 1.0 }, { confidence: 0.8 }]
      const result = await reconcileStep({ matched, unmatchedCount: 0, tenantId: "tenant_1" })
      expect(result.reconciliation.high_confidence).toBe(2)
      expect(result.reconciliation.low_confidence).toBe(1)
    })

    it("should include tenant_id and reconciled_at timestamp", async () => {
      const result = await reconcileStep({ matched: [], unmatchedCount: 0, tenantId: "tenant_42" })
      expect(result.reconciliation.tenant_id).toBe("tenant_42")
      expect(result.reconciliation.reconciled_at).toBeInstanceOf(Date)
    })
  })

  describe("generateReportStep", () => {
    it("should generate a report with period and summary", async () => {
      const reconciliation = {
        total_reconciled: 5,
        total_unmatched: 1,
        high_confidence: 3,
        low_confidence: 2,
        status: "partial",
      }
      const result = await generateReportStep({
        reconciliation,
        unmatched: [{ payment_id: "pay_x" }],
        dateFrom: "2025-01-01",
        dateTo: "2025-01-31",
      })
      expect(result.report.period.from).toBe("2025-01-01")
      expect(result.report.period.to).toBe("2025-01-31")
      expect(result.report.total_reconciled).toBe(5)
      expect(result.report.unmatched_payments).toHaveLength(1)
      expect(result.report.generated_at).toBeInstanceOf(Date)
    })
  })
})
