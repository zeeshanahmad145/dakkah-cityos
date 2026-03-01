jest.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
      searchable: () => chain,
      index: () => chain,
    };
    return chain;
  };

  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listCommissionRules(_filter: any): Promise<any> {
          return [];
        }
        async createCommissionTransactions(_data: any): Promise<any> {
          return {};
        }
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
      float: chainable,
      array: chainable,
      hasOne: () => chainable(),
      hasMany: () => chainable(),
      belongsTo: () => chainable(),
      manyToMany: () => chainable(),
    },
  };
});

import CommissionModuleService from "../../../src/modules/commission/service";

describe("CommissionModuleService", () => {
  let service: CommissionModuleService;

  beforeEach(() => {
    service = new CommissionModuleService();
    jest.clearAllMocks();
  });

  describe("calculateCommission", () => {
    it("calculates percentage-based commission", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule-1",
          commission_type: "percentage",
          commission_percentage: 10,
          priority: 1,
        },
      ]);

      const result = await service.calculateCommission({
        vendorId: "v1",
        orderId: "o1",
        lineItemId: "li1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
      });

      expect(result.commissionAmount).toBe(100);
      expect(result.commissionRate).toBe(10);
      expect(result.netAmount).toBe(900);
      expect(result.ruleId).toBe("rule-1");
    });

    it("calculates flat-rate commission", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule-1",
          commission_type: "flat",
          commission_flat_amount: 50,
          priority: 1,
        },
      ]);

      const result = await service.calculateCommission({
        vendorId: "v1",
        orderId: "o1",
        lineItemId: "li1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
      });

      expect(result.commissionAmount).toBe(50);
      expect(result.commissionFlat).toBe(50);
      expect(result.netAmount).toBe(950);
    });

    it("calculates tiered percentage commission", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule-1",
          commission_type: "tiered_percentage",
          tiers: [
            { min_amount: 0, max_amount: 500, rate: 15 },
            { min_amount: 501, max_amount: 2000, rate: 10 },
            { min_amount: 2001, max_amount: 99999, rate: 5 },
          ],
          priority: 1,
        },
      ]);

      const result = await service.calculateCommission({
        vendorId: "v1",
        orderId: "o1",
        lineItemId: "li1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
      });

      expect(result.commissionRate).toBe(10);
      expect(result.commissionAmount).toBe(100);
      expect(result.netAmount).toBe(900);
    });

    it("throws when no commission rule found", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([]);

      await expect(
        service.calculateCommission({
          vendorId: "v1",
          orderId: "o1",
          lineItemId: "li1",
          orderSubtotal: 900,
          orderTotal: 1000,
          tenantId: "t1",
        }),
      ).rejects.toThrow("No commission rule found for vendor v1");
    });

    it("defaults to percentage calculation for unknown commission type", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule-1",
          commission_type: "unknown_type",
          commission_percentage: 8,
          priority: 1,
        },
      ]);

      const result = await service.calculateCommission({
        vendorId: "v1",
        orderId: "o1",
        lineItemId: "li1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
      });

      expect(result.commissionAmount).toBe(80);
      expect(result.commissionRate).toBe(8);
    });
  });

  describe("createCommissionTransaction", () => {
    it("creates a transaction with calculated commission", async () => {
      jest.spyOn(service, "calculateCommission").mockResolvedValue({
        commissionAmount: 100,
        commissionRate: 10,
        commissionFlat: null,
        netAmount: 900,
        ruleId: "rule-1",
      });
      const createSpy = jest
        .spyOn(service, "createCommissionTransactions")
        .mockResolvedValue({ id: "tx-1" });

      const result = await service.createCommissionTransaction({
        vendorId: "v1",
        orderId: "o1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
      });

      expect(result).toEqual({ id: "tx-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_id: "v1",
          order_id: "o1",
          commission_amount: 100,
          net_amount: 900,
          status: "pending",
          payout_status: "unpaid",
          transaction_type: "sale",
        }),
      );
    });

    it("includes store ID when provided", async () => {
      jest.spyOn(service, "calculateCommission").mockResolvedValue({
        commissionAmount: 50,
        commissionRate: 5,
        commissionFlat: null,
        netAmount: 950,
        ruleId: "rule-1",
      });
      const createSpy = jest
        .spyOn(service, "createCommissionTransactions")
        .mockResolvedValue({ id: "tx-1" });

      await service.createCommissionTransaction({
        vendorId: "v1",
        orderId: "o1",
        orderSubtotal: 900,
        orderTotal: 1000,
        tenantId: "t1",
        storeId: "store-1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          store_id: "store-1",
        }),
      );
    });

    it("handles tiered commission in transaction creation", async () => {
      jest.spyOn(service, "listCommissionRules").mockResolvedValue([
        {
          id: "rule-1",
          commission_type: "tiered_percentage",
          tiers: [
            { min_amount: 0, max_amount: 100, rate: 20 },
            { min_amount: 101, max_amount: 10000, rate: 10 },
          ],
          priority: 1,
        },
      ]);
      const createSpy = jest
        .spyOn(service, "createCommissionTransactions")
        .mockResolvedValue({ id: "tx-1" });

      await service.createCommissionTransaction({
        vendorId: "v1",
        orderId: "o1",
        orderSubtotal: 450,
        orderTotal: 500,
        tenantId: "t1",
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          commission_rate: 10,
          commission_amount: 50,
          net_amount: 450,
        }),
      );
    });
  });
});
