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
        async listShippingRates(_filter: any): Promise<any> {
          return [];
        }
        async retrieveShippingRate(_id: string): Promise<any> {
          return null;
        }
        async createShippingRates(_data: any): Promise<any> {
          return {};
        }
        async updateShippingRates(_data: any): Promise<any> {
          return {};
        }
        async listCarrierConfigs(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCarrierConfig(_id: string): Promise<any> {
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

import ShippingExtensionModuleService from "../../../src/modules/shipping-extension/service";

describe("ShippingExtensionModuleService", () => {
  let service: ShippingExtensionModuleService;

  beforeEach(() => {
    service = new ShippingExtensionModuleService();
    jest.clearAllMocks();
  });

  describe("calculateShippingRate", () => {
    it("returns applicable rates filtered by weight and zone", async () => {
      jest.spyOn(service, "listShippingRates").mockResolvedValue([
        {
          id: "r1",
          carrier_name: "FedEx",
          service_type: "express",
          base_rate: 10,
          per_kg_rate: 2,
          min_weight: 0,
          max_weight: 50,
          estimated_days_min: 1,
          estimated_days_max: 3,
        },
        {
          id: "r2",
          carrier_name: "UPS",
          service_type: "standard",
          base_rate: 5,
          per_kg_rate: 1,
          min_weight: 0,
          max_weight: 20,
          estimated_days_min: 3,
          estimated_days_max: 7,
        },
      ]);

      const result = await service.calculateShippingRate({
        originZone: "US-EAST",
        destinationZone: "US-WEST",
        weight: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].total_cost).toBe(30);
      expect(result[1].total_cost).toBe(15);
    });

    it("throws when weight is not positive", async () => {
      await expect(
        service.calculateShippingRate({
          originZone: "US-EAST",
          destinationZone: "US-WEST",
          weight: 0,
        }),
      ).rejects.toThrow("Weight must be a positive number");
    });

    it("throws when no rates match", async () => {
      jest.spyOn(service, "listShippingRates").mockResolvedValue([
        {
          id: "r1",
          min_weight: 50,
          max_weight: 100,
          service_type: "express",
        },
      ]);

      await expect(
        service.calculateShippingRate({
          originZone: "US-EAST",
          destinationZone: "US-WEST",
          weight: 5,
        }),
      ).rejects.toThrow("No shipping rates available for the given parameters");
    });

    it("uses volumetric weight when dimensions are provided", async () => {
      jest.spyOn(service, "listShippingRates").mockResolvedValue([
        {
          id: "r1",
          carrier_name: "DHL",
          service_type: "express",
          base_rate: 10,
          per_kg_rate: 2,
          min_weight: 0,
          max_weight: 100,
          estimated_days_min: 1,
          estimated_days_max: 2,
        },
      ]);

      const result = await service.calculateShippingRate({
        originZone: "EU",
        destinationZone: "US",
        weight: 5,
        dimensions: { length: 50, width: 50, height: 50 },
      });

      expect(result[0].total_cost).toBe(10 + 2 * 25);
    });
  });

  describe("validateShipmentCarrier", () => {
    it("validates an active carrier successfully", async () => {
      jest.spyOn(service, "retrieveCarrierConfig").mockResolvedValue({
        id: "carrier-1",
        carrier_name: "FedEx",
        is_active: true,
        carrier_code: "fedex",
      });

      const result = await service.validateShipmentCarrier(
        "carrier-1",
        "TRACK123",
        [{ productId: "p1", quantity: 2 }],
      );

      expect(result.valid).toBe(true);
      expect(result.carrier_name).toBe("FedEx");
      expect(result.tracking_number).toBe("TRACK123");
      expect(result.item_count).toBe(1);
    });

    it("throws when carrier is inactive", async () => {
      jest.spyOn(service, "retrieveCarrierConfig").mockResolvedValue({
        id: "carrier-1",
        carrier_name: "DHL",
        is_active: false,
        carrier_code: "dhl",
      });

      await expect(
        service.validateShipmentCarrier("carrier-1", "TRACK123", [
          { productId: "p1", quantity: 1 },
        ]),
      ).rejects.toThrow("not currently active");
    });

    it("throws when carrier is not found", async () => {
      jest
        .spyOn(service, "retrieveCarrierConfig")
        .mockRejectedValue(new Error("Not found"));

      await expect(
        service.validateShipmentCarrier("nonexistent", "TRACK123", [
          { productId: "p1", quantity: 1 },
        ]),
      ).rejects.toThrow("Not found");
    });
  });

  describe("estimateDeliveryDate", () => {
    it("calculates estimated delivery dates from rate data", async () => {
      jest
        .spyOn(service, "listShippingRates")
        .mockResolvedValue([
          { id: "r1", estimated_days_min: 3, estimated_days_max: 5 },
        ]);

      const result = await service.estimateDeliveryDate(
        "US-EAST",
        "US-WEST",
        "standard",
      );

      expect(result.origin_zone).toBe("US-EAST");
      expect(result.destination_zone).toBe("US-WEST");
      expect(result.estimated_days_min).toBe(3);
      expect(result.estimated_days_max).toBe(5);
      expect(result.estimated_min_date).toBeInstanceOf(Date);
      expect(result.estimated_max_date).toBeInstanceOf(Date);
    });

    it("throws when no rates found for route", async () => {
      jest.spyOn(service, "listShippingRates").mockResolvedValue([]);

      await expect(
        service.estimateDeliveryDate("UNKNOWN", "NOWHERE", "express"),
      ).rejects.toThrow(
        "No shipping rates found for the given route and method",
      );
    });
  });
});
