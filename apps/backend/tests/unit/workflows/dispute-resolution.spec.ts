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

describe("Dispute Resolution Workflow", () => {
  let openDisputeStep: any
  let reviewDisputeStep: any
  let resolveDisputeStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/dispute-resolution.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    openDisputeStep = calls.find((c: any) => c[0] === "open-dispute-step")?.[1]
    reviewDisputeStep = calls.find((c: any) => c[0] === "review-dispute-step")?.[1]
    resolveDisputeStep = calls.find((c: any) => c[0] === "resolve-dispute-step")?.[1]
  })

  const validInput = {
    orderId: "order_01",
    customerId: "cust_01",
    vendorId: "vendor_01",
    reason: "item_not_received",
    description: "I never received my order after 30 days.",
    evidenceUrls: ["https://example.com/evidence1.png"],
  }

  describe("openDisputeStep", () => {
    it("should create a dispute with open status", async () => {
      const mockDispute = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "disp_01", status: "open", reason: "item_not_received" }
      const container = mockContainer({
        dispute: { createDisputes: vi.fn().mockResolvedValue(mockDispute) },
      })
      const result = await openDisputeStep(validInput, { container })
      expect(result.dispute).toEqual(mockDispute)
    })

    it("should pass all dispute fields correctly", async () => {
      const createDisputes = vi.fn().mockResolvedValue({ id: "disp_01" })
      const container = mockContainer({ dispute: { createDisputes } })
      await openDisputeStep(validInput, { container })
      expect(createDisputes).toHaveBeenCalledWith({
        order_id: "order_01",
        customer_id: "cust_01",
        vendor_id: "vendor_01",
        reason: "item_not_received",
        description: "I never received my order after 30 days.",
        status: "open",
      })
    })

    it("should propagate dispute creation errors", async () => {
      const container = mockContainer({
        dispute: { createDisputes: vi.fn().mockRejectedValue(new Error("Duplicate dispute")) },
      })
      await expect(openDisputeStep(validInput, { container })).rejects.toThrow("Duplicate dispute")
    })
  })

  describe("reviewDisputeStep", () => {
    it("should update dispute status to under_review", async () => {
      const mockUpdated = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "disp_01", status: "under_review" }
      const container = mockContainer({
        dispute: { updateDisputes: vi.fn().mockResolvedValue(mockUpdated) },
      })
      const result = await reviewDisputeStep({ disputeId: "disp_01" }, { container })
      expect(result.dispute).toEqual(mockUpdated)
    })

    it("should set reviewed_at timestamp", async () => {
      const updateDisputes = vi.fn().mockResolvedValue({})
      const container = mockContainer({ dispute: { updateDisputes } })
      await reviewDisputeStep({ disputeId: "disp_01" }, { container })
      expect(updateDisputes).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "under_review",
          reviewed_at: expect.any(Date),
        })
      )
    })

    it("should propagate review errors", async () => {
      const container = mockContainer({
        dispute: { updateDisputes: vi.fn().mockRejectedValue(new Error("Review failed")) },
      })
      await expect(reviewDisputeStep({ disputeId: "disp_01" }, { container })).rejects.toThrow("Review failed")
    })
  })

  describe("resolveDisputeStep", () => {
    it("should resolve dispute with given resolution", async () => {
      const mockResolved = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "disp_01", status: "resolved", resolution: "refund_issued" }
      const container = mockContainer({
        dispute: { updateDisputes: vi.fn().mockResolvedValue(mockResolved) },
      })
      const result = await resolveDisputeStep({ disputeId: "disp_01", resolution: "refund_issued" }, { container })
      expect(result.dispute).toEqual(mockResolved)
    })

    it("should set resolved_at timestamp", async () => {
      const updateDisputes = vi.fn().mockResolvedValue({})
      const container = mockContainer({ dispute: { updateDisputes } })
      await resolveDisputeStep({ disputeId: "disp_01", resolution: "refund_issued" }, { container })
      expect(updateDisputes).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "resolved",
          resolution: "refund_issued",
          resolved_at: expect.any(Date),
        })
      )
    })

    it("should propagate resolution errors", async () => {
      const container = mockContainer({
        dispute: { updateDisputes: vi.fn().mockRejectedValue(new Error("Cannot resolve")) },
      })
      await expect(
        resolveDisputeStep({ disputeId: "disp_01", resolution: "refund_issued" }, { container })
      ).rejects.toThrow("Cannot resolve")
    })
  })
})
