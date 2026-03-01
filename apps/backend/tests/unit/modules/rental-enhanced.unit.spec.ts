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
        async listRentalProducts(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRentalProduct(_id: string): Promise<any> {
          return null;
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
        async updateRentalProducts(_data: any): Promise<any> {
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

import RentalModuleService from "../../../src/modules/rental/service";

describe("RentalModuleService – Enhanced", () => {
  let service: RentalModuleService;

  beforeEach(() => {
    service = new RentalModuleService();
    jest.clearAllMocks();
  });

  describe("checkAvailability", () => {
    it("returns true when item is available and no conflicts", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "rp-1", status: "available" });
      jest.spyOn(service, "listRentalAgreements").mockResolvedValue([]);

      const start = new Date("2025-06-01");
      const end = new Date("2025-06-07");
      const result = await service.checkAvailability("rp-1", start, end);

      expect(result).toBe(true);
    });

    it("returns false when item has conflicting reservation", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ id: "rp-1", status: "available" });
      jest
        .spyOn(service, "listRentalAgreements")
        .mockResolvedValue([
          { start_date: "2025-06-03", end_date: "2025-06-10" },
        ]);

      const start = new Date("2025-06-01");
      const end = new Date("2025-06-07");
      const result = await service.checkAvailability("rp-1", start, end);

      expect(result).toBe(false);
    });

    it("throws when start date is after end date", async () => {
      const start = new Date("2025-06-10");
      const end = new Date("2025-06-01");

      await expect(
        service.checkAvailability("rp-1", start, end),
      ).rejects.toThrow("Start date must be before end date");
    });
  });

  describe("calculateRentalPrice", () => {
    it("calculates daily rate * duration", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ daily_rate: 50 });

      const result = await service.calculateRentalPrice("rp-1", 5);
      expect(result).toBe(250);
    });

    it("applies 10% weekly discount for 7+ days", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ daily_rate: 100 });

      const result = await service.calculateRentalPrice("rp-1", 10);
      expect(result).toBe(900);
    });

    it("applies 20% monthly discount for 30+ days", async () => {
      jest
        .spyOn(service, "retrieveRentalProduct")
        .mockResolvedValue({ daily_rate: 100 });

      const result = await service.calculateRentalPrice("rp-1", 30);
      expect(result).toBe(2400);
    });

    it("throws when duration is zero or negative", async () => {
      await expect(service.calculateRentalPrice("rp-1", 0)).rejects.toThrow(
        "Duration must be at least 1 day",
      );
    });
  });

  describe("processReturn", () => {
    it("processes a return for an active rental", async () => {
      jest.spyOn(service, "retrieveRentalAgreement").mockResolvedValue({
        id: "ra-1",
        status: "active",
        rental_product_id: "rp-1",
      });
      const returnSpy = jest
        .spyOn(service, "createRentalReturns")
        .mockResolvedValue({ id: "ret-1" });
      jest.spyOn(service, "updateRentalAgreements").mockResolvedValue({});
      jest.spyOn(service, "updateRentalProducts").mockResolvedValue({});

      const result = await service.processReturn("ra-1", "good", "No damage");

      expect(result).toEqual({ id: "ret-1" });
      expect(returnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ condition: "good", status: "completed" }),
      );
    });

    it("throws when rental is not active", async () => {
      jest
        .spyOn(service, "retrieveRentalAgreement")
        .mockResolvedValue({ id: "ra-1", status: "returned" });

      await expect(service.processReturn("ra-1")).rejects.toThrow(
        "Only active rentals can be returned",
      );
    });
  });
});
