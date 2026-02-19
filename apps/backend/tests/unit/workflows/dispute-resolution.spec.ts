jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Dispute Resolution Workflow", () => {
  let openDisputeStep: any
  let reviewDisputeStep: any
  let resolveDisputeStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/dispute-resolution.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
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
      const mockDispute = { id: "disp_01", status: "open", reason: "item_not_received" }
      const container = mockContainer({
        dispute: { createDisputes: jest.fn().mockResolvedValue(mockDispute) },
      })
      const result = await openDisputeStep(validInput, { container })
      expect(result.dispute).toEqual(mockDispute)
    })

    it("should pass all dispute fields correctly", async () => {
      const createDisputes = jest.fn().mockResolvedValue({ id: "disp_01" })
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
        dispute: { createDisputes: jest.fn().mockRejectedValue(new Error("Duplicate dispute")) },
      })
      await expect(openDisputeStep(validInput, { container })).rejects.toThrow("Duplicate dispute")
    })
  })

  describe("reviewDisputeStep", () => {
    it("should update dispute status to under_review", async () => {
      const mockUpdated = { id: "disp_01", status: "under_review" }
      const container = mockContainer({
        dispute: { updateDisputes: jest.fn().mockResolvedValue(mockUpdated) },
      })
      const result = await reviewDisputeStep({ disputeId: "disp_01" }, { container })
      expect(result.dispute).toEqual(mockUpdated)
    })

    it("should set reviewed_at timestamp", async () => {
      const updateDisputes = jest.fn().mockResolvedValue({})
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
        dispute: { updateDisputes: jest.fn().mockRejectedValue(new Error("Review failed")) },
      })
      await expect(reviewDisputeStep({ disputeId: "disp_01" }, { container })).rejects.toThrow("Review failed")
    })
  })

  describe("resolveDisputeStep", () => {
    it("should resolve dispute with given resolution", async () => {
      const mockResolved = { id: "disp_01", status: "resolved", resolution: "refund_issued" }
      const container = mockContainer({
        dispute: { updateDisputes: jest.fn().mockResolvedValue(mockResolved) },
      })
      const result = await resolveDisputeStep({ disputeId: "disp_01", resolution: "refund_issued" }, { container })
      expect(result.dispute).toEqual(mockResolved)
    })

    it("should set resolved_at timestamp", async () => {
      const updateDisputes = jest.fn().mockResolvedValue({})
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
        dispute: { updateDisputes: jest.fn().mockRejectedValue(new Error("Cannot resolve")) },
      })
      await expect(
        resolveDisputeStep({ disputeId: "disp_01", resolution: "refund_issued" }, { container })
      ).rejects.toThrow("Cannot resolve")
    })
  })
})
