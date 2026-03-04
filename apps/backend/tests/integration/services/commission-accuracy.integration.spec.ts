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

describe("Commission Calculation Accuracy", () => {
  let calculateCommissionStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/commission-calculation.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
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

  const makeContainer = (rate: number) => mockContainer({
    commission: { listCommissionRules: vi.fn().mockResolvedValue([{ rate }]) },
  })

  describe("exact commission split calculations", () => {
    it("should calculate 10% commission on $100 order as $10.00 (1000 cents)", async () => {
      const container = makeContainer(0.1)
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.commissionAmount).toBe(1000)
      expect(result.netAmount).toBe(9000)
      expect(result.rate).toBe(0.1)
      expect(result.commissionAmount + result.netAmount).toBe(10000)
    })

    it("should calculate 15% commission on $200 order as $30.00 (3000 cents)", async () => {
      const container = makeContainer(0.15)
      const result = await calculateCommissionStep(makeInput(20000), { container })
      expect(result.commissionAmount).toBe(3000)
      expect(result.netAmount).toBe(17000)
      expect(result.rate).toBe(0.15)
      expect(result.commissionAmount + result.netAmount).toBe(20000)
    })

    it("should calculate 5% commission on $49.99 order as $2.50 rounded (250 cents)", async () => {
      const container = makeContainer(0.05)
      const result = await calculateCommissionStep(makeInput(4999), { container })
      expect(result.commissionAmount).toBe(Math.round(4999 * 0.05))
      expect(result.commissionAmount).toBe(250)
      expect(result.commissionAmount + result.netAmount).toBe(4999)
    })

    it("should calculate 20% commission on $1.00 order as $0.20 (20 cents)", async () => {
      const container = makeContainer(0.2)
      const result = await calculateCommissionStep(makeInput(100), { container })
      expect(result.commissionAmount).toBe(20)
      expect(result.netAmount).toBe(80)
      expect(result.commissionAmount + result.netAmount).toBe(100)
    })

    it("should fall back to default 10% rate when rule rate is 0 (falsy)", async () => {
      const container = makeContainer(0)
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.1)
      expect(result.commissionAmount).toBe(1000)
      expect(result.netAmount).toBe(9000)
      expect(result.commissionAmount + result.netAmount).toBe(10000)
    })

    it("should calculate 25% commission on $500 order as $125.00 (12500 cents)", async () => {
      const container = makeContainer(0.25)
      const result = await calculateCommissionStep(makeInput(50000), { container })
      expect(result.commissionAmount).toBe(12500)
      expect(result.netAmount).toBe(37500)
      expect(result.commissionAmount + result.netAmount).toBe(50000)
    })

    it("should calculate 1% commission on $10.00 order as $0.10 (10 cents)", async () => {
      const container = makeContainer(0.01)
      const result = await calculateCommissionStep(makeInput(1000), { container })
      expect(result.commissionAmount).toBe(10)
      expect(result.netAmount).toBe(990)
      expect(result.commissionAmount + result.netAmount).toBe(1000)
    })
  })

  describe("fractional cents and rounding", () => {
    it("should handle fractional cents with proper rounding (7% of $99.99)", async () => {
      const container = makeContainer(0.07)
      const result = await calculateCommissionStep(makeInput(9999), { container })
      expect(result.commissionAmount).toBe(Math.round(9999 * 0.07))
      expect(result.commissionAmount).toBe(700)
      expect(result.commissionAmount + result.netAmount).toBe(9999)
    })

    it("should round up when fractional part is >= 0.5 (3% of $33.33)", async () => {
      const container = makeContainer(0.03)
      const result = await calculateCommissionStep(makeInput(3333), { container })
      expect(result.commissionAmount).toBe(Math.round(3333 * 0.03))
      expect(result.commissionAmount).toBe(100)
      expect(result.commissionAmount + result.netAmount).toBe(3333)
    })

    it("should ensure commission + net always equals subtotal", async () => {
      const container = makeContainer(0.07)
      const subtotal = 9999
      const result = await calculateCommissionStep(makeInput(subtotal), { container })
      expect(result.commissionAmount + result.netAmount).toBe(subtotal)
    })

    it("should handle very large order amounts correctly", async () => {
      const container = makeContainer(0.12)
      const result = await calculateCommissionStep(makeInput(10000000), { container })
      expect(result.commissionAmount).toBe(1200000)
      expect(result.netAmount).toBe(8800000)
      expect(result.commissionAmount + result.netAmount).toBe(10000000)
    })

    it("should handle minimum 1 cent order correctly", async () => {
      const container = makeContainer(0.5)
      const result = await calculateCommissionStep(makeInput(1), { container })
      expect(result.commissionAmount).toBe(Math.round(1 * 0.5))
      expect(result.commissionAmount + result.netAmount).toBe(1)
    })

    it("should maintain invariant across multiple rate/subtotal combos", async () => {
      const testCases = [
        { subtotal: 7777, rate: 0.13 },
        { subtotal: 12345, rate: 0.08 },
        { subtotal: 99, rate: 0.33 },
        { subtotal: 100001, rate: 0.17 },
        { subtotal: 1, rate: 0.99 },
      ]
      for (const { subtotal, rate } of testCases) {
        const container = makeContainer(rate)
        const result = await calculateCommissionStep(makeInput(subtotal), { container })
        expect(result.commissionAmount + result.netAmount).toBe(subtotal)
        expect(result.commissionAmount).toBe(Math.round(subtotal * rate))
        expect(result.netAmount).toBe(subtotal - Math.round(subtotal * rate))
      }
    })
  })

  describe("default rate behavior", () => {
    it("should use default 10% rate when no commission rules exist", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: vi.fn().mockResolvedValue([]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.1)
      expect(result.commissionAmount).toBe(1000)
      expect(result.commissionAmount + result.netAmount).toBe(10000)
    })

    it("should use first rule's rate when multiple rules are returned", async () => {
      const container = mockContainer({
        commission: { listCommissionRules: vi.fn().mockResolvedValue([{ rate: 0.25 }, { rate: 0.1 }]) },
      })
      const result = await calculateCommissionStep(makeInput(10000), { container })
      expect(result.rate).toBe(0.25)
      expect(result.commissionAmount).toBe(2500)
      expect(result.netAmount).toBe(7500)
      expect(result.commissionAmount + result.netAmount).toBe(10000)
    })

    it("should query commission rules with the correct vendor_id", async () => {
      const listCommissionRules = vi.fn().mockResolvedValue([{ rate: 0.1 }])
      const container = mockContainer({
        commission: { listCommissionRules },
      })
      const input = { ...makeInput(10000), vendorId: "vendor_special_99" }
      await calculateCommissionStep(input, { container })
      expect(listCommissionRules).toHaveBeenCalledWith({ vendor_id: "vendor_special_99" })
    })
  })
})
