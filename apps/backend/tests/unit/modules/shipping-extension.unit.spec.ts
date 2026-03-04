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
    service = new ShippingExtensionModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getRatesForShipment", () => {
    it("returns rates matching weight and zones", async () => {
      vi.spyOn(service, "listShippingRates").mockResolvedValue([
        {
          id: "r1",
          min_weight: 0,
          max_weight: 10,
          origin_zone: "US",
          destination_zone: "EU",
        },
        {
          id: "r2",
          min_weight: 10,
          max_weight: 50,
          origin_zone: "US",
          destination_zone: "EU",
        },
      ]);

      const result = await service.getRatesForShipment("tenant-1", {
        weight: 5,
        originZone: "US",
        destZone: "EU",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
    });

    it("returns empty when no rates match weight", async () => {
      jest
        .spyOn(service, "listShippingRates")
        .mockResolvedValue([{ id: "r1", min_weight: 0, max_weight: 5 }]);

      const result = await service.getRatesForShipment("tenant-1", {
        weight: 10,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("calculateShippingCost", () => {
    it("calculates cost from base rate and per-kg rate", async () => {
      vi.spyOn(service, "retrieveShippingRate").mockResolvedValue({
        id: "r1",
        base_rate: "5.00",
        per_kg_rate: "2.50",
        carrier_name: "FedEx",
        service_type: "standard",
        estimated_days_min: 3,
        estimated_days_max: 5,
      });

      const result = await service.calculateShippingCost("r1", 4);

      expect(result.total_cost).toBe(15);
      expect(result.carrier_name).toBe("FedEx");
    });
  });

  describe("getTrackingUrl", () => {
    it("returns tracking URL with tracking number substituted", async () => {
      vi.spyOn(service, "listCarrierConfigs").mockResolvedValue([
        {
          carrier_code: "fedex",
          tracking_url_template: "https://track.fedex.com/{{tracking_number}}",
        },
      ]);

      const result = await service.getTrackingUrl("fedex", "123456");

      expect(result).toBe("https://track.fedex.com/123456");
    });

    it("throws when carrier not found", async () => {
      vi.spyOn(service, "listCarrierConfigs").mockResolvedValue([]);

      await expect(service.getTrackingUrl("unknown", "123")).rejects.toThrow(
        'Carrier with code "unknown" not found',
      );
    });

    it("returns null when no tracking URL template exists", async () => {
      jest
        .spyOn(service, "listCarrierConfigs")
        .mockResolvedValue([
          { carrier_code: "local", tracking_url_template: null },
        ]);

      const result = await service.getTrackingUrl("local", "123");

      expect(result).toBeNull();
    });
  });

  describe("calculateShippingRate", () => {
    it("throws when weight is zero or negative", async () => {
      await expect(
        service.calculateShippingRate({
          originZone: "US",
          destinationZone: "EU",
          weight: 0,
        }),
      ).rejects.toThrow("Weight must be a positive number");
    });

    it("throws when no rates are available", async () => {
      vi.spyOn(service, "listShippingRates").mockResolvedValue([]);

      await expect(
        service.calculateShippingRate({
          originZone: "US",
          destinationZone: "EU",
          weight: 5,
        }),
      ).rejects.toThrow("No shipping rates available");
    });

    it("uses volumetric weight when dimensions provided and larger", async () => {
      vi.spyOn(service, "listShippingRates").mockResolvedValue([
        {
          id: "r1",
          min_weight: 0,
          max_weight: 100,
          base_rate: "10",
          per_kg_rate: "1",
          carrier_name: "DHL",
          service_type: "express",
          estimated_days_min: 1,
          estimated_days_max: 3,
        },
      ]);

      const result = await service.calculateShippingRate({
        originZone: "US",
        destinationZone: "EU",
        weight: 2,
        dimensions: { length: 50, width: 50, height: 50 },
      });

      expect(result[0].total_cost).toBe(10 + 1 * 25);
    });
  });

  describe("validateShipmentCarrier", () => {
    it("validates an active carrier successfully", async () => {
      vi.spyOn(service, "retrieveCarrierConfig").mockResolvedValue({
        id: "carrier-1",
        carrier_name: "UPS",
        is_active: true,
        carrier_code: "ups",
      });

      const result = await service.validateShipmentCarrier(
        "carrier-1",
        "TRACK123",
        [{ productId: "prod-1", quantity: 1 }],
      );

      expect(result.valid).toBe(true);
      expect(result.carrier_name).toBe("UPS");
      expect(result.tracking_number).toBe("TRACK123");
    });

    it("throws when carrier is inactive", async () => {
      vi.spyOn(service, "retrieveCarrierConfig").mockResolvedValue({
        id: "carrier-1",
        carrier_name: "DHL",
        is_active: false,
        carrier_code: "dhl",
      });

      await expect(
        service.validateShipmentCarrier("carrier-1", "TRACK123", [
          { productId: "prod-1", quantity: 1 },
        ]),
      ).rejects.toThrow("not currently active");
    });

    it("throws when carrier is not found", async () => {
      jest
        .spyOn(service, "retrieveCarrierConfig")
        .mockRejectedValue(new Error("Not found"));

      await expect(
        service.validateShipmentCarrier("nonexistent", "TRACK123", [
          { productId: "prod-1", quantity: 1 },
        ]),
      ).rejects.toThrow("Not found");
    });
  });
});
