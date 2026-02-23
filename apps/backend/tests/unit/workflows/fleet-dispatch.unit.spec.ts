jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => {
    return { run: jest.fn(), config, fn }
  }),
  createStep: jest.fn((_name, fn) => fn),
  StepResponse: jest.fn((data) => data),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Fleet Dispatch Workflow", () => {
  let prepareOrderForDispatchStep: any
  let findAvailableDriverStep: any
  let assignDriverStep: any
  let initializeTrackingStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/fleet-dispatch.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    prepareOrderForDispatchStep = calls.find((c: any) => c[0] === "prepare-order-dispatch-step")?.[1]
    findAvailableDriverStep = calls.find((c: any) => c[0] === "find-available-driver-step")?.[1]
    assignDriverStep = calls.find((c: any) => c[0] === "assign-driver-step")?.[1]
    initializeTrackingStep = calls.find((c: any) => c[0] === "initialize-delivery-tracking-step")?.[1]
  })

  describe("prepareOrderForDispatchStep", () => {
    it("should create a dispatch request with pending_assignment status", async () => {
      const input = {
        orderId: "order_1",
        pickupAddress: "123 Main St",
        deliveryAddress: "456 Oak Ave",
        packageWeight: 5,
        priority: "standard",
        tenantId: "tenant_1",
      }
      const result = await prepareOrderForDispatchStep(input)
      expect(result.dispatchRequest.order_id).toBe("order_1")
      expect(result.dispatchRequest.status).toBe("pending_assignment")
      expect(result.dispatchRequest.weight).toBe(5)
      expect(result.dispatchRequest.priority).toBe("standard")
    })

    it("should include pickup and delivery addresses", async () => {
      const input = {
        orderId: "order_2",
        pickupAddress: "Warehouse A",
        deliveryAddress: "Customer Home",
        packageWeight: 10,
        priority: "express",
        tenantId: "tenant_1",
      }
      const result = await prepareOrderForDispatchStep(input)
      expect(result.dispatchRequest.pickup).toBe("Warehouse A")
      expect(result.dispatchRequest.delivery).toBe("Customer Home")
    })
  })

  describe("findAvailableDriverStep", () => {
    it("should find a driver from fleetbase service", async () => {
      const drivers = [
        { id: "driver_1", name: "Alice", phone: "555-0001", vehicle_type: "van", current_location: "Zone A" },
      ]
      const container = mockContainer({
        fleetbaseService: { getAvailableDrivers: jest.fn().mockResolvedValue(drivers) },
      })
      const result = await findAvailableDriverStep(
        { pickupAddress: "123 Main St", priority: "standard" },
        { container }
      )
      expect(result.driver.driver_id).toBe("driver_1")
      expect(result.driver.name).toBe("Alice")
      expect(result.driver.source).toBe("fleetbase")
    })

    it("should fall back to manual queue when no drivers available", async () => {
      const container = mockContainer({
        fleetbaseService: { getAvailableDrivers: jest.fn().mockResolvedValue([]) },
      })
      const result = await findAvailableDriverStep(
        { pickupAddress: "123 Main St", priority: "standard" },
        { container }
      )
      expect(result.driver.name).toBe("Pending Manual Assignment")
      expect(result.driver.source).toBe("manual_queue")
    })

    it("should fall back to manual queue when fleetbase errors", async () => {
      const container = mockContainer({
        fleetbaseService: { getAvailableDrivers: jest.fn().mockRejectedValue(new Error("Service down")) },
      })
      const result = await findAvailableDriverStep(
        { pickupAddress: "123 Main St", priority: "express" },
        { container }
      )
      expect(result.driver.source).toBe("manual_queue")
    })

    it("should pass vehicle_type to fleetbase service", async () => {
      const getAvailableDrivers = jest.fn().mockResolvedValue([
        { id: "d1", name: "Bob", phone: "555", vehicle_type: "truck", current_location: "Z" },
      ])
      const container = mockContainer({ fleetbaseService: { getAvailableDrivers } })
      await findAvailableDriverStep(
        { pickupAddress: "123 Main St", priority: "standard", vehicle_type: "truck" },
        { container }
      )
      expect(getAvailableDrivers).toHaveBeenCalledWith(
        expect.objectContaining({ vehicle_type: "truck" })
      )
    })
  })

  describe("assignDriverStep", () => {
    it("should queue for manual assignment when source is manual_queue", async () => {
      const container = mockContainer()
      const result = await assignDriverStep(
        { orderId: "order_1", driverId: "manual_queue_123", source: "manual_queue" },
        { container }
      )
      expect(result.assignment.status).toBe("queued_for_manual_assignment")
      expect(result.assignment.order_id).toBe("order_1")
    })

    it("should assign via fleetbase when source is not manual_queue", async () => {
      const assignDriver = jest.fn()
      const container = mockContainer({ fleetbaseService: { assignDriver } })
      const result = await assignDriverStep(
        { orderId: "order_1", driverId: "driver_1", source: "fleetbase" },
        { container }
      )
      expect(result.assignment.status).toBe("assigned")
      expect(assignDriver).toHaveBeenCalledWith("order_1", "driver_1")
    })

    it("should fall back to manual queue on assignment error", async () => {
      const container = mockContainer({
        fleetbaseService: { assignDriver: jest.fn().mockRejectedValue(new Error("Network error")) },
      })
      const result = await assignDriverStep(
        { orderId: "order_1", driverId: "driver_1", source: "fleetbase" },
        { container }
      )
      expect(result.assignment.status).toBe("queued_for_manual_assignment")
      expect(result.assignment.assignment_error).toBe("Network error")
    })
  })

  describe("initializeTrackingStep", () => {
    it("should create a tracking record with in_transit status", async () => {
      const result = await initializeTrackingStep({ orderId: "order_1", driverId: "driver_1" })
      expect(result.tracking.order_id).toBe("order_1")
      expect(result.tracking.driver_id).toBe("driver_1")
      expect(result.tracking.status).toBe("in_transit")
      expect(result.tracking.tracking_id).toContain("TRK-order_1-")
    })
  })
})
