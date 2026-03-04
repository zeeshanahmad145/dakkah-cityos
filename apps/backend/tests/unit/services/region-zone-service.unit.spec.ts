import { vi } from "vitest";
vi.mock("@medusajs/framework/utils", () => {
  const chainable = () => {
    const chain: any = {
      primaryKey: () => chain,
      nullable: () => chain,
      default: () => chain,
    };
    return chain;
  };
  return {
    MedusaService: () =>
      class MockMedusaBase {
        async listRegionZoneMappings(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRegionZoneMapping(_id: string): Promise<any> {
          return null;
        }
        async createRegionZoneMappings(_data: any): Promise<any> {
          return {};
        }
        async updateRegionZoneMappings(_data: any): Promise<any> {
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

import RegionZoneModuleService from "../../../src/modules/region-zone/service";

describe("RegionZoneModuleService", () => {
  let service: RegionZoneModuleService;

  beforeEach(() => {
    service = new RegionZoneModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("getRegionsForZone", () => {
    it("returns array of mappings for a zone", async () => {
      const mappings = [
        { id: "1", residency_zone: "GCC", medusa_region_id: "reg_1" },
        { id: "2", residency_zone: "GCC", medusa_region_id: "reg_2" },
      ];
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mappings);

      const result = await service.getRegionsForZone("GCC");
      expect(result).toEqual(mappings);
    });

    it("wraps single object in array", async () => {
      const mapping = {
        id: "1",
        residency_zone: "GCC",
        medusa_region_id: "reg_1",
      };
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mapping);

      const result = await service.getRegionsForZone("GCC");
      expect(result).toEqual([mapping]);
    });
  });

  describe("getZoneForRegion", () => {
    it("returns first matching mapping", async () => {
      const mapping = {
        id: "1",
        residency_zone: "GCC",
        medusa_region_id: "reg_1",
      };
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([mapping]);

      const result = await service.getZoneForRegion("reg_1");
      expect(result).toEqual(mapping);
    });

    it("returns null when no mappings found", async () => {
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue([]);

      const result = await service.getZoneForRegion("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getZonesByRegion", () => {
    it("returns formatted zone data", async () => {
      const mapping = {
        medusa_region_id: "reg_1",
        residency_zone: "GCC",
        country_codes: ["SA", "AE"],
        metadata: { key: "val" },
      };
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([mapping]);

      const result = await service.getZonesByRegion("reg_1");
      expect(result).toEqual({
        regionId: "reg_1",
        zone: "GCC",
        countries: ["SA", "AE"],
        metadata: { key: "val" },
      });
    });

    it("returns null when no mapping found", async () => {
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue([]);

      const result = await service.getZonesByRegion("nonexistent");
      expect(result).toBeNull();
    });

    it("defaults countries and metadata to empty", async () => {
      const mapping = {
        medusa_region_id: "reg_1",
        residency_zone: "EU",
        country_codes: null,
        metadata: null,
      };
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([mapping]);

      const result = await service.getZonesByRegion("reg_1");
      expect(result!.countries).toEqual([]);
      expect(result!.metadata).toEqual({});
    });
  });

  describe("getActiveZones", () => {
    it("groups mappings by zone", async () => {
      const mappings = [
        {
          residency_zone: "GCC",
          medusa_region_id: "reg_1",
          country_codes: ["SA", "AE"],
        },
        {
          residency_zone: "GCC",
          medusa_region_id: "reg_2",
          country_codes: ["KW"],
        },
        {
          residency_zone: "EU",
          medusa_region_id: "reg_3",
          country_codes: ["DE", "FR"],
        },
      ];
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mappings);

      const result = await service.getActiveZones();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        zone: "GCC",
        regions: ["reg_1", "reg_2"],
        totalCountries: 3,
      });
      expect(result[1]).toEqual({
        zone: "EU",
        regions: ["reg_3"],
        totalCountries: 2,
      });
    });

    it("handles mappings without country_codes", async () => {
      const mappings = [
        {
          residency_zone: "GLOBAL",
          medusa_region_id: "reg_1",
          country_codes: null,
        },
      ];
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mappings);

      const result = await service.getActiveZones();
      expect(result[0].totalCountries).toBe(0);
    });
  });

  describe("validateZoneAccess", () => {
    it("returns true when mappings exist", async () => {
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([{ id: "1", metadata: null }]);

      const result = await service.validateZoneAccess("tenant-1", "GCC");
      expect(result).toBe(true);
    });

    it("returns false when no mappings", async () => {
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue([]);

      const result = await service.validateZoneAccess("tenant-1", "GCC");
      expect(result).toBe(false);
    });

    it("returns true with public_access metadata", async () => {
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([{ id: "1", metadata: { public_access: true } }]);

      const result = await service.validateZoneAccess("tenant-1", "GCC");
      expect(result).toBe(true);
    });

    it("returns false on error", async () => {
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockRejectedValue(new Error("fail"));

      const result = await service.validateZoneAccess("tenant-1", "GCC");
      expect(result).toBe(false);
    });
  });

  describe("getResidencyRequirements", () => {
    it("returns requirements with compliance info", async () => {
      const mappings = [
        {
          medusa_region_id: "reg_1",
          country_codes: ["SA"],
          policies_override: { vat: true },
        },
      ];
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mappings);

      const result = await service.getResidencyRequirements("GCC");
      expect(result).toMatchObject({
        zone: "GCC",
        regions: ["reg_1"],
        countries: ["SA"],
        policies: { vat: true },
        complianceRequirements: {
          dataLocalization: true,
          encryptionRequired: true,
          retentionPolicy: "3 years",
        },
      });
    });

    it("returns null when no mappings", async () => {
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue([]);

      const result = await service.getResidencyRequirements("UNKNOWN");
      expect(result).toBeNull();
    });
  });

  describe("resolveZoneForCountry", () => {
    it("finds zone for matching country code", async () => {
      const mappings = [
        {
          residency_zone: "GCC",
          medusa_region_id: "reg_1",
          country_codes: ["SA", "AE"],
          policies_override: null,
        },
      ];
      vi.spyOn(service, "listRegionZoneMappings").mockResolvedValue(mappings);

      const result = await service.resolveZoneForCountry("sa");
      expect(result).toEqual({
        countryCode: "sa",
        zone: "GCC",
        region: "reg_1",
        policies: {},
      });
    });

    it("returns null when no country match", async () => {
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([{ residency_zone: "GCC", country_codes: ["SA"] }]);

      const result = await service.resolveZoneForCountry("US");
      expect(result).toBeNull();
    });

    it("skips mappings without country_codes", async () => {
      jest
        .spyOn(service, "listRegionZoneMappings")
        .mockResolvedValue([{ residency_zone: "GLOBAL", country_codes: null }]);

      const result = await service.resolveZoneForCountry("US");
      expect(result).toBeNull();
    });
  });
});
