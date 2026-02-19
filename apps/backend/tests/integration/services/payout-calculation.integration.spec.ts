jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
  transform: jest.fn((_deps, fn) => fn(_deps)),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Payout Calculation Accuracy", () => {
  let getUnpaidTransactionsStep: any
  let createPayoutStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/vendor/process-payout-workflow.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    getUnpaidTransactionsStep = calls.find((c: any) => c[0] === "get-unpaid-transactions-step")?.[1]
    createPayoutStep = calls.find((c: any) => c[0] === "create-payout-step")?.[1]
  })

  const baseInput = {
    vendorId: "vendor_01",
    tenantId: "tenant_01",
    periodStart: new Date("2026-01-01"),
    periodEnd: new Date("2026-01-31"),
  }

  describe("gross amount calculation", () => {
    it("should sum order totals for single transaction", async () => {
      const transactions = [{ id: "txn_01", order_total: 15000, commission_amount: 1500, platform_fee_amount: 300 }]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.grossAmount).toBe(15000)
    })

    it("should sum order totals across multiple transactions", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 200 },
        { id: "txn_02", order_total: 25000, commission_amount: 2500, platform_fee_amount: 500 },
        { id: "txn_03", order_total: 7500, commission_amount: 750, platform_fee_amount: 150 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.grossAmount).toBe(42500)
    })

    it("should return zero gross amount for no transactions", async () => {
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue([]) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.grossAmount).toBe(0)
    })
  })

  describe("commission amount aggregation", () => {
    it("should sum commission amounts correctly", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 0 },
        { id: "txn_02", order_total: 20000, commission_amount: 3000, platform_fee_amount: 0 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.commissionAmount).toBe(4000)
    })

    it("should handle mixed commission rates across transactions", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 100 },
        { id: "txn_02", order_total: 10000, commission_amount: 1500, platform_fee_amount: 150 },
        { id: "txn_03", order_total: 10000, commission_amount: 2000, platform_fee_amount: 200 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.commissionAmount).toBe(4500)
      expect(result.platformFeeAmount).toBe(450)
    })
  })

  describe("platform fee calculation", () => {
    it("should sum platform fees separately from commissions", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 250 },
        { id: "txn_02", order_total: 5000, commission_amount: 500, platform_fee_amount: 125 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.platformFeeAmount).toBe(375)
    })

    it("should handle transactions without platform fees (defaulting to 0)", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 0 },
        { id: "txn_02", order_total: 5000, commission_amount: 500 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.platformFeeAmount).toBe(0)
    })
  })

  describe("net payout amount verification", () => {
    it("should verify net payout equals gross minus commission minus platform fee", async () => {
      const transactions = [
        { id: "txn_01", order_total: 50000, commission_amount: 5000, platform_fee_amount: 1000 },
      ]
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      const netPayout = result.grossAmount - result.commissionAmount - result.platformFeeAmount
      expect(netPayout).toBe(44000)
    })

    it("should handle high-volume vendor with many transactions", async () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `txn_${i}`,
        order_total: 1000,
        commission_amount: 100,
        platform_fee_amount: 20,
      }))
      const container = mockContainer({
        commission: { listCommissionTransactions: jest.fn().mockResolvedValue(transactions) },
      })

      const result = await getUnpaidTransactionsStep(baseInput, { container })
      expect(result.grossAmount).toBe(100000)
      expect(result.commissionAmount).toBe(10000)
      expect(result.platformFeeAmount).toBe(2000)
    })
  })
})
