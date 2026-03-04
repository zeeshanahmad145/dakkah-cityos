import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
      unique: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async retrieveVolumePricing(_id: string): Promise<any> {
          return null;
        }
        async listVolumePricingTiers(_f: any): Promise<any> {
          return [];
        }
        async listVolumePricings(_f: any): Promise<any> {
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

import VolumePricingModuleService from "../../../src/modules/volume-pricing/service";

describe("VolumePricingModuleService", () => {
  let service: VolumePricingModuleService;

  beforeEach(() => {
    service = new VolumePricingModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
  });

  describe("calculateDiscount", () => {
    it("returns no discount when no tier matches", async () => {
      jest
        .spyOn(service, "retrieveVolumePricing")
        .mockResolvedValue({ id: "vp-1", pricing_type: "percentage" });
      jest
        .spyOn(service, "listVolumePricingTiers")
        .mockResolvedValue([
          { min_quantity: 10, max_quantity: 50, discount_percentage: 10 },
        ]);

      const result = await service.calculateDiscount("vp-1", 5, 1000n);

      expect(result.discountPerUnit).toBe(0n);
      expect(result.finalUnitPrice).toBe(1000n);
      expect(result.finalTotal).toBe(5000n);
    });

    it("calculates percentage discount for matching tier", async () => {
      jest
        .spyOn(service, "retrieveVolumePricing")
        .mockResolvedValue({ id: "vp-1", pricing_type: "percentage" });
      jest
        .spyOn(service, "listVolumePricingTiers")
        .mockResolvedValue([
          { min_quantity: 10, max_quantity: null, discount_percentage: 10 },
        ]);

      const result = await service.calculateDiscount("vp-1", 20, 1000n);

      expect(result.discountPerUnit).toBe(100n);
      expect(result.finalUnitPrice).toBe(900n);
      expect(result.finalTotal).toBe(18000n);
      expect(result.tier).toBeDefined();
    });

    it("calculates fixed discount for matching tier", async () => {
      jest
        .spyOn(service, "retrieveVolumePricing")
        .mockResolvedValue({ id: "vp-1", pricing_type: "fixed" });
      jest
        .spyOn(service, "listVolumePricingTiers")
        .mockResolvedValue([
          { min_quantity: 5, max_quantity: 20, discount_amount: 200 },
        ]);

      const result = await service.calculateDiscount("vp-1", 10, 1000n);

      expect(result.discountPerUnit).toBe(200n);
      expect(result.finalUnitPrice).toBe(800n);
      expect(result.finalTotal).toBe(8000n);
    });

    it("calculates fixed_price discount for matching tier", async () => {
      jest
        .spyOn(service, "retrieveVolumePricing")
        .mockResolvedValue({ id: "vp-1", pricing_type: "fixed_price" });
      jest
        .spyOn(service, "listVolumePricingTiers")
        .mockResolvedValue([
          { min_quantity: 100, max_quantity: null, fixed_price: 700 },
        ]);

      const result = await service.calculateDiscount("vp-1", 100, 1000n);

      expect(result.finalUnitPrice).toBe(700n);
      expect(result.discountPerUnit).toBe(300n);
      expect(result.finalTotal).toBe(70000n);
    });

    it("selects the correct tier based on quantity range", async () => {
      jest
        .spyOn(service, "retrieveVolumePricing")
        .mockResolvedValue({ id: "vp-1", pricing_type: "percentage" });
      vi.spyOn(service, "listVolumePricingTiers").mockResolvedValue([
        { min_quantity: 1, max_quantity: 9, discount_percentage: 5 },
        { min_quantity: 10, max_quantity: 49, discount_percentage: 10 },
        { min_quantity: 50, max_quantity: null, discount_percentage: 20 },
      ]);

      const result = await service.calculateDiscount("vp-1", 25, 1000n);

      expect(result.tier.discount_percentage).toBe(10);
    });
  });

  describe("findApplicableRules", () => {
    it("returns rules sorted by priority", async () => {
      vi.spyOn(service, "listVolumePricings").mockResolvedValue([
        { id: "vp-1", priority: 1 },
        { id: "vp-2", priority: 10 },
        { id: "vp-3", priority: 5 },
      ]);

      const result = await service.findApplicableRules({ tenantId: "t-1" });

      expect(result[0].id).toBe("vp-2");
      expect(result[1].id).toBe("vp-3");
      expect(result[2].id).toBe("vp-1");
    });

    it("returns empty array when no rules match", async () => {
      vi.spyOn(service, "listVolumePricings").mockResolvedValue([]);

      const result = await service.findApplicableRules({ tenantId: "t-1" });

      expect(result).toEqual([]);
    });

    it("returns empty array when list returns null", async () => {
      vi.spyOn(service, "listVolumePricings").mockResolvedValue(null);

      const result = await service.findApplicableRules({ tenantId: "t-1" });

      expect(result).toEqual([]);
    });
  });

  describe("getBestVolumePrice", () => {
    it("returns best discount across multiple rules", async () => {
      jest
        .spyOn(service, "findApplicableRules")
        .mockResolvedValue([{ id: "vp-1" }, { id: "vp-2" }]);
      jest
        .spyOn(service, "calculateDiscount")
        .mockResolvedValueOnce({
          discountPerUnit: 50n,
          discountTotal: 500n,
          finalUnitPrice: 950n,
          finalTotal: 9500n,
        })
        .mockResolvedValueOnce({
          discountPerUnit: 100n,
          discountTotal: 1000n,
          finalUnitPrice: 900n,
          finalTotal: 9000n,
        });

      const result = await service.getBestVolumePrice({
        productId: "p-1",
        variantId: "v-1",
        quantity: 10,
        unitPrice: 1000n,
        currencyCode: "usd",
        tenantId: "t-1",
      });

      expect(result.discountTotal).toBe(1000n);
      expect(result.finalTotal).toBe(9000n);
    });

    it("returns original pricing when no rules apply", async () => {
      vi.spyOn(service, "findApplicableRules").mockResolvedValue([]);

      const result = await service.getBestVolumePrice({
        productId: "p-1",
        variantId: "v-1",
        quantity: 5,
        unitPrice: 1000n,
        currencyCode: "usd",
        tenantId: "t-1",
      });

      expect(result.discountPerUnit).toBe(0n);
      expect(result.finalUnitPrice).toBe(1000n);
      expect(result.finalTotal).toBe(5000n);
    });

    it("returns original pricing when discounts are all zero", async () => {
      jest
        .spyOn(service, "findApplicableRules")
        .mockResolvedValue([{ id: "vp-1" }]);
      vi.spyOn(service, "calculateDiscount").mockResolvedValue({
        discountPerUnit: 0n,
        discountTotal: 0n,
        finalUnitPrice: 1000n,
        finalTotal: 10000n,
      });

      const result = await service.getBestVolumePrice({
        productId: "p-1",
        variantId: "v-1",
        quantity: 10,
        unitPrice: 1000n,
        currencyCode: "usd",
        tenantId: "t-1",
      });

      expect(result.discountTotal).toBe(0n);
    });
  });
});
