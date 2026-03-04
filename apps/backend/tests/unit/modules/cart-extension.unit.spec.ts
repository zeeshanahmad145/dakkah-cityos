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
        manager_: any = {
          findOne: vi.fn().mockResolvedValue(null),
        };
        async listCartMetadatas(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveCartMetadata(_id: string): Promise<any> {
          return null;
        }
        async createCartMetadatas(_data: any): Promise<any> {
          return {};
        }
        async updateCartMetadatas(_data: any): Promise<any> {
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
    Module: (_config: any) => ({}),
  };
});

import CartExtensionModuleService from "../../../src/modules/cart-extension/service";

describe("CartExtensionModuleService", () => {
  let service: CartExtensionModuleService;

  beforeEach(() => {
    service = new CartExtensionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("calculateCartInsights", () => {
    it("returns insights with savings and recommendations", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            {
              id: "i1",
              unit_price: 1000,
              quantity: 2,
              compare_at_unit_price: 1500,
            },
            { id: "i2", unit_price: 800, quantity: 1 },
          ],
        }),
      };

      const result = await service.calculateCartInsights("cart-1");
      expect(result.savings.currentTotal).toBe(2800);
      expect(result.loyaltyPoints.potential).toBeGreaterThanOrEqual(0);
    });

    it("returns empty insights for missing cart", async () => {
      service.manager_ = { findOne: vi.fn().mockResolvedValue(null) };

      const result = await service.calculateCartInsights("cart-1");
      expect(result.savings.originalTotal).toBe(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it("suggests bundle discount when 2 items present", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            { id: "i1", unit_price: 1000, quantity: 1 },
            { id: "i2", unit_price: 1000, quantity: 1 },
          ],
        }),
      };

      const result = await service.calculateCartInsights("cart-1");
      const bundleSuggestion = result.recommendations.find(
        (r) => r.type === "bundle_suggestion",
      );
      expect(bundleSuggestion).toBeDefined();
    });
  });

  describe("applyBundleDiscounts", () => {
    it("detects category bundles and applies discount", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            {
              id: "i1",
              unit_price: 1000,
              quantity: 1,
              metadata: { category: "electronics" },
            },
            {
              id: "i2",
              unit_price: 2000,
              quantity: 1,
              metadata: { category: "electronics" },
            },
            {
              id: "i3",
              unit_price: 500,
              quantity: 1,
              metadata: { category: "books" },
            },
          ],
        }),
      };

      const result = await service.applyBundleDiscounts("cart-1");
      expect(result.applied).toBe(true);
      expect(result.bundlesDetected.length).toBeGreaterThan(0);
      expect(result.totalBundleDiscount).toBeGreaterThan(0);
    });

    it("returns no bundles for empty cart", async () => {
      service.manager_ = { findOne: vi.fn().mockResolvedValue(null) };

      const result = await service.applyBundleDiscounts("cart-1");
      expect(result.applied).toBe(false);
      expect(result.bundlesDetected).toHaveLength(0);
    });

    it("applies mix-and-match discount for 3+ items", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            {
              id: "i1",
              unit_price: 1000,
              quantity: 1,
              metadata: { category: "a" },
            },
            {
              id: "i2",
              unit_price: 1000,
              quantity: 1,
              metadata: { category: "b" },
            },
            {
              id: "i3",
              unit_price: 1000,
              quantity: 1,
              metadata: { category: "c" },
            },
          ],
        }),
      };

      const result = await service.applyBundleDiscounts("cart-1");
      const mixMatch = result.bundlesDetected.find(
        (b) => b.name === "mix_and_match",
      );
      expect(mixMatch).toBeDefined();
    });
  });

  describe("validateCartLimits", () => {
    it("returns valid when cart is within all limits", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [{ id: "i1", unit_price: 1000, quantity: 2, weight: 500 }],
        }),
      };

      const result = await service.validateCartLimits("cart-1", "t-1");
      expect(result.valid).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it("returns invalid when item count exceeds limit", async () => {
      service.manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [{ id: "i1", unit_price: 100, quantity: 60, weight: 10 }],
        }),
      };

      const result = await service.validateCartLimits("cart-1", "t-1");
      expect(result.valid).toBe(false);
      const maxItemsCheck = result.checks.find((c) => c.rule === "max_items");
      expect(maxItemsCheck!.passed).toBe(false);
    });
  });
});
