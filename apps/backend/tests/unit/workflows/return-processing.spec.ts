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

describe("Return Processing Workflow", () => {
  let requestReturnStep: any
  let inspectReturnStep: any
  let processRefundStep: any
  let restockItemsStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/return-processing.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    requestReturnStep = calls.find((c: any) => c[0] === "request-return-step")?.[1]
    inspectReturnStep = calls.find((c: any) => c[0] === "inspect-return-items-step")?.[1]
    processRefundStep = calls.find((c: any) => c[0] === "process-return-refund-step")?.[1]
    restockItemsStep = calls.find((c: any) => c[0] === "restock-returned-items-step")?.[1]
  })

  const validInput = {
    orderId: "order_01",
    customerId: "cust_01",
    items: [
      { lineItemId: "li_01", quantity: 1, reason: "defective" },
      { lineItemId: "li_02", quantity: 2, reason: "wrong_size" },
    ],
    returnMethod: "mail",
  }

  describe("requestReturnStep", () => {
    it("should create a return request with requested status", async () => {
      const container = mockContainer({})
      const result = await requestReturnStep(validInput, { container })
      expect(result.returnRequest.status).toBe("requested")
      expect(result.returnRequest.order_id).toBe("order_01")
      expect(result.returnRequest.customer_id).toBe("cust_01")
    })

    it("should include items and return method", async () => {
      const container = mockContainer({})
      const result = await requestReturnStep(validInput, { container })
      expect(result.returnRequest.items).toEqual(validInput.items)
      expect(result.returnRequest.return_method).toBe("mail")
    })

    it("should include a creation timestamp", async () => {
      const container = mockContainer({})
      const result = await requestReturnStep(validInput, { container })
      expect(result.returnRequest.created_at).toBeInstanceOf(Date)
    })
  })

  describe("inspectReturnStep", () => {
    it("should mark items as received with acceptable condition", async () => {
      const result = await inspectReturnStep({ returnRequest: { id: "ret_01" } })
      expect(result.inspection.items_received).toBe(true)
      expect(result.inspection.condition).toBe("acceptable")
    })

    it("should include inspection timestamp", async () => {
      const result = await inspectReturnStep({ returnRequest: { id: "ret_01" } })
      expect(result.inspection.inspected_at).toBeInstanceOf(Date)
    })
  })

  describe("processRefundStep", () => {
    it("should create a refund record", async () => {
      const container = mockContainer({})
      const result = await processRefundStep(
        { orderId: "order_01", items: validInput.items, customerId: "cust_01" },
        { container }
      )
      expect(result.refund.status).toBe("refunded")
      expect(result.refund.order_id).toBe("order_01")
      expect(result.refund.customer_id).toBe("cust_01")
    })

    it("should include refunded_at timestamp", async () => {
      const container = mockContainer({})
      const result = await processRefundStep(
        { orderId: "order_01", items: [], customerId: "cust_01" },
        { container }
      )
      expect(result.refund.refunded_at).toBeInstanceOf(Date)
    })
  })

  describe("restockItemsStep", () => {
    it("should restock all returned items", async () => {
      const container = mockContainer({})
      const result = await restockItemsStep({ items: validInput.items }, { container })
      expect(result.restocked).toHaveLength(2)
      expect(result.restocked[0]).toEqual({ line_item_id: "li_01", quantity: 1, restocked: true })
      expect(result.restocked[1]).toEqual({ line_item_id: "li_02", quantity: 2, restocked: true })
    })

    it("should handle empty items array", async () => {
      const container = mockContainer({})
      const result = await restockItemsStep({ items: [] }, { container })
      expect(result.restocked).toEqual([])
    })
  })
})
