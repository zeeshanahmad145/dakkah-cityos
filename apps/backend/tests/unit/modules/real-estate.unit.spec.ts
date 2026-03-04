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
        async listPropertyListings(_filter: any): Promise<any> {
          return [];
        }
        async retrievePropertyListing(_id: string): Promise<any> {
          return null;
        }
        async createPropertyListings(_data: any): Promise<any> {
          return {};
        }
        async updatePropertyListings(_data: any): Promise<any> {
          return {};
        }
        async listViewingAppointments(_filter: any): Promise<any> {
          return [];
        }
        async createViewingAppointments(_data: any): Promise<any> {
          return {};
        }
        async createPropertyValuations(_data: any): Promise<any> {
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

import RealEstateModuleService from "../../../src/modules/real-estate/service";

describe("RealEstateModuleService", () => {
  let service: RealEstateModuleService;

  beforeEach(() => {
    service = new RealEstateModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("publishProperty", () => {
    it("publishes a property with a price", async () => {
      vi.spyOn(service, "retrievePropertyListing").mockResolvedValue({
        id: "prop-1",
        status: "draft",
        price: 500000,
      });
      const updateSpy = jest
        .spyOn(service, "updatePropertyListings")
        .mockResolvedValue({ id: "prop-1", status: "published" });

      const result = await service.publishProperty("prop-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
      );
    });

    it("throws when property is already published", async () => {
      vi.spyOn(service, "retrievePropertyListing").mockResolvedValue({
        id: "prop-1",
        status: "published",
        price: 500000,
      });

      await expect(service.publishProperty("prop-1")).rejects.toThrow(
        "Property is already published",
      );
    });

    it("throws when property has no price", async () => {
      vi.spyOn(service, "retrievePropertyListing").mockResolvedValue({
        id: "prop-1",
        status: "draft",
        price: null,
        rent_price: null,
      });

      await expect(service.publishProperty("prop-1")).rejects.toThrow(
        "Property must have a price before publishing",
      );
    });
  });

  describe("scheduleViewing", () => {
    it("schedules a viewing for a published property", async () => {
      jest
        .spyOn(service, "retrievePropertyListing")
        .mockResolvedValue({ id: "prop-1", status: "published" });
      vi.spyOn(service, "listViewingAppointments").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createViewingAppointments")
        .mockResolvedValue({ id: "view-1" });

      const futureDate = new Date("2099-06-15");
      const result = await service.scheduleViewing(
        "prop-1",
        "viewer-1",
        futureDate,
        "Morning preferred",
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          property_listing_id: "prop-1",
          viewer_id: "viewer-1",
          status: "scheduled",
        }),
      );
    });

    it("throws when viewing date is in the past", async () => {
      const pastDate = new Date("2020-01-01");
      await expect(
        service.scheduleViewing("prop-1", "viewer-1", pastDate),
      ).rejects.toThrow("Viewing date must be in the future");
    });

    it("throws when property is not published", async () => {
      jest
        .spyOn(service, "retrievePropertyListing")
        .mockResolvedValue({ id: "prop-1", status: "draft" });

      const futureDate = new Date("2099-06-15");
      await expect(
        service.scheduleViewing("prop-1", "viewer-1", futureDate),
      ).rejects.toThrow("Property is not available for viewings");
    });

    it("throws when viewer already has a scheduled viewing", async () => {
      jest
        .spyOn(service, "retrievePropertyListing")
        .mockResolvedValue({ id: "prop-1", status: "published" });
      jest
        .spyOn(service, "listViewingAppointments")
        .mockResolvedValue([{ id: "view-existing" }]);

      const futureDate = new Date("2099-06-15");
      await expect(
        service.scheduleViewing("prop-1", "viewer-1", futureDate),
      ).rejects.toThrow("You already have a scheduled viewing");
    });
  });

  describe("makeOffer", () => {
    it("creates an offer on a published property", async () => {
      vi.spyOn(service, "retrievePropertyListing").mockResolvedValue({
        id: "prop-1",
        status: "published",
        price: 500000,
      });
      const createSpy = jest
        .spyOn(service, "createPropertyValuations")
        .mockResolvedValue({ id: "val-1" });

      const result = await service.makeOffer(
        "prop-1",
        "buyer-1",
        480000,
        "Subject to inspection",
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          offered_amount: 480000,
          status: "pending",
        }),
      );
    });

    it("throws when offer amount is zero", async () => {
      await expect(service.makeOffer("prop-1", "buyer-1", 0)).rejects.toThrow(
        "Offer amount must be greater than zero",
      );
    });

    it("throws when property is not published", async () => {
      jest
        .spyOn(service, "retrievePropertyListing")
        .mockResolvedValue({ id: "prop-1", status: "draft" });

      await expect(
        service.makeOffer("prop-1", "buyer-1", 500000),
      ).rejects.toThrow("Property is not accepting offers");
    });
  });

  describe("calculateMortgage", () => {
    it("calculates monthly mortgage payment correctly", async () => {
      const result = await service.calculateMortgage(500000, 100000, 30, 6.5);

      expect(result.loanAmount).toBe(400000);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it("throws on invalid parameters", async () => {
      await expect(service.calculateMortgage(0, 0, 30)).rejects.toThrow(
        "Invalid mortgage parameters",
      );
    });

    it("throws when down payment exceeds price", async () => {
      await expect(
        service.calculateMortgage(500000, 600000, 30),
      ).rejects.toThrow("Down payment cannot exceed or equal the price");
    });
  });

  describe("getMarketAnalysis", () => {
    it("returns market analysis with listings", async () => {
      vi.spyOn(service, "listPropertyListings").mockResolvedValue([
        { price: 300000, published_at: "2025-01-01" },
        { price: 500000, published_at: "2025-06-01" },
        { price: 400000, published_at: "2025-03-01" },
      ]);

      const result = await service.getMarketAnalysis({ location: "downtown" });

      expect(result.totalListings).toBe(3);
      expect(result.averagePrice).toBe(400000);
      expect(result.priceRange.min).toBe(300000);
      expect(result.priceRange.max).toBe(500000);
    });

    it("returns zeros when no listings found", async () => {
      vi.spyOn(service, "listPropertyListings").mockResolvedValue([]);

      const result = await service.getMarketAnalysis({});

      expect(result.totalListings).toBe(0);
      expect(result.averagePrice).toBe(0);
    });
  });
});
