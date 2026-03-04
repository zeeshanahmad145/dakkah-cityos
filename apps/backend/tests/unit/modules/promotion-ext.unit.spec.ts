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
        async listGiftCardExts(_filter: any, _options?: any): Promise<any> {
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
        async listReferrals(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async listProductBundles(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async listCustomerSegments(_filter: any, _options?: any): Promise<any> {
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
    Module: (_config: any) => ({}),
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
    it("returns active promotions for a tenant", async () => {
      vi.spyOn(service, "listGiftCardExts").mockResolvedValue([
        { id: "promo-1", is_active: true },
        { id: "promo-2", is_active: true },
      ]);

      const result = await service.getActivePromotions("t-1");
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no promotions exist", async () => {
      vi.spyOn(service, "listGiftCardExts").mockResolvedValue([]);

      const result = await service.getActivePromotions("t-1");
      expect(result).toHaveLength(0);
    });
  });

  describe("validatePromotionRules", () => {
    it("returns valid for an active promotion with budget", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "promo-1",
        is_active: true,
        remaining_value: 5000,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });

      const result = await service.validatePromotionRules("promo-1", {
        totalAmount: 1000,
      });
      expect(result.isValid).toBe(true);
    });

    it("returns invalid for inactive promotion", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "promo-1",
        is_active: false,
        remaining_value: 5000,
      });

      const result = await service.validatePromotionRules("promo-1", {});
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Promotion is not active");
    });

    it("returns invalid for expired promotion", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "promo-1",
        is_active: true,
        remaining_value: 5000,
        expires_at: new Date("2020-01-01").toISOString(),
      });

      const result = await service.validatePromotionRules("promo-1", {});
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Promotion has expired");
    });

    it("returns partial apply when budget is less than cart total", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "promo-1",
        is_active: true,
        remaining_value: 500,
      });

      const result = await service.validatePromotionRules("promo-1", {
        totalAmount: 1000,
      });
      expect(result.isValid).toBe(true);
      expect(result.partialApply).toBe(true);
      expect(result.availableDiscount).toBe(500);
    });
  });

  describe("calculateStackedDiscounts", () => {
    it("stacks discounts from multiple promotions", async () => {
      jest
        .spyOn(service, "retrieveGiftCardExt")
        .mockResolvedValueOnce({
          id: "p1",
          is_active: true,
          remaining_value: 100,
        })
        .mockResolvedValueOnce({
          id: "p2",
          is_active: true,
          remaining_value: 200,
        });

      const result = await service.calculateStackedDiscounts({
        items: [{ quantity: 1, price: 500 }],
        promotionIds: ["p1", "p2"],
      });

      expect(result.totalDiscount).toBe(300);
      expect(result.promotionCount).toBe(2);
    });

    it("skips inactive promotions when stacking", async () => {
      jest
        .spyOn(service, "retrieveGiftCardExt")
        .mockResolvedValueOnce({
          id: "p1",
          is_active: false,
          remaining_value: 100,
        })
        .mockResolvedValueOnce({
          id: "p2",
          is_active: true,
          remaining_value: 200,
        });

      const result = await service.calculateStackedDiscounts({
        items: [{ quantity: 1, price: 500 }],
        promotionIds: ["p1", "p2"],
      });

      expect(result.totalDiscount).toBe(200);
      expect(result.promotionCount).toBe(1);
    });
  });

  describe("getCustomerEligiblePromotions", () => {
    it("returns eligible promotions for customer", async () => {
      vi.spyOn(service, "listGiftCardExts").mockResolvedValue([
        { id: "p1", is_active: true, remaining_value: 100, metadata: {} },
        { id: "p2", is_active: true, remaining_value: 0, metadata: {} },
      ]);

      const result = await service.getCustomerEligiblePromotions(
        "cust-1",
        "t-1",
      );
      expect(result.count).toBe(1);
      expect(result.promotions[0].id).toBe("p1");
    });

    it("excludes customer from excluded list", async () => {
      vi.spyOn(service, "listGiftCardExts").mockResolvedValue([
        {
          id: "p1",
          is_active: true,
          remaining_value: 100,
          metadata: { excluded_customers: ["cust-1"] },
        },
      ]);

      const result = await service.getCustomerEligiblePromotions(
        "cust-1",
        "t-1",
      );
      expect(result.count).toBe(0);
    });
  });

  describe("trackRedemption", () => {
    it("tracks a redemption successfully", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "p1",
        is_active: true,
        metadata: { redemptions: [] },
      });
      vi.spyOn(service, "updateGiftCardExts").mockResolvedValue({});

      const result = await service.trackRedemption("p1", "order-1", "cust-1");
      expect(result.promotionId).toBe("p1");
      expect(result.orderId).toBe("order-1");
      expect(result.redemptionCount).toBe(1);
    });

    it("throws when promotion is not active", async () => {
      vi.spyOn(service, "retrieveGiftCardExt").mockResolvedValue({
        id: "p1",
        is_active: false,
        metadata: {},
      });

      await expect(
        service.trackRedemption("p1", "order-1", "cust-1"),
      ).rejects.toThrow("Promotion is not active");
    });
  });
});
