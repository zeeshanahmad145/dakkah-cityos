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
        async listVehicleListings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveVehicleListing(_id: string): Promise<any> {
          return null;
        }
        async createVehicleListings(_data: any): Promise<any> {
          return {};
        }
        async updateVehicleListings(_data: any): Promise<any> {
          return {};
        }
        async listTestDrives(_filter: any): Promise<any> {
          return [];
        }
        async createTestDrives(_data: any): Promise<any> {
          return {};
        }
        async listVehicleServices(_filter: any): Promise<any> {
          return [];
        }
        async listPartCatalogs(_filter: any): Promise<any> {
          return [];
        }
        async listTradeIns(_filter: any): Promise<any> {
          return [];
        }
        async retrieveTradeIn(_id: string): Promise<any> {
          return null;
        }
        async createTradeIns(_data: any): Promise<any> {
          return {};
        }
        async updateTradeIns(_data: any): Promise<any> {
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

import AutomotiveModuleService from "../../../src/modules/automotive/service";

describe("AutomotiveModuleService", () => {
  let service: AutomotiveModuleService;

  beforeEach(() => {
    service = new AutomotiveModuleService();
    jest.clearAllMocks();
  });

  describe("listVehicle", () => {
    it("creates a new vehicle listing", async () => {
      jest.spyOn(service, "listVehicleListings").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createVehicleListings")
        .mockResolvedValue({ id: "v1" });

      const result = await service.listVehicle({
        make: "Toyota",
        model: "Camry",
        year: 2023,
        vin: "1HGBH41JXMN109186",
        price: 25000,
        condition: "new",
        sellerId: "seller-1",
      });

      expect(result.id).toBe("v1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ vin: "1HGBH41JXMN109186", status: "draft" }),
      );
    });

    it("throws when VIN is already listed", async () => {
      jest
        .spyOn(service, "listVehicleListings")
        .mockResolvedValue([{ id: "v1", vin: "VIN123", status: "draft" }]);

      await expect(
        service.listVehicle({
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN123",
          price: 25000,
          condition: "new",
          sellerId: "seller-1",
        }),
      ).rejects.toThrow("A vehicle with this VIN is already listed");
    });

    it("throws when required fields are missing", async () => {
      await expect(
        service.listVehicle({
          make: "",
          model: "Camry",
          year: 2023,
          vin: "VIN123",
          price: 25000,
          condition: "new",
          sellerId: "seller-1",
        }),
      ).rejects.toThrow("Make, model, year, and VIN are required");
    });

    it("throws when condition is invalid", async () => {
      await expect(
        service.listVehicle({
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN123",
          price: 25000,
          condition: "broken",
          sellerId: "seller-1",
        }),
      ).rejects.toThrow("Condition must be one of");
    });
  });

  describe("appraise", () => {
    it("calculates vehicle appraisal value", async () => {
      jest.spyOn(service, "retrieveVehicleListing").mockResolvedValue({
        id: "v1",
        price: 30000,
        year: 2023,
        mileage: 20000,
        condition: "certified_pre_owned",
      });

      const result = await service.appraise("v1");

      expect(result.vehicleId).toBe("v1");
      expect(result.estimatedValue).toBeGreaterThan(0);
      expect(result.factors.conditionMultiplier).toBe(0.85);
    });
  });

  describe("scheduleTestDrive", () => {
    it("schedules a test drive for a published vehicle", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValue({ id: "v1", status: "published" });
      jest.spyOn(service, "listTestDrives").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createTestDrives")
        .mockResolvedValue({ id: "td-1" });

      const result = await service.scheduleTestDrive("v1", {
        customerId: "c1",
        date: futureDate,
        dealershipId: "d1",
      });

      expect(result.id).toBe("td-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "scheduled" }),
      );
    });

    it("throws when vehicle is not published", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValue({ id: "v1", status: "draft" });

      await expect(
        service.scheduleTestDrive("v1", {
          customerId: "c1",
          date: futureDate,
          dealershipId: "d1",
        }),
      ).rejects.toThrow("Vehicle is not available for test drives");
    });
  });

  describe("processTradeIn", () => {
    it("processes a trade-in and calculates amount due", async () => {
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValueOnce({ id: "v1", status: "published", price: 40000 })
        .mockResolvedValueOnce({
          id: "v2",
          price: 20000,
          year: 2023,
          mileage: 10000,
          condition: "used",
        });
      jest.spyOn(service, "createTradeIns").mockResolvedValue({});

      const result = await service.processTradeIn("v1", "v2");

      expect(result.purchaseVehicleId).toBe("v1");
      expect(result.tradeInVehicleId).toBe("v2");
      expect(result.purchasePrice).toBe(40000);
      expect(result.tradeInValue).toBeGreaterThan(0);
      expect(result.amountDue).toBeLessThan(40000);
    });

    it("throws when purchase vehicle is not published", async () => {
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValue({ id: "v1", status: "draft", price: 40000 });

      await expect(service.processTradeIn("v1", "v2")).rejects.toThrow(
        "Purchase vehicle is not available for sale",
      );
    });
  });
});
