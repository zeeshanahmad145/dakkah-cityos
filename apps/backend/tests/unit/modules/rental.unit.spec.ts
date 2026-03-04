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
        async listRentalProducts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRentalProduct(_id: string): Promise<any> {
          return null;
        }
        async createRentalProducts(_data: any): Promise<any> {
          return {};
        }
        async updateRentalProducts(_data: any): Promise<any> {
          return {};
        }
        async listRentalAgreements(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRentalAgreement(_id: string): Promise<any> {
          return null;
        }
        async createRentalAgreements(_data: any): Promise<any> {
          return {};
        }
        async updateRentalAgreements(_data: any): Promise<any> {
          return {};
        }
        async createRentalReturns(_data: any): Promise<any> {
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

import RentalModuleService from "../../../src/modules/rental/service";

describe("RentalModuleService", () => {
  let service: RentalModuleService;

  beforeEach(() => {
    service = new RentalModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("checkAvailability", () => {
    it("returns true when item is available and no conflicts", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", status: "available" });
      vi.spyOn(service, "listRentalAgreements").mockResolvedValue([]);

      const result = await service.checkAvailability(
        "item-1",
        new Date("2099-01-01"),
        new Date("2099-01-10"),
      );

      expect(result).toBe(true);
    });

    it("returns false when item status is not available", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", status: "maintenance" });

      const result = await service.checkAvailability(
        "item-1",
        new Date("2099-01-01"),
        new Date("2099-01-10"),
      );

      expect(result).toBe(false);
    });

    it("returns false when dates conflict with existing agreement", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", status: "available" });
      vi.spyOn(service, "listRentalAgreements").mockResolvedValue([
        {
          start_date: "2099-01-05",
          end_date: "2099-01-15",
          status: "active",
        },
      ]);

      const result = await service.checkAvailability(
        "item-1",
        new Date("2099-01-01"),
        new Date("2099-01-10"),
      );

      expect(result).toBe(false);
    });

    it("throws when start date is after end date", async () => {
      await expect(
        service.checkAvailability(
          "item-1",
          new Date("2099-01-10"),
          new Date("2099-01-01"),
        ),
      ).rejects.toThrow("Start date must be before end date");
    });
  });

  describe("createRental", () => {
    it("creates a rental agreement for available item", async () => {
      vi.spyOn(service, "retrieveRentalProduct").mockResolvedValue({
        id: "item-1",
        status: "available",
        daily_rate: 50,
      });
      vi.spyOn(service, "listRentalAgreements").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createRentalAgreements")
        .mockResolvedValue({ id: "agreement-1" });

      const result = await service.createRental(
        "item-1",
        "cust-1",
        new Date("2099-01-01"),
        new Date("2099-01-04"),
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rental_product_id: "item-1",
          customer_id: "cust-1",
          status: "reserved",
        }),
      );
    });

    it("throws when item is not available", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", status: "maintenance" });

      await expect(
        service.createRental(
          "item-1",
          "cust-1",
          new Date("2099-01-01"),
          new Date("2099-01-04"),
        ),
      ).rejects.toThrow("Item is not available for the selected dates");
    });
  });

  describe("calculateRentalPrice", () => {
    it("calculates price for short rental (no discount)", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", daily_rate: 100 });

      const result = await service.calculateRentalPrice("item-1", 3);

      expect(result).toBe(300);
    });

    it("applies 10% discount for weekly rental", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", daily_rate: 100 });

      const result = await service.calculateRentalPrice("item-1", 7);

      expect(result).toBe(630);
    });

    it("applies 20% discount for monthly rental", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "item-1", daily_rate: 100 });

      const result = await service.calculateRentalPrice("item-1", 30);

      expect(result).toBe(2400);
    });

    it("throws when duration is zero or negative", async () => {
      await expect(service.calculateRentalPrice("item-1", 0)).rejects.toThrow(
        "Duration must be at least 1 day",
      );
    });
  });

  describe("processReturn", () => {
    it("processes a return for an active rental", async () => {
      vi.spyOn(service, "retrieveRentalAgreement").mockResolvedValue({
        id: "rental-1",
        status: "active",
        rental_product_id: "item-1",
      });
      const createReturnSpy = jest
        .spyOn(service, "createRentalReturns")
        .mockResolvedValue({ id: "return-1" });
      vi.spyOn(service, "updateRentalAgreements").mockResolvedValue({});
      vi.spyOn(service, "updateRentalProducts").mockResolvedValue({});

      const result = await service.processReturn(
        "rental-1",
        "good",
        "No damage",
      );

      expect(createReturnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rental_agreement_id: "rental-1",
          condition: "good",
          status: "completed",
        }),
      );
    });

    it("throws when rental is not active", async () => {
      vi.spyOn(service, "retrieveRentalAgreement").mockResolvedValue({
        id: "rental-1",
        status: "returned",
      });

      await expect(service.processReturn("rental-1")).rejects.toThrow(
        "Only active rentals can be returned",
      );
    });
  });
});
