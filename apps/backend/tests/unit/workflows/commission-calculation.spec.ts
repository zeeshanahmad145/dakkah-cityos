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

describe("Commission Calculation Workflow", () => {
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

  describe("calculateCommissionStep", () => {
    it("should calculate commission using rule rate", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: vi.fn().mockResolvedValue([{ rate: 0.15 }]) },
      })
      const result = await calculateCommissionStep(validInput, { container })
      expect(result.commissionAmount).toBe(1200)
      expect(result.rate).toBe(0.15)
      expect(result.netAmount).toBe(6800)
    })

    it("should use default rate of 0.1 when no rules exist", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: vi.fn().mockResolvedValue([]) },
      })
      const result = await calculateCommissionStep(validInput, { container })
      expect(result.commissionAmount).toBe(800)
      expect(result.rate).toBe(0.1)
      expect(result.netAmount).toBe(7200)
    })

    it("should round commission to nearest integer", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: vi.fn().mockResolvedValue([{ rate: 0.07 }]) },
      })
      const input = { ...validInput, orderSubtotal: 9999 }
      const result = await calculateCommissionStep(input, { container })
      expect(result.commissionAmount).toBe(Math.round(9999 * 0.07))
    })
  })

  describe("deductCommissionStep", () => {
    it("should create a commission deduction transaction", async () => {
      const mockTransaction = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "txn_01", amount: 800, type: "deduction" }
      const container = mockContainer({
        commission: { createCommissionTransaction: vi.fn().mockResolvedValue(mockTransaction) },
      })
      const result = await deductCommissionStep(
        { vendorId: "vendor_01", commissionAmount: 800, orderId: "order_01" },
        { container }
      )
      expect(result.transaction).toEqual(mockTransaction)
    })

    it("should propagate errors from commission module", async () => {
      const container = mockContainer({
        commission: { createCommissionTransaction: vi.fn().mockRejectedValue(new Error("DB error")) },
      })
      await expect(
        deductCommissionStep({ vendorId: "vendor_01", commissionAmount: 800, orderId: "order_01" }, { container })
      ).rejects.toThrow("DB error")
    })
  })

  describe("recordPayoutStep", () => {
    it("should create a pending payout record", async () => {
      const mockPayout = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "payout_01", amount: 7200, status: "pending" }
      const container = mockContainer({
        payout: { createPayouts: vi.fn().mockResolvedValue(mockPayout) },
      })
      const result = await recordPayoutStep(
        { vendorId: "vendor_01", netAmount: 7200, orderId: "order_01" },
        { container }
      )
      expect(result.payout).toEqual(mockPayout)
    })

    it("should call createPayouts with correct params", async () => {
      const createPayouts = vi.fn().mockResolvedValue({ id: "payout_02" })
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
        payout: { createPayouts: vi.fn().mockRejectedValue(new Error("Payout failed")) },
      })
      await expect(
        recordPayoutStep({ vendorId: "vendor_01", netAmount: 7200, orderId: "order_01" }, { container })
      ).rejects.toThrow("Payout failed")
    })
  })
})
