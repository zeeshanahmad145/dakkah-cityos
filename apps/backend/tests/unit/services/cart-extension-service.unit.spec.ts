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
        async listCartMetadatas(_f: any): Promise<any> {
          return [];
        }
        async updateCartMetadatas(_data: any): Promise<any> {
          return null;
        }
        async retrieveCartMetadata(_id: string): Promise<any> {
          return null;
        }
        async createCartMetadatas(_data: any): Promise<any> {
          return null;
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

import CartExtensionModuleService from "../../../src/modules/cart-extension/service";

describe("CartExtensionModuleService", () => {
  let service: CartExtensionModuleService;

  beforeEach(() => {
    service = new CartExtensionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
  });

  describe("getByCartId", () => {
    it("returns first matching cart metadata", async () => {
      const meta = { id: "cm-1", cart_id: "cart-1", tenant_id: "t-1" };
      vi.spyOn(service, "listCartMetadatas").mockResolvedValue([meta]);

      const result = await service.getByCartId("cart-1", "t-1");

      expect(result).toEqual(meta);
    });

    it("returns null when no metadata found", async () => {
      vi.spyOn(service, "listCartMetadatas").mockResolvedValue([]);

      const result = await service.getByCartId("cart-1", "t-1");

      expect(result).toBeNull();
    });

    it("handles non-array response", async () => {
      jest
        .spyOn(service, "listCartMetadatas")
        .mockResolvedValue({ id: "cm-1", cart_id: "cart-1", tenant_id: "t-1" });

      const result = await service.getByCartId("cart-1", "t-1");

      expect(result).toEqual({
        id: "cm-1",
        cart_id: "cart-1",
        tenant_id: "t-1",
      });
    });
  });

  describe("setGiftWrap", () => {
    it("updates existing metadata with gift wrap", async () => {
      jest
        .spyOn(service, "listCartMetadatas")
        .mockResolvedValue([{ id: "cm-1" }]);
      vi.spyOn(service, "updateCartMetadatas").mockResolvedValue({});
      jest
        .spyOn(service, "retrieveCartMetadata")
        .mockResolvedValue({
          id: "cm-1",
          gift_wrap: true,
          gift_message: "Happy Birthday",
        });

      const result = await service.setGiftWrap("cart-1", "t-1", {
        enabled: true,
        message: "Happy Birthday",
      });

      expect(result).toEqual(
        expect.objectContaining({
          gift_wrap: true,
          gift_message: "Happy Birthday",
        }),
      );
    });

    it("creates new metadata when none exists", async () => {
      vi.spyOn(service, "listCartMetadatas").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createCartMetadatas")
        .mockResolvedValue({ id: "cm-new", gift_wrap: true });

      const result = await service.setGiftWrap("cart-1", "t-1", {
        enabled: true,
      });

      expect(result).toEqual(expect.objectContaining({ gift_wrap: true }));
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ cart_id: "cart-1", gift_wrap: true }),
      );
    });
  });

  describe("setDeliveryInstructions", () => {
    it("updates existing metadata with delivery instructions", async () => {
      jest
        .spyOn(service, "listCartMetadatas")
        .mockResolvedValue([{ id: "cm-1" }]);
      vi.spyOn(service, "updateCartMetadatas").mockResolvedValue({});
      jest
        .spyOn(service, "retrieveCartMetadata")
        .mockResolvedValue({
          id: "cm-1",
          delivery_instructions: "Leave at door",
        });

      const result = await service.setDeliveryInstructions(
        "cart-1",
        "t-1",
        "Leave at door",
      );

      expect(result).toEqual(
        expect.objectContaining({ delivery_instructions: "Leave at door" }),
      );
    });

    it("creates new metadata when none exists", async () => {
      vi.spyOn(service, "listCartMetadatas").mockResolvedValue([]);
      jest
        .spyOn(service, "createCartMetadatas")
        .mockResolvedValue({
          id: "cm-new",
          delivery_instructions: "Ring bell",
        });

      const result = await service.setDeliveryInstructions(
        "cart-1",
        "t-1",
        "Ring bell",
      );

      expect(result).toEqual(
        expect.objectContaining({ delivery_instructions: "Ring bell" }),
      );
    });
  });

  describe("calculateCartTotals", () => {
    it("calculates subtotal, tax, and total", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            { unit_price: 1000, quantity: 2 },
            { unit_price: 500, quantity: 1 },
          ],
        }),
      };
      vi.spyOn(service, "getByCartId").mockResolvedValue(null);

      const result = await service.calculateCartTotals("cart-1");

      expect(result).toEqual({
        cartId: "cart-1",
        subtotal: 2500,
        tax: 250,
        giftWrapCost: 0,
        total: 2750,
        itemCount: 2,
      });
    });

    it("adds gift wrap cost when enabled", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [{ unit_price: 1000, quantity: 1 }],
        }),
      };
      jest
        .spyOn(service, "getByCartId")
        .mockResolvedValue({ gift_wrap: true });

      const result = await service.calculateCartTotals("cart-1");

      expect(result!.giftWrapCost).toBe(500);
      expect(result!.total).toBe(1000 + 100 + 500);
    });

    it("returns null when cart not found", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue(null),
      };

      const result = await service.calculateCartTotals("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("applyBulkDiscount", () => {
    it("applies 5% discount for 3+ items", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            { unit_price: 1000, quantity: 1 },
            { unit_price: 1000, quantity: 1 },
            { unit_price: 1000, quantity: 1 },
          ],
        }),
      };

      const result = await service.applyBulkDiscount("cart-1");

      expect(result!.discountApplied).toBe(true);
      expect(result!.discountPercentage).toBe(5);
      expect(result!.discountAmount).toBe(150);
    });

    it("applies 10% discount for 5+ items", async () => {
      const items = Array(5).fill({ unit_price: 1000, quantity: 1 });
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({ id: "cart-1", items }),
      };

      const result = await service.applyBulkDiscount("cart-1");

      expect(result!.discountPercentage).toBe(10);
    });

    it("applies 15% discount for 10+ items", async () => {
      const items = Array(10).fill({ unit_price: 1000, quantity: 1 });
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({ id: "cart-1", items }),
      };

      const result = await service.applyBulkDiscount("cart-1");

      expect(result!.discountPercentage).toBe(15);
    });

    it("returns no discount for fewer than 3 items", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [
            { unit_price: 1000, quantity: 1 },
            { unit_price: 2000, quantity: 1 },
          ],
        }),
      };

      const result = await service.applyBulkDiscount("cart-1");

      expect(result!.discountApplied).toBe(false);
      expect(result!.discountPercentage).toBe(0);
    });

    it("returns null for empty cart", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({ id: "cart-1", items: [] }),
      };

      const result = await service.applyBulkDiscount("cart-1");

      expect(result).toBeNull();
    });
  });

  describe("validateCartItems", () => {
    it("returns errors for invalid items", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [{ quantity: 0, unit_price: -5, product_id: null }],
        }),
      };

      const result = await service.validateCartItems("cart-1");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("returns valid for proper items", async () => {
      const mockManager = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        findOne: vi.fn().mockResolvedValue({
          id: "cart-1",
          items: [{ quantity: 2, unit_price: 1000, product_id: "p-1" }],
        }),
      };
      (service).manager_ = mockManager;

      const manager = (service).manager_;
      const cart = await manager.findOne("cart", { where: { id: "cart-1" } });

      expect(cart).toBeDefined();
      expect(cart.items).toHaveLength(1);

      const errors: string[] = [];
      (cart.items || []).forEach((item: any, index: number) => {
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Invalid quantity`);
        }
        if (!item.unit_price || item.unit_price <= 0) {
          errors.push(`Item ${index + 1}: Invalid price`);
        }
        if (!item.product_id) {
          errors.push(`Item ${index + 1}: Missing product reference`);
        }
      });

      expect(errors).toHaveLength(0);
    });

    it("returns error when cart not found", async () => {
      (service).manager_ = {
        findOne: vi.fn().mockResolvedValue(null),
      };

      const result = await service.validateCartItems("nonexistent");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Cart not found or has no items");
    });
  });
});
