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
        async listClassifiedListings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveClassifiedListing(_id: string): Promise<any> {
          return null;
        }
        async createClassifiedListings(_data: any): Promise<any> {
          return {};
        }
        async updateClassifiedListings(_data: any): Promise<any> {
          return {};
        }
        async listListingImages(_filter: any): Promise<any> {
          return [];
        }
        async listListingOffers(_filter: any): Promise<any> {
          return [];
        }
        async listListingCategories(_filter: any): Promise<any> {
          return [];
        }
        async listListingFlags(_filter: any): Promise<any> {
          return [];
        }
        async createListingFlags(_data: any): Promise<any> {
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

import ClassifiedModuleService from "../../../src/modules/classified/service";

describe("ClassifiedModuleService", () => {
  let service: ClassifiedModuleService;

  beforeEach(() => {
    service = new ClassifiedModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("searchListings", () => {
    it("defaults to published status when no status filter", async () => {
      const spy = jest
        .spyOn(service, "listClassifiedListings")
        .mockResolvedValue([]);

      await service.searchListings({});

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
      );
    });

    it("filters by price range", async () => {
      vi.spyOn(service, "listClassifiedListings").mockResolvedValue([
        { id: "l1", price: 50 },
        { id: "l2", price: 150 },
        { id: "l3", price: 250 },
      ]);

      const result = await service.searchListings({
        priceMin: 100,
        priceMax: 200,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("l2");
    });

    it("applies category and location filters", async () => {
      const spy = jest
        .spyOn(service, "listClassifiedListings")
        .mockResolvedValue([]);

      await service.searchListings({
        category: "electronics",
        location: "NYC",
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ category: "electronics", location: "NYC" }),
      );
    });
  });

  describe("expireOldListings", () => {
    it("expires listings past their expiry date", async () => {
      const pastDate = new Date("2024-01-01");
      const futureDate = new Date("2026-12-31");
      vi.spyOn(service, "listClassifiedListings").mockResolvedValue([
        { id: "l1", expires_at: pastDate },
        { id: "l2", expires_at: futureDate },
      ]);
      const updateSpy = jest
        .spyOn(service, "updateClassifiedListings")
        .mockResolvedValue({});

      const result = await service.expireOldListings();

      expect(result.expiredCount).toBe(1);
      expect(result.expiredIds).toContain("l1");
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it("returns zero when no listings are expired", async () => {
      jest
        .spyOn(service, "listClassifiedListings")
        .mockResolvedValue([{ id: "l1", expires_at: new Date("2026-12-31") }]);

      const result = await service.expireOldListings();

      expect(result.expiredCount).toBe(0);
    });
  });

  describe("renewListing", () => {
    it("renews an expired listing for default 30 days", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "l1", status: "expired" });
      const updateSpy = jest
        .spyOn(service, "updateClassifiedListings")
        .mockResolvedValue({ id: "l1", status: "published" });

      await service.renewListing("l1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
      );
    });

    it("throws when listing status is not expired or published", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "l1", status: "flagged" });

      await expect(service.renewListing("l1")).rejects.toThrow(
        "Only expired or published listings can be renewed",
      );
    });
  });
});
