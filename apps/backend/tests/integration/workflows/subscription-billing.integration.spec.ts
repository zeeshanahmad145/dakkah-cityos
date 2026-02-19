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

jest.mock("stripe", () => jest.fn().mockImplementation(() => ({})))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Subscription Billing Workflow – Integration", () => {
  let loadBillingCycleStep: any
  let markCycleProcessingStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/subscription/process-billing-cycle-workflow.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    loadBillingCycleStep = calls.find((c: any) => c[0] === "load-billing-cycle")?.[1]
    markCycleProcessingStep = calls.find((c: any) => c[0] === "mark-cycle-processing")?.[1]
  })

  describe("end-to-end billing cycle processing", () => {
    it("should load billing cycle and transition to processing state", async () => {
      const mockCycle = {
        id: "cycle_01",
        status: "upcoming",
        subscription_id: "sub_01",
        attempt_count: 0,
        subscription: { id: "sub_01", customer_id: "cust_01" },
      }
      const container = mockContainer({
        subscription: {
          listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]),
          updateBillingCycles: jest.fn().mockResolvedValue({ ...mockCycle, status: "processing", attempt_count: 1 }),
        },
        query: {
          graph: jest.fn()
            .mockResolvedValueOnce({ data: [{ id: "item_01", variant_id: "var_01", quantity: 1 }] })
            .mockResolvedValueOnce({ data: [{ id: "cust_01", email: "customer@example.com" }] }),
        },
      })

      const loadResult = await loadBillingCycleStep({ billing_cycle_id: "cycle_01" }, { container })
      expect(loadResult.cycle.id).toBe("cycle_01")
      expect(loadResult.subscription.id).toBe("sub_01")

      const processResult = await markCycleProcessingStep({ cycle: mockCycle }, { container })
      expect(processResult.updatedCycle.status).toBe("processing")
      expect(processResult.updatedCycle.attempt_count).toBe(1)
    })

    it("should load subscription items and customer data", async () => {
      const mockCycle = {
        id: "cycle_02",
        status: "upcoming",
        subscription_id: "sub_02",
        subscription: { id: "sub_02", customer_id: "cust_02" },
      }
      const graphFn = jest.fn()
        .mockResolvedValueOnce({ data: [{ id: "item_01", variant_id: "var_01", quantity: 2 }, { id: "item_02", variant_id: "var_02", quantity: 1 }] })
        .mockResolvedValueOnce({ data: [{ id: "cust_02", email: "buyer@example.com", metadata: { stripe_id: "cus_abc" } }] })

      const container = mockContainer({
        subscription: { listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]) },
        query: { graph: graphFn },
      })

      const result = await loadBillingCycleStep({ billing_cycle_id: "cycle_02" }, { container })
      expect(result.items).toHaveLength(2)
      expect(result.customer.email).toBe("buyer@example.com")
      expect(graphFn).toHaveBeenCalledTimes(2)
    })
  })

  describe("step failure scenarios", () => {
    it("should reject billing cycle that is not found", async () => {
      const container = mockContainer({
        subscription: { listBillingCycles: jest.fn().mockResolvedValue([[]]) },
        query: { graph: jest.fn() },
      })

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "nonexistent" }, { container })
      ).rejects.toThrow("Billing cycle nonexistent not found")
    })

    it("should reject billing cycle not in upcoming status", async () => {
      const mockCycle = { id: "cycle_03", status: "completed" }
      const container = mockContainer({
        subscription: { listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]) },
        query: { graph: jest.fn() },
      })

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "cycle_03" }, { container })
      ).rejects.toThrow("is not in upcoming status")
    })

    it("should reject billing cycle in processing status", async () => {
      const mockCycle = { id: "cycle_04", status: "processing" }
      const container = mockContainer({
        subscription: { listBillingCycles: jest.fn().mockResolvedValue([[mockCycle]]) },
        query: { graph: jest.fn() },
      })

      await expect(
        loadBillingCycleStep({ billing_cycle_id: "cycle_04" }, { container })
      ).rejects.toThrow("is not in upcoming status")
    })
  })

  describe("compensation and state cleanup", () => {
    it("should provide compensation data for mark-cycle-processing step", async () => {
      const cycle = { id: "cycle_01", status: "upcoming", attempt_count: 0 }
      const container = mockContainer({
        subscription: {
          updateBillingCycles: jest.fn().mockResolvedValue({ ...cycle, status: "processing", attempt_count: 1 }),
        },
      })

      const result = await markCycleProcessingStep({ cycle }, { container })
      expect(result.__compensation).toEqual({
        cycleId: "cycle_01",
        previousStatus: "upcoming",
        previousAttemptCount: 0,
      })
    })

    it("should increment attempt count correctly on retry", async () => {
      const updateBillingCycles = jest.fn().mockResolvedValue({})
      const container = mockContainer({ subscription: { updateBillingCycles } })

      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 3 } },
        { container }
      )
      expect(updateBillingCycles).toHaveBeenCalledWith(
        expect.objectContaining({ attempt_count: 4 })
      )
    })

    it("should set last_attempt_at to a recent timestamp", async () => {
      const updateBillingCycles = jest.fn().mockResolvedValue({})
      const container = mockContainer({ subscription: { updateBillingCycles } })
      const before = new Date()

      await markCycleProcessingStep(
        { cycle: { id: "cycle_01", status: "upcoming", attempt_count: 0 } },
        { container }
      )

      const calledWith = updateBillingCycles.mock.calls[0][0]
      expect(calledWith.last_attempt_at).toBeInstanceOf(Date)
      expect(calledWith.last_attempt_at.getTime()).toBeGreaterThanOrEqual(before.getTime())
    })
  })
})
