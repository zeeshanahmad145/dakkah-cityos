jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
  transform: jest.fn((_deps, fn) => fn(_deps)),
}))

jest.mock("@medusajs/framework/utils", () => ({
  ContainerRegistrationKeys: { QUERY: "query", LOGGER: "logger" },
  Modules: { EVENT_BUS: "event_bus" },
}))

jest.mock("@medusajs/medusa/core-flows", () => ({
  createCartWorkflow: jest.fn(),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Subscription Billing Workflow", () => {
  let loadBillingCycleStep: any
  let markCycleProcessingStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/subscription/process-billing-cycle-workflow.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    loadBillingCycleStep = calls.find((c: any) => c[0] === "load-billing-cycle")?.[1]
    markCycleProcessingStep = calls.find((c: any) => c[0] === "mark-cycle-processing")?.[1]
  })

  describe("loadBillingCycleStep", () => {
    it("should load billing cycle and subscription data", async () => {
      const mockCycle = {
        id: "cycle_01",
        status: "upcoming",
        subscription_id: "sub_01",
        subscription: { id: "sub_01", customer_id: "cust_01" },
      }
      const container = mockContainer({
        subscription: {
          listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]),
        },
        query: {
          graph: jest.fn()
            .mockResolvedValueOnce({ data: [{ id: "item_01", variant_id: "var_01", quantity: 1 }] })
            .mockResolvedValueOnce({ data: [{ id: "cust_01", email: "test@example.com" }] }),
        },
      })
      const result = await loadBillingCycleStep({ billing_cycle_id: "cycle_01" }, { container })
      expect(result.cycle).toEqual(mockCycle)
      expect(result.subscription).toEqual(mockCycle.subscription)
    })

    it("should throw when billing cycle is not found", async () => {
      const container = mockContainer({
        subscription: {
          listBillingCycles: jest.fn().mockResolvedValue([[]]),
        },
        query: { graph: jest.fn() },
      })
      await expect(
        loadBillingCycleStep({ billing_cycle_id: "nonexistent" }, { container })
      ).rejects.toThrow("Billing cycle nonexistent not found")
    })

    it("should throw when billing cycle is not in upcoming status", async () => {
      const mockCycle = { id: "cycle_01", status: "completed" }
      const container = mockContainer({
        subscription: {
          listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]),
        },
        query: { graph: jest.fn() },
      })
      await expect(
        loadBillingCycleStep({ billing_cycle_id: "cycle_01" }, { container })
      ).rejects.toThrow("is not in upcoming status")
    })
  })

  describe("markCycleProcessingStep", () => {
    it("should update billing cycle status to processing", async () => {
      const mockUpdated = { id: "cycle_01", status: "processing", attempt_count: 1 }
      const container = mockContainer({
        subscription: {
          updateBillingCycles: jest.fn().mockResolvedValue(mockUpdated),
        },
      })
      const result = await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 0 } },
        { container }
      )
      expect(result.updatedCycle).toEqual(mockUpdated)
    })

    it("should increment attempt count", async () => {
      const updateBillingCycles = jest.fn().mockResolvedValue({})
      const container = mockContainer({ subscription: { updateBillingCycles } })
      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 2 } },
        { container }
      )
      expect(updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_count: 3 })
      )
    })

    it("should set last_attempt_at to current time", async () => {
      const updateBillingCycles = jest.fn().mockResolvedValue({})
      const container = mockContainer({ subscription: { updateBillingCycles } })
      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 0 } },
        { container }
      )
      expect(updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({ last_attempt_at: expect.any(Date) })
      )
    })
  })
})
