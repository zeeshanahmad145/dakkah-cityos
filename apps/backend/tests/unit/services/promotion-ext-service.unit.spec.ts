import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
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
        async listGiftCardExts(_filter: any, _opts?: any): Promise<any> {
          return [];
        }
        async retrieveGiftCardExt(_id: string): Promise<any> {
          return null;
        }
        async createGiftCardExts(_data: any): Promise<any> {
          return {};
        }
        async updateGiftCardExts(_data: any): Promise<any> {
          return {};
        }
        async listReferrals(_filter: any): Promise<any> {
          return [];
        }
        async listProductBundles(_filter: any): Promise<any> {
          return [];
        }
        async listCustomerSegments(_filter: any): Promise<any> {
          return [];
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

import PromotionExtModuleService from "../../../src/modules/promotion-ext/service";

describe("PromotionExtModuleService", () => {
  let service: PromotionExtModuleService;

  beforeEach(() => {
    service = new PromotionExtModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getActivePromotions", () => {
    it("returns active promotions filtered by tenant", async () => {
      const promotions = [{ id: "p1", is_active: true }];
      vi.spyOn(service, "listGiftCardExts").mockResolvedValue(promotions);

      const result = await service.getActivePromotions("t1");
      expect(result).toEqual(promotions);
    });

    it("includes expired when option set", async () => {
      const listSpy = jest
        .spyOn(service, "listGiftCardExts")
        .mockResolvedValue([]);

      await service.getActivePromotions("t1", { includeExpired: true });
      const calledFilters = listSpy.mock.calls[0][0];
      expect(calledFilters.expires_at).toBeUndefined();
    });
  });

  describe("validatePromotionRules", () => {
    it("returns invalid when promotion not active", async () => {
      jest
        .spyOn(service, "retrieveGiftCardExt")
        .mockResolvedValue({ is_active: false });

      const result = await service.validatePromotionRules("p1", {});
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Promotion is not active");
    });

    it("returns invalid when promotion expired", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        expires_at: new Date(Date.now() - 100000),
        remaining_value: 100,
      });

      const result = await service.validatePromotionRules("p1", {});
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Promotion has expired");
    });

    it("returns invalid when budget exhausted", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        expires_at: null,
        remaining_value: 0,
      });

      const result = await service.validatePromotionRules("p1", {});
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Promotion budget exhausted");
    });

    it("returns partial apply when budget less than total", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        expires_at: null,
        remaining_value: 50,
      });

      const result = await service.validatePromotionRules("p1", {
        totalAmount: 100,
      });
      expect(result.isValid).toBe(true);
      expect(result.partialApply).toBe(true);
      expect(result.availableDiscount).toBe(50);
    });

    it("returns valid when all rules pass", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        expires_at: null,
        remaining_value: 200,
      });

      const result = await service.validatePromotionRules("p1", {
        totalAmount: 100,
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("calculateDiscount", () => {
    it("calculates discount across line items", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        remaining_value: 50,
      });

      const result = await service.calculateDiscount("p1", [
        { productId: "prod_1", quantity: 2, price: 20 },
        { productId: "prod_2", quantity: 1, price: 30 },
      ]);
      expect(result.discountAmount).toBe(50);
      expect(result.items).toHaveLength(2);
    });

    it("returns zero discount when promotion inactive", async () => {
      jest
        .spyOn(service, "retrieveGiftCardExt")
        .mockResolvedValue({ is_active: false });

      const result = await service.calculateDiscount("p1", [
        { productId: "prod_1", quantity: 1, price: 50 },
      ]);
      expect(result.discountAmount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it("caps discount at remaining value", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        is_active: true,
        remaining_value: 10,
      });

      const result = await service.calculateDiscount("p1", [
        { productId: "prod_1", quantity: 1, price: 100 },
      ]);
      expect(result.discountAmount).toBe(10);
    });
  });

  describe("getPromotionUsageStats", () => {
    it("calculates usage statistics", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        initial_value: 100,
        remaining_value: 25,
        is_active: true,
        expires_at: null,
        delivered_at: null,
      });

      const result = await service.getPromotionUsageStats("p1");
      expect(result.initialBudget).toBe(100);
      expect(result.remainingBudget).toBe(25);
      expect(result.usedAmount).toBe(75);
      expect(result.usagePercentage).toBe(75);
    });
  });

  describe("deactivateExpiredPromotions", () => {
    it("deactivates expired promotions", async () => {
      jest
        .spyOn(service, "listGiftCardExts")
        .mockResolvedValue([{ id: "p1" }, { id: "p2" }]);
      jest
        .spyOn(service, "updateGiftCardExts")
        .mockResolvedValue({ updated: true });

      const result = await service.deactivateExpiredPromotions("t1");
      expect(result.deactivatedCount).toBe(2);
    });
  });
});
