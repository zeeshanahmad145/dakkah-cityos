import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => ({ run: vi.fn(), config, fn })),
  createStep: vi.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: class { constructor(data, comp) { Object.assign(this, data); this.__compensation = comp; } },
  WorkflowResponse: vi.fn((data) => data),
  transform: vi.fn((_deps, fn) => fn(_deps)),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Vendor Payout Workflow – Integration", () => {
  let getUnpaidTransactionsStep: any
  let createPayoutStep: any
  let markTransactionsPaidStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/vendor/process-payout-workflow.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    getUnpaidTransactionsStep = calls.find((c: any) => c[0] === "get-unpaid-transactions-step")?.[1]
    createPayoutStep = calls.find((c: any) => c[0] === "create-payout-step")?.[1]
    markTransactionsPaidStep = calls.find((c: any) => c[0] === "mark-transactions-paid-step")?.[1]
  })

  const validInput = {
    vendorId: "vendor_01",
    tenantId: "tenant_01",
    storeId: "store_01",
    periodStart: new Date("2026-01-01"),
    periodEnd: new Date("2026-01-31"),
  }

  describe("end-to-end payout processing", () => {
    it("should gather transactions, create payout, and mark transactions paid", async () => {
      const transactions = [
        { id: "txn_01", order_total: 10000, commission_amount: 1000, platform_fee_amount: 200 },
        { id: "txn_02", order_total: 5000, commission_amount: 500, platform_fee_amount: 100 },
      ]
      const container = mockContainer({
        commission: {
          listCommissionTransactions: vi.fn().mockResolvedValue(transactions),
          updateCommissionTransactions: vi.fn().mockResolvedValue(undefined),
        },
        payout: {
          createVendorPayout: vi.fn().mockResolvedValue({ id: "payout_01", status: "pending" }),
        },
      })

      const txResult = await getUnpaidTransactionsStep(validInput, { container })
      expect(txResult.grossAmount).toBe(15000)
      expect(txResult.commissionAmount).toBe(1500)
      expect(txResult.platformFeeAmount).toBe(300)

      const payoutResult = await createPayoutStep(
        { ...validInput, transactionIds: ["txn_01", "txn_02"], grossAmount: 15000, commissionAmount: 1500, platformFeeAmount: 300, paymentMethod: "stripe_connect" },
        { container }
      )
      expect(payoutResult.payout.id).toBe("payout_01")

      await markTransactionsPaidStep(
        { transactionIds: ["txn_01", "txn_02"], payoutId: "payout_01" },
        { container }
      )
      expect(container.resolve("commission").updateCommissionTransactions).toHaveBeenCalled()
    })

    it("should calculate zero amounts when no transactions exist", async () => {
      const container = mockContainer({
        commission: { listCommissionTransactions: vi.fn().mockResolvedValue([]) },
      })

      const result = await getUnpaidTransactionsStep(validInput, { container })
      expect(result.grossAmount).toBe(0)
      expect(result.commissionAmount).toBe(0)
      expect(result.platformFeeAmount).toBe(0)
      expect(result.transactions).toHaveLength(0)
    })
  })

  describe("step failure with compensation", () => {
    it("should compensate payout when marking transactions fails", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const payout = { id: "payout_01", status: "pending" }
      const container = mockContainer({
        payout: {
          createVendorPayout: vi.fn().mockResolvedValue(payout),
          deletePayouts,
        },
        commission: {
          updateCommissionTransactions: vi.fn().mockRejectedValue(new Error("DB write error")),
        },
      })

      const payoutResult = await createPayoutStep(
        { ...validInput, transactionIds: ["txn_01"], grossAmount: 10000, commissionAmount: 1000, platformFeeAmount: 200, paymentMethod: "stripe_connect" },
        { container }
      )
      expect(payoutResult.__compensation).toEqual({ payout })

      await expect(
        markTransactionsPaidStep({ transactionIds: ["txn_01"], payoutId: "payout_01" }, { container })
      ).rejects.toThrow("DB write error")

      await createPayoutStep.compensate(payoutResult.__compensation, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")
    })

    it("should compensate transaction marks by reverting to unpaid status", async () => {
      const updateCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        commission: { updateCommissionTransactions },
      })

      const compensationData = { transactionIds: ["txn_01", "txn_02"] }
      await markTransactionsPaidStep.compensate(compensationData, { container })

      expect(updateCommissionTransactions).toHaveBeenCalledWith([
        expect.objectContaining({ id: "txn_01", payout_status: "unpaid", payout_id: null, paid_at: null }),
        expect.objectContaining({ id: "txn_02", payout_status: "unpaid", payout_id: null, paid_at: null }),
      ])
    })

    it("should handle compensation gracefully when payout has no id", async () => {
      const deletePayouts = vi.fn()
      const container = mockContainer({ payout: { deletePayouts } })

      await expect(createPayoutStep.compensate({ payout: {} }, { container })).resolves.not.toThrow()
      expect(deletePayouts).not.toHaveBeenCalled()
    })

    it("should handle compensation gracefully when compensationData is undefined", async () => {
      const container = mockContainer({ payout: { deletePayouts: vi.fn() } })
      await expect(createPayoutStep.compensate(undefined, { container })).resolves.not.toThrow()
    })
  })

  describe("state verification after compensation", () => {
    it("should leave no orphaned payouts after compensation", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({ payout: { deletePayouts } })

      await createPayoutStep.compensate({ payout: { id: "payout_01" } }, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")
    })

    it("should have compensation functions defined for compensable steps", () => {
      expect(createPayoutStep.compensate).toBeDefined()
      expect(markTransactionsPaidStep.compensate).toBeDefined()
    })

    it("should run create-payout compensation idempotently", async () => {
      const deletePayouts = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({ payout: { deletePayouts } })

      const compensationData = { payout: { id: "payout_01" } }

      await createPayoutStep.compensate(compensationData, { container })
      expect(deletePayouts).toHaveBeenCalledWith("payout_01")

      await expect(createPayoutStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(createPayoutStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should run mark-transactions-paid compensation idempotently", async () => {
      const updateCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({ commission: { updateCommissionTransactions } })

      const compensationData = { transactionIds: ["txn_01", "txn_02"] }

      await markTransactionsPaidStep.compensate(compensationData, { container })
      expect(updateCommissionTransactions).toHaveBeenCalledWith([
        expect.objectContaining({ id: "txn_01", payout_status: "unpaid", payout_id: null, paid_at: null }),
        expect.objectContaining({ id: "txn_02", payout_status: "unpaid", payout_id: null, paid_at: null }),
      ])

      await expect(markTransactionsPaidStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(markTransactionsPaidStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should revert all transaction statuses after compensation", async () => {
      const updateCommissionTransactions = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({ commission: { updateCommissionTransactions } })

      await markTransactionsPaidStep.compensate({ transactionIds: ["txn_01", "txn_02", "txn_03"] }, { container })

      const updateCall = updateCommissionTransactions.mock.calls[0][0]
      expect(updateCall).toHaveLength(3)
      updateCall.forEach((update: any) => {
        expect(update.payout_status).toBe("unpaid")
        expect(update.payout_id).toBeNull()
        expect(update.paid_at).toBeNull()
      })
    })
  })
})
