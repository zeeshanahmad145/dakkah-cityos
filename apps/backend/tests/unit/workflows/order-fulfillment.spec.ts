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

describe("Order Fulfillment Workflow", () => {
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

  describe("validateOrderStep", () => {
    it("should validate and return an existing order", async () => {
      const mockOrder = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "order_01", status: "pending" }
      const container = mockContainer({ order: { retrieveOrder: vi.fn().mockResolvedValue(mockOrder) } })
      const result = await validateOrderStep(validInput, { container })
      expect(result.order).toEqual(mockOrder)
    })

    it("should throw when order is not found", async () => {
      const container = mockContainer({ order: { retrieveOrder: vi.fn().mockResolvedValue(null) } })
      await expect(validateOrderStep(validInput, { container })).rejects.toThrow("Order order_01 not found")
    })

    it("should call retrieveOrder with the correct order ID", async () => {
      const retrieveOrder = vi.fn().mockResolvedValue({ id: "order_01" })
      const container = mockContainer({ order: { retrieveOrder } })
      await validateOrderStep(validInput, { container })
      expect(retrieveOrder).toHaveBeenCalledWith("order_01")
    })
  })

  describe("allocateInventoryStep", () => {
    it("should create reservation items for each line item", async () => {
      const mockAllocations = [{ id: "alloc_01" }, { id: "alloc_02" }]
      const container = mockContainer({
        inventory: { createReservationItems: vi.fn().mockResolvedValue(mockAllocations) },
      })
      const result = await allocateInventoryStep(validInput, { container })
      expect(result.allocations).toEqual(mockAllocations)
    })

    it("should pass correct reservation parameters", async () => {
      const createReservationItems = vi.fn().mockResolvedValue([])
      const container = mockContainer({ inventory: { createReservationItems } })
      await allocateInventoryStep(validInput, { container })
      expect(createReservationItems).toHaveBeenCalledWith([
        { line_item_id: "li_01", quantity: 2, location_id: "wh_01" },
        { line_item_id: "li_02", quantity: 1, location_id: "wh_01" },
      ])
    })

    it("should propagate inventory allocation errors", async () => {
      const container = mockContainer({
        inventory: { createReservationItems: vi.fn().mockRejectedValue(new Error("Out of stock")) },
      })
      await expect(allocateInventoryStep(validInput, { container })).rejects.toThrow("Out of stock")
    })
  })

  describe("createShipmentStep", () => {
    it("should create a fulfillment shipment", async () => {
      const mockShipment = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 id: "ship_01", status: "created" }
      const container = mockContainer({
        fulfillment: { createFulfillment: vi.fn().mockResolvedValue(mockShipment) },
      })
      const result = await createShipmentStep(validInput, { container })
      expect(result.shipment).toEqual(mockShipment)
    })

    it("should pass correct fulfillment parameters", async () => {
      const createFulfillment = vi.fn().mockResolvedValue({ id: "ship_01" })
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
        fulfillment: { createFulfillment: vi.fn().mockRejectedValue(new Error("Carrier unavailable")) },
      })
      await expect(createShipmentStep(validInput, { container })).rejects.toThrow("Carrier unavailable")
    })
  })
})
