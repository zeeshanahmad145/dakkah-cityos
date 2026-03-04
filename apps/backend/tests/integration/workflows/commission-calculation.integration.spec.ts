import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => ({ run: vi.fn(), config, fn })),
  createStep: vi.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: class { constructor(data, comp) { Object.assign(this, data); this.__compensation = comp; } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Commission Calculation Workflow – Integration", () => {
  let calculateCommissionStep: any
  let deductCommissionStep: any
  let recordPayoutStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/commission-calculation.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
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
      const listCommissionRules = vi.fn().mockResolvedValue([{ rate: 0.15 }])
      const createCommissionTransaction = vi.fn().mockResolvedValue({ id: "txn_01", amount: 1200 })
      const createPayouts = vi.fn().mockResolvedValue({ id: "payout_01", amount: 6800, status: "pending" })

      const container = mockContainer({
        commission: { listCommissionRules, createCommissionTransaction },
        payout: { createPayouts },
      })

      const calcResult = await calculateCommissionStep(validInput, { container })
      expect(calcResult.commissionAmount).toBe(1200)
      expect(calcResult.netAmount).toBe(6800)
      expect(calcResult.rate).toBe(0.15)
      expect(calcResult.vendorId).toBe("vendor_01")
      expect(listCommissionRules).toHaveBeenCalledWith({ vendor_id: "vendor_01" })
      expect(calcResult.commissionAmount + calcResult.netAmount).toBe(validInput.orderSubtotal)

      const deductResult = await deductCommissionStep(
        { vendorId: "vendor_01", commissionAmount: 1200, orderId: "order_01" },
        { container }
      )
      expect(deductResult.transaction.id).toBe("txn_01")
      expect(createCommissionTransaction).toHaveBeenCalledWith({
        vendorId: "vendor_01",
        orderId: "order_01",
        amount: 1200,
        type: "deduction",
      })

      const payoutResult = await recordPayoutStep(
        { vendorId: "vendor_01", netAmount: 6800, orderId: "order_01" },
        { container }
      )
      expect(payoutResult.payout.amount).toBe(6800)
      expect(payoutResult.payout.status).toBe("pending")
      expect(createPayouts).toHaveBeenCalledWith({
        vendor_id: "vendor_01",
        amount: 6800,
        status: "pending",
        reference_id: "order_01",
      })
    })

    it("should use default 10% rate when no commission rules exist", async () => {
      const listCommissionRules = vi.fn().mockResolvedValue([])
      const container = mockContainer({
        commission: { listCommissionRules },
        payout: { createPayouts: vi.fn().mockResolvedValue({ id: "payout_02" }) },
      })

      const calcResult = await calculateCommissionStep(validInput, { container })
      expect(calcResult.rate).toBe(0.1)
      expect(calcResult.commissionAmount).toBe(800)
      expect(calcResult.netAmount).toBe(7200)
      expect(calcResult.commissionAmount + calcResult.netAmount).toBe(validInput.orderSubtotal)
    })

    it("should resolve correct modules from the container for each step", async () => {
      const container = mockContainer({
        commission: {
          listCommissionRules: vi.fn().mockResolvedValue([{ rate: 0.1 }]),
          createCommissionTransaction: vi.fn().mockResolvedValue({ id: "txn_01" }),
        },
        payout: { createPayouts: vi.fn().mockResolvedValue({ id: "payout_01" }) },
      })

      await calculateCommissionStep(validInput, { container })
      expect(container.resolve).toHaveBeenCalledWith("commission")

      await deductCommissionStep({ vendorId: "vendor_01", commissionAmount: 800, orderId: "order_01" }, { container })
      expect(container.resolve).toHaveBeenCalledWith("commission")

      await recordPayoutStep({ vendorId: "vendor_01", netAmount: 7200, orderId: "order_01" }, { container })
      expect(container.resolve).toHaveBeenCalledWith("payout")
    })
  })

  describe("step failure with compensation", () => {
    it("should compensate commission transaction when payout recording fails", async () => {
      const deleteCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const transaction = { id: "txn_01", amount: 1200 }
      const container = mockContainer({
        commission: {
          listCommissionRules: vi.fn().mockResolvedValue([{ rate: 0.15 }]),
          createCommissionTransaction: vi.fn().mockResolvedValue(transaction),
          deleteCommissionTransactions,
        },
        payout: {
          createPayouts: vi.fn().mockRejectedValue(new Error("Payout service unavailable")),
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
      expect(deleteCommissionTransactions).toHaveBeenCalledTimes(1)
    })

    it("should compensate payout when a downstream error occurs", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        payout: {
          createPayouts: vi.fn().mockResolvedValue({ id: "payout_01" }),
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
      expect(deletePayouts).toHaveBeenCalledTimes(1)
    })

    it("should handle compensation gracefully when compensationData is undefined", async () => {
      const deleteCommissionTransactions = vi.fn()
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      await expect(deductCommissionStep.compensate(undefined, { container })).resolves.not.toThrow()
      expect(deleteCommissionTransactions).not.toHaveBeenCalled()
    })

    it("should handle compensation gracefully when transaction id is missing", async () => {
      const deleteCommissionTransactions = vi.fn()
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      await deductCommissionStep.compensate({ transaction: {} }, { container })
      expect(deleteCommissionTransactions).not.toHaveBeenCalled()
    })
  })

  describe("state verification after compensation", () => {
    it("should leave no orphaned transactions after deduct compensation", async () => {
      const deleteCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      await deductCommissionStep.compensate({ transaction: { id: "txn_01" } }, { container })
      expect(deleteCommissionTransactions).toHaveBeenCalledWith("txn_01")
      expect(deleteCommissionTransactions).toHaveBeenCalledTimes(1)
    })

    it("should leave no orphaned payouts after payout compensation", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        payout: { deletePayouts },
      })

      await recordPayoutStep.compensate({ payoutId: "payout_01" }, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")
      expect(deletePayouts).toHaveBeenCalledTimes(1)
    })

    it("should not throw when compensation delete call fails", async () => {
      const container = mockContainer({
        commission: { deleteCommissionTransactions: vi.fn().mockRejectedValue(new Error("Already deleted")) },
      })

      await expect(
        deductCommissionStep.compensate({ transaction: { id: "txn_01" } }, { container })
      ).resolves.not.toThrow()
    })

    it("should have compensation functions defined for compensable steps", () => {
      expect(deductCommissionStep.compensate).toBeDefined()
      expect(recordPayoutStep.compensate).toBeDefined()
    })

    it("should run deduct-commission compensation idempotently", async () => {
      const deleteCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        commission: { deleteCommissionTransactions },
      })

      const compensationData = { transaction: { id: "txn_01" } }

      await deductCommissionStep.compensate(compensationData, { container })
      expect(deleteCommissionTransactions).toHaveBeenCalledWith("txn_01")

      await expect(deductCommissionStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(deductCommissionStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should run record-payout compensation idempotently", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        payout: { deletePayouts },
      })

      const compensationData = { payoutId: "payout_01" }

      await recordPayoutStep.compensate(compensationData, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")

      await expect(recordPayoutStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(recordPayoutStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should skip payout compensation when payoutId is missing", async () => {
      const deletePayouts = vi.fn()
      const container = mockContainer({
        payout: { deletePayouts },
      })

      await recordPayoutStep.compensate(undefined, { container })
      expect(deletePayouts).not.toHaveBeenCalled()

      await recordPayoutStep.compensate({}, { container })
      expect(deletePayouts).not.toHaveBeenCalled()
    })
  })
})
