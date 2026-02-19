jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Commission Calculation Workflow – Integration", () => {
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

  describe("end-to-end workflow execution", () => {
    it("should calculate commission, deduct, and record payout in sequence", async () => {
      const container = mockContainer({
        commission: {
          listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.15 }]),
          createCommissionTransaction: jest.fn().mockResolvedValue({ id: "txn_01", amount: 1200 }),
        },
        payout: {
          createPayouts: jest.fn().mockResolvedValue({ id: "payout_01", amount: 6800, status: "pending" }),
        },
      })

      const calcResult = await calculateCommissionStep(validInput, { container })
      expect(calcResult.commissionAmount).toBe(1200)
      expect(calcResult.netAmount).toBe(6800)

      const deductResult = await deductCommissionStep(
        { vendorId: "vendor_01", commissionAmount: 1200, orderId: "order_01" },
        { container }
      )
      expect(deductResult.transaction.id).toBe("txn_01")

      const payoutResult = await recordPayoutStep(
        { vendorId: "vendor_01", netAmount: 6800, orderId: "order_01" },
        { container }
      )
      expect(payoutResult.payout.amount).toBe(6800)
    })

    it("should use default 10% rate when no commission rules exist", async () => {
      const container = mockContainer({
        commission: {
          listCommissionRules: jest.fn().mockResolvedValue([]),
          createCommissionTransaction: jest.fn().mockResolvedValue({ id: "txn_02" }),
        },
        payout: {
          createPayouts: jest.fn().mockResolvedValue({ id: "payout_02" }),
        },
      })

      const calcResult = await calculateCommissionStep(validInput, { container })
      expect(calcResult.rate).toBe(0.1)
      expect(calcResult.commissionAmount).toBe(800)
      expect(calcResult.netAmount).toBe(7200)
    })
  })

  describe("step failure with compensation", () => {
    it("should compensate commission transaction when payout recording fails", async () => {
      const deleteCommissionTransactions = jest.fn().mockResolvedValue(undefined)
      const transaction = { id: "txn_01", amount: 1200 }
      const container = mockContainer({
        commission: {
          listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.15 }]),
          createCommissionTransaction: jest.fn().mockResolvedValue(transaction),
          deleteCommissionTransactions,
        },
        payout: {
          createPayouts: jest.fn().mockRejectedValue(new Error("Payout service unavailable")),
        },
      })

      const deductResult = await deductCommissionStep(
        { vendorId: "vendor_01", commissionAmount: 1200, orderId: "order_01" },
        { container }
      )
      expect(deductResult.__compensation).toEqual({ transaction })

      await expect(
        recordPayoutStep({ vendorId: "vendor_01", netAmount: 6800, orderId: "order_01" }, { container })
      ).rejects.toThrow("Payout service unavailable")

      await deductCommissionStep.compensate(deductResult.__compensation, { container })
      expect(deleteCommissionTransactions).toHaveBeenCalledWith("txn_01")
    })

    it("should compensate payout when a downstream error occurs", async () => {
      const deletePayouts = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        payout: {
          createPayouts: jest.fn().mockResolvedValue({ id: "payout_01" }),
          deletePayouts,
        },
      })

      const payoutResult = await recordPayoutStep(
        { vendorId: "vendor_01", netAmount: 6800, orderId: "order_01" },
        { container }
      )
      expect(payoutResult.__compensation).toEqual({ payoutId: "payout_01" })

      await recordPayoutStep.compensate(payoutResult.__compensation, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")
    })

    it("should handle compensation gracefully when compensationData is undefined", async () => {
      const container = mockContainer({
        commission: { deleteCommissionTransactions: jest.fn() },
      })

      await expect(deductCommissionStep.compensate(undefined, { container })).resolves.not.toThrow()
    })

    it("should handle compensation gracefully when transaction id is missing", async () => {
      const deleteCommissionTransactions = jest.fn()
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      await deductCommissionStep.compensate({ transaction: {} }, { container })
      expect(deleteCommissionTransactions).not.toHaveBeenCalled()
    })
  })

  describe("state verification after compensation", () => {
    it("should leave no orphaned transactions after deduct compensation", async () => {
      const deleteCommissionTransactions = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      await deductCommissionStep.compensate({ transaction: { id: "txn_01" } }, { container })
      expect(deleteCommissionTransactions).toHaveBeenCalledWith("txn_01")
    })

    it("should leave no orphaned payouts after payout compensation", async () => {
      const deletePayouts = jest.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        payout: { deletePayouts },
      })

      await recordPayoutStep.compensate({ payoutId: "payout_01" }, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")
    })

    it("should not throw when compensation delete call fails", async () => {
      const container = mockContainer({
        commission: { deleteCommissionTransactions: jest.fn().mockRejectedValue(new Error("Already deleted")) },
      })

      await expect(
        deductCommissionStep.compensate({ transaction: { id: "txn_01" } }, { container })
      ).resolves.not.toThrow()
    })
  })
})
