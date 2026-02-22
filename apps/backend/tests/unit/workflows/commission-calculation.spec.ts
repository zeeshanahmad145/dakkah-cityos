jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Commission Calculation Workflow", () => {
  let calculateCommissionStep: any
  let deductCommissionStep: any
  let recordPayoutStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/commission-calculation.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    calculateCommissionStep = calls.find((c: any) => c[0] === "calculate-vendor-commission-step")?.[1]
    deductCommissionStep = calls.find((c: any) => c[0] === "deduct-commission-step")?.[1]
    recordPayoutStep = calls.find((c: any) => c[0] === "record-commission-payout-step")?.[1]
  })

  const validInput = {
    vendorId: "vendor_01",
    orderId: "order_01",
    orderTotal: 10000,
    orderSubtotal: 8000,
    tenantId: "tenant_01",
    lineItems: [{ id: "li_01", amount: 5000 }, { id: "li_02", amount: 3000 }],
  }

  describe("calculateCommissionStep", () => {
    it("should calculate commission using rule rate", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.15 }]) },
      })
      const result = await calculateCommissionStep(validInput, { container })
      expect(result.commissionAmount).toBe(1200)
      expect(result.rate).toBe(0.15)
      expect(result.netAmount).toBe(6800)
    })

    it("should use default rate of 0.1 when no rules exist", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([]) },
      })
      const result = await calculateCommissionStep(validInput, { container })
      expect(result.commissionAmount).toBe(800)
      expect(result.rate).toBe(0.1)
      expect(result.netAmount).toBe(7200)
    })

    it("should round commission to nearest integer", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.07 }]) },
      })
      const input = { ...validInput, orderSubtotal: 9999 }
      const result = await calculateCommissionStep(input, { container })
      expect(result.commissionAmount).toBe(Math.round(9999 * 0.07))
    })
  })

  describe("deductCommissionStep", () => {
    it("should create a commission deduction transaction", async () => {
      const mockTransaction = { id: "txn_01", amount: 800, type: "deduction" }
      const container = mockContainer({
        commission: { createCommissionTransaction: jest.fn().mockResolvedValue(mockTransaction) },
      })
      const result = await deductCommissionStep(
        { vendorId: "vendor_01", commissionAmount: 800, orderId: "order_01" },
        { container }
      )
      expect(result.transaction).toEqual(mockTransaction)
    })

    it("should propagate errors from commission module", async () => {
      const container = mockContainer({
        commission: { createCommissionTransaction: jest.fn().mockRejectedValue(new Error("DB error")) },
      })
      await expect(
        deductCommissionStep({ vendorId: "vendor_01", commissionAmount: 800, orderId: "order_01" }, { container })
      ).rejects.toThrow("DB error")
    })
  })

  describe("recordPayoutStep", () => {
    it("should create a pending payout record", async () => {
      const mockPayout = { id: "payout_01", amount: 7200, status: "pending" }
      const container = mockContainer({
        payout: { createPayouts: jest.fn().mockResolvedValue(mockPayout) },
      })
      const result = await recordPayoutStep(
        { vendorId: "vendor_01", netAmount: 7200, orderId: "order_01" },
        { container }
      )
      expect(result.payout).toEqual(mockPayout)
    })

    it("should call createPayouts with correct params", async () => {
      const createPayouts = jest.fn().mockResolvedValue({ id: "payout_02" })
      const container = mockContainer({ payout: { createPayouts } })
      await recordPayoutStep({ vendorId: "vendor_01", netAmount: 5000, orderId: "order_02" }, { container })
      expect(createPayouts).toHaveBeenCalledWith({
        vendor_id: "vendor_01",
        amount: 5000,
        status: "pending",
        reference_id: "order_02",
      })
    })

    it("should propagate errors from payout module", async () => {
      const container = mockContainer({
        payout: { createPayouts: jest.fn().mockRejectedValue(new Error("Payout failed")) },
      })
      await expect(
        recordPayoutStep({ vendorId: "vendor_01", netAmount: 7200, orderId: "order_01" }, { container })
      ).rejects.toThrow("Payout failed")
    })
  })
})
