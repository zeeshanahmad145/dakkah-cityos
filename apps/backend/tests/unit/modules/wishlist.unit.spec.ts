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
        async listWishlists(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWishlist(_id: string): Promise<any> {
          return null;
        }
        async createWishlists(_data: any): Promise<any> {
          return {};
        }
        async updateWishlists(_data: any): Promise<any> {
          return {};
        }
        async listWishlistItems(_filter: any): Promise<any> {
          return [];
        }
        async retrieveWishlistItem(_id: string): Promise<any> {
          return null;
        }
        async createWishlistItems(_data: any): Promise<any> {
          return {};
        }
        async updateWishlistItems(_data: any): Promise<any> {
          return {};
        }
        async deleteWishlistItems(_id: string): Promise<any> {
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

import WishlistModuleService from "../../../src/modules/wishlist/service";

describe("WishlistModuleService", () => {
  let service: WishlistModuleService;

  beforeEach(() => {
    service = new WishlistModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("addItem", () => {
    it("adds an item to a wishlist", async () => {
      vi.spyOn(service, "listWishlistItems").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createWishlistItems")
        .mockResolvedValue({
          id: "item-1",
          product_id: "prod-1",
        });

      const result = await service.addItem({
        wishlistId: "wl-1",
        productId: "prod-1",
        priority: "high",
      });

      expect(result).toEqual({ id: "item-1", product_id: "prod-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          wishlist_id: "wl-1",
          product_id: "prod-1",
          priority: "high",
        }),
      );
    });

    it("throws when item already exists in wishlist", async () => {
      jest
        .spyOn(service, "listWishlistItems")
        .mockResolvedValue([{ id: "item-existing" }]);

      await expect(
        service.addItem({
          wishlistId: "wl-1",
          productId: "prod-1",
        }),
      ).rejects.toThrow("Item already exists in this wishlist");
    });
  });

  describe("removeItem", () => {
    it("removes an item from a wishlist", async () => {
      vi.spyOn(service, "retrieveWishlistItem").mockResolvedValue({
        id: "item-1",
        wishlist_id: "wl-1",
      });
      const deleteSpy = jest
        .spyOn(service, "deleteWishlistItems")
        .mockResolvedValue({});

      const result = await service.removeItem("wl-1", "item-1");

      expect(result).toEqual({ success: true });
      expect(deleteSpy).toHaveBeenCalledWith("item-1");
    });

    it("throws when item does not belong to the wishlist", async () => {
      vi.spyOn(service, "retrieveWishlistItem").mockResolvedValue({
        id: "item-1",
        wishlist_id: "wl-other",
      });

      await expect(service.removeItem("wl-1", "item-1")).rejects.toThrow(
        "Item does not belong to this wishlist",
      );
    });
  });

  describe("shareWishlist", () => {
    it("shares a wishlist and generates a token", async () => {
      vi.spyOn(service, "retrieveWishlist").mockResolvedValue({
        id: "wl-1",
        share_token: null,
        visibility: "private",
      });
      const updateSpy = jest
        .spyOn(service, "updateWishlists")
        .mockResolvedValue({});
      vi.spyOn(service, "retrieveWishlist").mockResolvedValue({
        id: "wl-1",
        visibility: "shared",
        share_token: "abc123",
      });

      const result = await service.shareWishlist("wl-1", "shared");

      expect(result.visibility).toBe("shared");
      expect(result.share_token).toBeTruthy();
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: "shared",
        }),
      );
    });

    it("makes a wishlist private and clears the token", async () => {
      vi.spyOn(service, "retrieveWishlist").mockResolvedValue({
        id: "wl-1",
        share_token: "abc123",
        visibility: "shared",
      });
      const updateSpy = jest
        .spyOn(service, "updateWishlists")
        .mockResolvedValue({});
      vi.spyOn(service, "retrieveWishlist").mockResolvedValue({
        id: "wl-1",
        visibility: "private",
        share_token: null,
      });

      const result = await service.shareWishlist("wl-1", "private");

      expect(result.visibility).toBe("private");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: "private",
          share_token: null,
        }),
      );
    });
  });

  describe("getByShareToken", () => {
    it("returns wishlist by share token", async () => {
      jest
        .spyOn(service, "listWishlists")
        .mockResolvedValue([
          { id: "wl-1", share_token: "token123", visibility: "shared" },
        ]);

      const result = await service.getByShareToken("token123");

      expect(result.id).toBe("wl-1");
    });

    it("throws when wishlist not found", async () => {
      vi.spyOn(service, "listWishlists").mockResolvedValue([]);

      await expect(service.getByShareToken("invalid-token")).rejects.toThrow(
        "Wishlist not found or not shared",
      );
    });
  });

  describe("getOrCreateDefault", () => {
    it("returns existing default wishlist", async () => {
      jest
        .spyOn(service, "listWishlists")
        .mockResolvedValue([{ id: "wl-1", is_default: true }]);

      const result = await service.getOrCreateDefault("cust-1", "tenant-1");

      expect(result.id).toBe("wl-1");
    });

    it("creates default wishlist when none exists", async () => {
      vi.spyOn(service, "listWishlists").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createWishlists")
        .mockResolvedValue({
          id: "wl-new",
          is_default: true,
          title: "My Wishlist",
        });

      const result = await service.getOrCreateDefault("cust-1", "tenant-1");

      expect(result.is_default).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: "cust-1",
          tenant_id: "tenant-1",
          is_default: true,
          visibility: "private",
        }),
      );
    });
  });

  describe("moveItem", () => {
    it("moves an item between wishlists", async () => {
      jest
        .spyOn(service, "retrieveWishlistItem")
        .mockResolvedValueOnce({ id: "item-1", wishlist_id: "wl-1" })
        .mockResolvedValueOnce({ id: "item-1", wishlist_id: "wl-2" });
      vi.spyOn(service, "retrieveWishlist").mockResolvedValue({ id: "wl-2" });
      const updateSpy = jest
        .spyOn(service, "updateWishlistItems")
        .mockResolvedValue({});

      const result = await service.moveItem("item-1", "wl-1", "wl-2");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "item-1",
          wishlist_id: "wl-2",
        }),
      );
    });

    it("throws when item does not belong to source wishlist", async () => {
      vi.spyOn(service, "retrieveWishlistItem").mockResolvedValue({
        id: "item-1",
        wishlist_id: "wl-other",
      });

      await expect(service.moveItem("item-1", "wl-1", "wl-2")).rejects.toThrow(
        "Item does not belong to the source wishlist",
      );
    });
  });
});
