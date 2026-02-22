jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Order Fulfillment Workflow", () => {
  let validateOrderStep: any
  let allocateInventoryStep: any
  let createShipmentStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/order-fulfillment.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    validateOrderStep = calls.find((c: any) => c[0] === "validate-order-step")?.[1]
    allocateInventoryStep = calls.find((c: any) => c[0] === "allocate-inventory-step")?.[1]
    createShipmentStep = calls.find((c: any) => c[0] === "create-shipment-step")?.[1]
  })

  const validInput = {
    orderId: "order_01",
    items: [{ lineItemId: "li_01", quantity: 2 }, { lineItemId: "li_02", quantity: 1 }],
    shippingMethod: "standard",
    warehouseId: "wh_01",
  }

  describe("validateOrderStep", () => {
    it("should validate and return an existing order", async () => {
      const mockOrder = { id: "order_01", status: "pending" }
      const container = mockContainer({ order: { retrieveOrder: jest.fn().mockResolvedValue(mockOrder) } })
      const result = await validateOrderStep(validInput, { container })
      expect(result.order).toEqual(mockOrder)
    })

    it("should throw when order is not found", async () => {
      const container = mockContainer({ order: { retrieveOrder: jest.fn().mockResolvedValue(null) } })
      await expect(validateOrderStep(validInput, { container })).rejects.toThrow("Order order_01 not found")
    })

    it("should call retrieveOrder with the correct order ID", async () => {
      const retrieveOrder = jest.fn().mockResolvedValue({ id: "order_01" })
      const container = mockContainer({ order: { retrieveOrder } })
      await validateOrderStep(validInput, { container })
      expect(retrieveOrder).toHaveBeenCalledWith("order_01")
    })
  })

  describe("allocateInventoryStep", () => {
    it("should create reservation items for each line item", async () => {
      const mockAllocations = [{ id: "alloc_01" }, { id: "alloc_02" }]
      const container = mockContainer({
        inventory: { createReservationItems: jest.fn().mockResolvedValue(mockAllocations) },
      })
      const result = await allocateInventoryStep(validInput, { container })
      expect(result.allocations).toEqual(mockAllocations)
    })

    it("should pass correct reservation parameters", async () => {
      const createReservationItems = jest.fn().mockResolvedValue([])
      const container = mockContainer({ inventory: { createReservationItems } })
      await allocateInventoryStep(validInput, { container })
      expect(createReservationItems).toHaveBeenCalledWith([
        { line_item_id: "li_01", quantity: 2, location_id: "wh_01" },
        { line_item_id: "li_02", quantity: 1, location_id: "wh_01" },
      ])
    })

    it("should propagate inventory allocation errors", async () => {
      const container = mockContainer({
        inventory: { createReservationItems: jest.fn().mockRejectedValue(new Error("Out of stock")) },
      })
      await expect(allocateInventoryStep(validInput, { container })).rejects.toThrow("Out of stock")
    })
  })

  describe("createShipmentStep", () => {
    it("should create a fulfillment shipment", async () => {
      const mockShipment = { id: "ship_01", status: "created" }
      const container = mockContainer({
        fulfillment: { createFulfillment: jest.fn().mockResolvedValue(mockShipment) },
      })
      const result = await createShipmentStep(validInput, { container })
      expect(result.shipment).toEqual(mockShipment)
    })

    it("should pass correct fulfillment parameters", async () => {
      const createFulfillment = jest.fn().mockResolvedValue({ id: "ship_01" })
      const container = mockContainer({ fulfillment: { createFulfillment } })
      await createShipmentStep(validInput, { container })
      expect(createFulfillment).toHaveBeenCalledWith({
        order_id: "order_01",
        items: validInput.items,
        shipping_method: "standard",
      })
    })

    it("should propagate fulfillment creation errors", async () => {
      const container = mockContainer({
        fulfillment: { createFulfillment: jest.fn().mockRejectedValue(new Error("Carrier unavailable")) },
      })
      await expect(createShipmentStep(validInput, { container })).rejects.toThrow("Carrier unavailable")
    })
  })
})
