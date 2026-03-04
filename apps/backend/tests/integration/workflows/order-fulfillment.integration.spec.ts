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

describe("Order Fulfillment Workflow – Integration", () => {
  let validateOrderStep: any
  let allocateInventoryStep: any
  let createShipmentStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/order-fulfillment.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
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

  describe("end-to-end workflow execution", () => {
    it("should execute all steps in sequence for a valid order", async () => {
      const retrieveOrder = vi.fn().mockResolvedValue({ id: "order_01", status: "pending" })
      const createReservationItems = vi.fn().mockResolvedValue([{ id: "alloc_01" }, { id: "alloc_02" }])
      const createFulfillment = vi.fn().mockResolvedValue({ id: "ship_01", status: "created" })

      const container = mockContainer({
        order: { retrieveOrder },
        inventory: { createReservationItems },
        fulfillment: { createFulfillment },
      })

      const orderResult = await validateOrderStep(validInput, { container })
      expect(orderResult.order.id).toBe("order_01")
      expect(orderResult.order.status).toBe("pending")
      expect(retrieveOrder).toHaveBeenCalledWith("order_01")

      const allocResult = await allocateInventoryStep(validInput, { container })
      expect(allocResult.allocations).toHaveLength(2)
      expect(createReservationItems).toHaveBeenCalledWith([
        { line_item_id: "li_01", quantity: 2, location_id: "wh_01" },
        { line_item_id: "li_02", quantity: 1, location_id: "wh_01" },
      ])

      const shipResult = await createShipmentStep(validInput, { container })
      expect(shipResult.shipment.id).toBe("ship_01")
      expect(shipResult.shipment.status).toBe("created")
      expect(createFulfillment).toHaveBeenCalledWith({
        order_id: "order_01",
        items: validInput.items,
        shipping_method: "standard",
      })
    })

    it("should stop workflow when order validation fails", async () => {
      const retrieveOrder = vi.fn().mockResolvedValue(null)
      const container = mockContainer({
        order: { retrieveOrder },
      })

      await expect(validateOrderStep(validInput, { container })).rejects.toThrow("Order order_01 not found")
      expect(retrieveOrder).toHaveBeenCalledWith("order_01")
    })

    it("should resolve the correct modules from the container", async () => {
      const retrieveOrder = vi.fn().mockResolvedValue({ id: "order_01", status: "pending" })
      const createReservationItems = vi.fn().mockResolvedValue([])
      const createFulfillment = vi.fn().mockResolvedValue({ id: "ship_01" })

      const container = mockContainer({
        order: { retrieveOrder },
        inventory: { createReservationItems },
        fulfillment: { createFulfillment },
      })

      await validateOrderStep(validInput, { container })
      expect(container.resolve).toHaveBeenCalledWith("order")

      await allocateInventoryStep(validInput, { container })
      expect(container.resolve).toHaveBeenCalledWith("inventory")

      await createShipmentStep(validInput, { container })
      expect(container.resolve).toHaveBeenCalledWith("fulfillment")
    })

    it("should transform line items into reservation format for inventory", async () => {
      const createReservationItems = vi.fn().mockResolvedValue([{ id: "alloc_01" }])
      const container = mockContainer({
        inventory: { createReservationItems },
      })

      const inputWithSingleItem = {
        ...validInput,
        items: [{ lineItemId: "li_99", quantity: 5 }],
        warehouseId: "wh_west",
      }

      await allocateInventoryStep(inputWithSingleItem, { container })
      expect(createReservationItems).toHaveBeenCalledWith([
        { line_item_id: "li_99", quantity: 5, location_id: "wh_west" },
      ])
    })
  })

  describe("step failure with compensation", () => {
    it("should compensate inventory allocation when shipment creation fails", async () => {
      const deleteReservationItems = vi.fn().mockResolvedValue(undefined)
      const allocations = [{ id: "alloc_01" }, { id: "alloc_02" }]
      const container = mockContainer({
        inventory: {
          createReservationItems: vi.fn().mockResolvedValue(allocations),
          deleteReservationItems,
        },
        fulfillment: { createFulfillment: vi.fn().mockRejectedValue(new Error("Carrier unavailable")) },
      })

      const allocResult = await allocateInventoryStep(validInput, { container })
      expect(allocResult.__compensation).toEqual({ allocations })

      await expect(createShipmentStep(validInput, { container })).rejects.toThrow("Carrier unavailable")

      const compensateFn = allocateInventoryStep.compensate
      await compensateFn(allocResult.__compensation, { container })
      expect(deleteReservationItems).toHaveBeenCalledTimes(2)
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_01")
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_02")
    })

    it("should compensate shipment when a later error occurs", async () => {
      const cancelFulfillment = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        fulfillment: {
          createFulfillment: vi.fn().mockResolvedValue({ id: "ship_01" }),
          cancelFulfillment,
        },
      })

      const shipResult = await createShipmentStep(validInput, { container })
      expect(shipResult.__compensation).toEqual({ shipmentId: "ship_01" })

      const compensateFn = createShipmentStep.compensate
      await compensateFn(shipResult.__compensation, { container })
      expect(cancelFulfillment).toHaveBeenCalledWith("ship_01")
      expect(container.resolve).toHaveBeenCalledWith("fulfillment")
    })

    it("should handle compensation gracefully when compensationData is undefined", async () => {
      const deleteReservationItems = vi.fn()
      const container = mockContainer({
        inventory: { deleteReservationItems },
      })

      const compensateFn = allocateInventoryStep.compensate
      await expect(compensateFn(undefined, { container })).resolves.not.toThrow()
      expect(deleteReservationItems).not.toHaveBeenCalled()
    })

    it("should handle compensation gracefully when allocations array is empty", async () => {
      const deleteReservationItems = vi.fn()
      const container = mockContainer({
        inventory: { deleteReservationItems },
      })

      const compensateFn = allocateInventoryStep.compensate
      await compensateFn({ allocations: [] }, { container })
      expect(deleteReservationItems).not.toHaveBeenCalled()
    })
  })

  describe("state verification after compensation", () => {
    it("should leave no orphaned reservations after full compensation", async () => {
      const deleteReservationItems = vi.fn().mockResolvedValue(undefined)
      const allocations = [{ id: "alloc_01" }]
      const container = mockContainer({
        inventory: { deleteReservationItems },
      })

      await allocateInventoryStep.compensate({ allocations }, { container })
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_01")
      expect(deleteReservationItems).toHaveBeenCalledTimes(1)
    })

    it("should leave no orphaned fulfillments after shipment compensation", async () => {
      const cancelFulfillment = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        fulfillment: { cancelFulfillment },
      })

      await createShipmentStep.compensate({ shipmentId: "ship_01" }, { container })
      expect(cancelFulfillment).toHaveBeenCalledWith("ship_01")
      expect(cancelFulfillment).toHaveBeenCalledTimes(1)
    })

    it("should not throw when compensation service call fails", async () => {
      const container = mockContainer({
        inventory: { deleteReservationItems: vi.fn().mockRejectedValue(new Error("Already deleted")) },
      })

      await expect(
        allocateInventoryStep.compensate({ allocations: [{ id: "alloc_01" }] }, { container })
      ).resolves.not.toThrow()
    })

    it("should have compensation functions defined for compensable steps", () => {
      expect(allocateInventoryStep.compensate).toBeDefined()
      expect(createShipmentStep.compensate).toBeDefined()
    })

    it("should run allocate-inventory compensation idempotently", async () => {
      const deleteReservationItems = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        inventory: { deleteReservationItems },
      })

      const compensationData = { allocations: [{ id: "alloc_01" }, { id: "alloc_02" }] }

      await allocateInventoryStep.compensate(compensationData, { container })
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_01")
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_02")

      await expect(allocateInventoryStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(allocateInventoryStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should run create-shipment compensation idempotently", async () => {
      const cancelFulfillment = vi.fn().mockResolvedValue(undefined)
      const container = mockContainer({
        fulfillment: { cancelFulfillment },
      })

      const compensationData = { shipmentId: "ship_01" }

      await createShipmentStep.compensate(compensationData, { container })
      expect(cancelFulfillment).toHaveBeenCalledWith("ship_01")

      await expect(createShipmentStep.compensate(compensationData, { container })).resolves.not.toThrow()

      await expect(createShipmentStep.compensate(null, { container })).resolves.not.toThrow()
    })

    it("should compensate each allocation individually for partial failure resilience", async () => {
      const deleteReservationItems = vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce(undefined)
      const allocations = [{ id: "alloc_01" }, { id: "alloc_02" }, { id: "alloc_03" }]
      const container = mockContainer({
        inventory: { deleteReservationItems },
      })

      await expect(
        allocateInventoryStep.compensate({ allocations }, { container })
      ).resolves.not.toThrow()
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_01")
      expect(deleteReservationItems).toHaveBeenCalledWith("alloc_02")
    })
  })
})
