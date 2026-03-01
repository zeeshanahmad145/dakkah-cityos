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
    Module: (_config: any) => ({}),
  };
});

import ClassifiedModuleService from "../../../src/modules/classified/service";

describe("ClassifiedModuleService – Enhanced", () => {
  let service: ClassifiedModuleService;

  beforeEach(() => {
    service = new ClassifiedModuleService();
    jest.clearAllMocks();
  });

  describe("renewListing", () => {
    it("renews an expired listing for default 30 days", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "cl-1", status: "expired" });
      const updateSpy = jest
        .spyOn(service, "updateClassifiedListings")
        .mockResolvedValue({});

      await service.renewListing("cl-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
      );
    });

    it("renews with custom duration", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "cl-1", status: "published" });
      const updateSpy = jest
        .spyOn(service, "updateClassifiedListings")
        .mockResolvedValue({});

      await service.renewListing("cl-1", 60);

      expect(updateSpy).toHaveBeenCalled();
    });

    it("throws when listing status is flagged", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "cl-1", status: "flagged" });

      await expect(service.renewListing("cl-1")).rejects.toThrow(
        "Only expired or published listings can be renewed",
      );
    });
  });

  describe("searchListings", () => {
    it("returns published listings by default", async () => {
      const listings = [{ id: "cl-1", status: "published", price: 100 }];
      jest.spyOn(service, "listClassifiedListings").mockResolvedValue(listings);

      const result = await service.searchListings({});

      expect(result).toEqual(listings);
    });

    it("filters by category", async () => {
      const spy = jest
        .spyOn(service, "listClassifiedListings")
        .mockResolvedValue([]);

      await service.searchListings({ category: "electronics" });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "electronics",
          status: "published",
        }),
      );
    });

    it("filters by price range", async () => {
      jest.spyOn(service, "listClassifiedListings").mockResolvedValue([
        { id: "cl-1", price: 50 },
        { id: "cl-2", price: 150 },
        { id: "cl-3", price: 250 },
      ]);

      const result = await service.searchListings({
        priceMin: 100,
        priceMax: 200,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("cl-2");
    });
  });

  describe("flagListing", () => {
    it("flags a listing with reason", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ id: "cl-1", flag_count: 0 });
      const flagSpy = jest
        .spyOn(service, "createListingFlags")
        .mockResolvedValue({ id: "flag-1" });
      jest.spyOn(service, "updateClassifiedListings").mockResolvedValue({});

      const result = await service.flagListing(
        "cl-1",
        "Inappropriate content",
        "user-1",
      );

      expect(result).toEqual({ id: "flag-1" });
      expect(flagSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: "Inappropriate content",
          status: "pending",
        }),
      );
    });

    it("throws when reason is empty", async () => {
      await expect(service.flagListing("cl-1", "")).rejects.toThrow(
        "Flag reason is required",
      );
    });
  });

  describe("expireOldListings", () => {
    it("expires listings past their expiry date", async () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      jest.spyOn(service, "listClassifiedListings").mockResolvedValue([
        { id: "cl-1", expires_at: past },
        { id: "cl-2", expires_at: past },
      ]);
      jest.spyOn(service, "updateClassifiedListings").mockResolvedValue({});

      const result = await service.expireOldListings();

      expect(result.expiredCount).toBe(2);
      expect(result.expiredIds).toEqual(["cl-1", "cl-2"]);
    });
  });
});
