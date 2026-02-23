jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    }
    return chain
  }

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async createCommissionRules(_data: any): Promise<any> { return {} }
        async listCommissionRules(_filter?: any, _opts?: any): Promise<any> { return [] }
        async createCommissionTransactions(_data: any): Promise<any> { return {} }
        async updateCommissionTransactions(_ids: any, _data?: any): Promise<any> { return {} }
        async listCommissionTransactions(_filter?: any, _opts?: any): Promise<any> { return [] }
      },
    model: {
      define: () => ({ indexes: () => ({}) }),
      id: chainable,
      text: chainable,
      number: chainable,
      json: chainable,
      enum: () => chainable(),
      boolean: chainable,
      dateTime: chainable,
      bigNumber: chainable,
    },
  }
})

import CommissionModuleService from "../../../src/modules/commission/service"

describe("CommissionModuleService", () => {
  let service: CommissionModuleService

  beforeEach(() => {
    service = new CommissionModuleService()
    jest.clearAllMocks()
  })

  describe("calculateCommission", () => {
    it("calculates percentage commission correctly", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule_1",
          commission_type: "percentage",
          commission_percentage: 10,
          commission_flat_amount: null,
          priority: 1,
          tiers: null,
        },
      ] as any)

      const result = await service.calculateCommission({
        vendorId: "vendor_1",
        orderId: "order_1",
        lineItemId: "li_1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "tenant_1",
      })

      expect(result.commissionAmount).toBe(100)
      expect(result.commissionRate).toBe(10)
      expect(result.netAmount).toBe(900)
      expect(result.ruleId).toBe("rule_1")
    })

    it("calculates flat commission correctly", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule_2",
          commission_type: "flat",
          commission_percentage: 0,
          commission_flat_amount: 250,
          priority: 1,
          tiers: null,
        },
      ] as any)

      const result = await service.calculateCommission({
        vendorId: "vendor_1",
        orderId: "order_1",
        lineItemId: "li_1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "tenant_1",
      })

      expect(result.commissionAmount).toBe(250)
      expect(result.commissionFlat).toBe(250)
      expect(result.netAmount).toBe(750)
    })

    it("calculates tiered percentage commission", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule_3",
          commission_type: "tiered_percentage",
          commission_percentage: 0,
          commission_flat_amount: null,
          priority: 1,
          tiers: [
            { min_amount: 0, max_amount: 500, rate: 5 },
            { min_amount: 501, max_amount: 2000, rate: 8 },
            { min_amount: 2001, max_amount: 10000, rate: 12 },
          ],
        },
      ] as any)

      const result = await service.calculateCommission({
        vendorId: "vendor_1",
        orderId: "order_1",
        lineItemId: "li_1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "tenant_1",
      })

      expect(result.commissionRate).toBe(8)
      expect(result.commissionAmount).toBe(80)
      expect(result.netAmount).toBe(920)
    })

    it("throws when no commission rule is found", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([] as any)

      await expect(
        service.calculateCommission({
          vendorId: "vendor_unknown",
          orderId: "order_1",
          lineItemId: "li_1",
          orderSubtotal: 900,
          orderTotal: 1000,
          tenantId: "tenant_1",
        })
      ).rejects.toThrow("No commission rule found for vendor vendor_unknown")
    })

    it("handles tiered commission when no tier matches", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule_4",
          commission_type: "tiered_percentage",
          commission_percentage: 0,
          commission_flat_amount: null,
          priority: 1,
          tiers: [
            { min_amount: 5000, max_amount: 10000, rate: 15 },
          ],
        },
      ] as any)

      const result = await service.calculateCommission({
        vendorId: "vendor_1",
        orderId: "order_1",
        lineItemId: "li_1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "tenant_1",
      })

      expect(result.commissionAmount).toBe(0)
      expect(result.commissionRate).toBe(0)
    })
  })

  describe("createCommissionTransaction", () => {
    it("creates a transaction with calculated commission", async () => {
      jest.spyOn(service, "calculateCommission").mockResolvedValue({
        commissionAmount: 100,
        commissionRate: 10,
        commissionFlat: null,
        netAmount: 900,
        ruleId: "rule_1",
      })

      const createSpy = jest.spyOn(service, "createCommissionTransactions").mockResolvedValue({
        id: "ctx_1",
        status: "pending",
      } as any)

      await service.createCommissionTransaction({
        vendorId: "vendor_1",
        orderId: "order_1",
        lineItemId: "li_1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "tenant_1",
      })

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          commission_amount: 100,
          net_amount: 900,
          status: "pending",
          payout_status: "unpaid",
          transaction_type: "sale",
        })
      )
    })
  })

  describe("getVendorCommissionSummary", () => {
    it("aggregates commission amounts by status", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([
        { id: "ctx_1", commission_amount: 100, status: "pending", payout_status: "unpaid" },
        { id: "ctx_2", commission_amount: 200, status: "completed", payout_status: "paid" },
        { id: "ctx_3", commission_amount: 150, status: "pending", payout_status: "unpaid" },
      ] as any)

      const result = await service.getVendorCommissionSummary({
        vendorId: "vendor_1",
        tenantId: "tenant_1",
      })

      expect(result.total_earned).toBe(450)
      expect(result.total_paid).toBe(200)
      expect(result.total_pending).toBe(250)
      expect(result.transaction_count).toBe(3)
    })

    it("returns zeros when no transactions exist", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([] as any)

      const result = await service.getVendorCommissionSummary({
        vendorId: "vendor_1",
        tenantId: "tenant_1",
      })

      expect(result.total_earned).toBe(0)
      expect(result.total_paid).toBe(0)
      expect(result.total_pending).toBe(0)
      expect(result.transaction_count).toBe(0)
    })
  })

  describe("processCommissionPayout", () => {
    it("processes payout for given transaction IDs", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([
        { id: "ctx_1" },
        { id: "ctx_2" },
      ] as any)

      const updateSpy = jest.spyOn(service as any, "updateCommissionTransactions").mockResolvedValue({})

      const result = await service.processCommissionPayout(["ctx_1", "ctx_2"])

      expect(result.processed_count).toBe(2)
      expect(updateSpy).toHaveBeenCalledWith(
        ["ctx_1", "ctx_2"],
        expect.objectContaining({ payout_status: "paid" })
      )
    })

    it("returns zero processed count when no transactions found", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([] as any)

      const result = await service.processCommissionPayout(["nonexistent"])

      expect(result.processed_count).toBe(0)
    })
  })

  describe("adjustCommission", () => {
    it("adjusts commission amount on an existing transaction", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([
        {
          id: "ctx_1",
          vendor_id: "vendor_1",
          tenant_id: "tenant_1",
          order_id: "order_1",
          line_item_id: "li_1",
          commission_amount: 100,
          net_amount: 900,
          order_total: 1000,
        },
      ] as any)

      jest.spyOn(service as any, "updateCommissionTransactions").mockResolvedValue({})
      const createSpy = jest.spyOn(service, "createCommissionTransactions").mockResolvedValue({
        id: "ctx_adj",
        transaction_type: "adjustment",
      } as any)

      const result = await service.adjustCommission({
        transactionId: "ctx_1",
        adjustmentAmount: -25,
        reason: "Partial refund",
      })

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_type: "adjustment",
          commission_amount: -25,
        })
      )
    })

    it("throws when transaction is not found", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([] as any)

      await expect(
        service.adjustCommission({
          transactionId: "nonexistent",
          adjustmentAmount: 10,
          reason: "Correction",
        })
      ).rejects.toThrow("Commission transaction nonexistent not found")
    })
  })

  describe("getTopEarningVendors", () => {
    it("returns vendors sorted by total commission", async () => {
      jest.spyOn(service, "listCommissionTransactions").mockResolvedValue([
        { vendor_id: "v1", commission_amount: 100 },
        { vendor_id: "v2", commission_amount: 300 },
        { vendor_id: "v1", commission_amount: 200 },
        { vendor_id: "v3", commission_amount: 50 },
      ] as any)

      const result = await service.getTopEarningVendors({ tenantId: "tenant_1", limit: 2 })

      expect(result).toHaveLength(2)
      expect(result[0].vendor_id).toBe("v1")
      expect(result[0].total_commission).toBe(300)
      expect(result[1].vendor_id).toBe("v2")
      expect(result[1].total_commission).toBe(300)
    })
  })
})
