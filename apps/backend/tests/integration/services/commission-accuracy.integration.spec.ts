jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => ({ run: jest.fn(), config, fn })),
  createStep: jest.fn((_name, fn, compensate) => Object.assign(fn, { compensate })),
  StepResponse: jest.fn((data, compensationData) => ({ ...data, __compensation: compensationData })),
  WorkflowResponse: jest.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
})

describe("Commission Calculation Accuracy", () => {
  let calculateCommissionStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/commission-calculation.js")
    const { createStep } = require("@medusajs/framework/workflows-sdk")
    const calls = createStep.mock.calls
    calculateCommissionStep = calls.find((c: any) => c[0] === "calculate-vendor-commission-step")?.[1]
  })

  const makeInput = (orderSubtotal: number) => ({
    vendorId: "vendor_01",
    orderId: "order_01",
    orderTotal: orderSubtotal + 2000,
    orderSubtotal,
    tenantId: "tenant_01",
    lineItems: [{ id: "li_01", amount: orderSubtotal }],
  })

  describe("exact commission split calculations", () => {
    it("should calculate 10% commission on $100 order as $10.00 (1000 cents)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.1 }]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.commissionAmount).toBe(1000)
      expect(result.netAmount).toBe(9000)
    })

    it("should calculate 15% commission on $200 order as $30.00 (3000 cents)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.15 }]) },
      })
      const result = await calculateCommissionStep(makeInput(20000), { container })
      expect(result.commissionAmount).toBe(3000)
      expect(result.netAmount).toBe(17000)
    })

    it("should calculate 5% commission on $49.99 order as $2.50 rounded (250 cents)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.05 }]) },
      })
      const result = await calculateCommissionStep(makeInput(4999), { container })
      expect(result.commissionAmount).toBe(Math.round(4999 * 0.05))
      expect(result.commissionAmount).toBe(250)
    })

    it("should calculate 20% commission on $1.00 order as $0.20 (20 cents)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.2 }]) },
      })
      const result = await calculateCommissionStep(makeInput(100), { container })
      expect(result.commissionAmount).toBe(20)
      expect(result.netAmount).toBe(80)
    })

    it("should fall back to default 10% rate when rule rate is 0 (falsy)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0 }]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.1)
      expect(result.commissionAmount).toBe(1000)
      expect(result.netAmount).toBe(9000)
    })
  })

  describe("fractional cents and rounding", () => {
    it("should handle fractional cents with proper rounding (7% of $99.99)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.07 }]) },
      })
      const result = await calculateCommissionStep(makeInput(9999), { container })
      expect(result.commissionAmount).toBe(Math.round(9999 * 0.07))
      expect(result.commissionAmount).toBe(700)
    })

    it("should round up when fractional part is >= 0.5 (3% of $33.33)", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.03 }]) },
      })
      const result = await calculateCommissionStep(makeInput(3333), { container })
      expect(result.commissionAmount).toBe(Math.round(3333 * 0.03))
      expect(result.commissionAmount).toBe(100)
    })

    it("should ensure commission + net always equals subtotal", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.07 }]) },
      })
      const subtotal = 9999
      const result = await calculateCommissionStep(makeInput(subtotal), { container })
      expect(result.commissionAmount + result.netAmount).toBe(subtotal)
    })

    it("should handle very large order amounts correctly", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.12 }]) },
      })
      const result = await calculateCommissionStep(makeInput(10000000), { container })
      expect(result.commissionAmount).toBe(1200000)
      expect(result.netAmount).toBe(8800000)
    })
  })

  describe("default rate behavior", () => {
    it("should use default 10% rate when no commission rules exist", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.1)
      expect(result.commissionAmount).toBe(1000)
    })

    it("should use first rule's rate when multiple rules are returned", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: jest.fn().mockResolvedValue([{ rate: 0.25 }, { rate: 0.1 }]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.25)
      expect(result.commissionAmount).toBe(2500)
    })
  })
})
