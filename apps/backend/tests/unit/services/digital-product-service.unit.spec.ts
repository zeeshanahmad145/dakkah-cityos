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
        async listDigitalAssets(_filter: any): Promise<any> {
          return [];
        }
        async retrieveDigitalAsset(_id: string): Promise<any> {
          return null;
        }
        async createDigitalAssets(_data: any): Promise<any> {
          return {};
        }
        async listDownloadLicenses(_filter: any): Promise<any> {
          return [];
        }
        async createDownloadLicenses(_data: any): Promise<any> {
          return {};
        }
        async updateDownloadLicenses(_data: any): Promise<any> {
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

import DigitalProductModuleService from "../../../src/modules/digital-product/service";

describe("DigitalProductModuleService", () => {
  let service: DigitalProductModuleService;

  beforeEach(() => {
    service = new DigitalProductModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("purchaseLicense", () => {
    it("creates a single license", async () => {
      jest
        .spyOn(service, "retrieveDigitalAsset")
        .mockResolvedValue({ id: "asset-1" });
      const createSpy = jest
        .spyOn(service, "createDownloadLicenses")
        .mockResolvedValue({ id: "lic-1" });

      const result = await service.purchaseLicense(
        "asset-1",
        "cust-1",
        "single",
      );

      expect(result.id).toBe("lic-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ max_activations: 1, license_type: "single" }),
      );
    });

    it("creates a team license with 5 activations", async () => {
      jest
        .spyOn(service, "retrieveDigitalAsset")
        .mockResolvedValue({ id: "asset-1" });
      const createSpy = jest
        .spyOn(service, "createDownloadLicenses")
        .mockResolvedValue({ id: "lic-1" });

      await service.purchaseLicense("asset-1", "cust-1", "team");

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ max_activations: 5 }),
      );
    });

    it("throws when license type is invalid", async () => {
      await expect(
        service.purchaseLicense("asset-1", "cust-1", "invalid"),
      ).rejects.toThrow("License type must be one of");
    });

    it("throws when product or customer ID is missing", async () => {
      await expect(
        service.purchaseLicense("", "cust-1", "single"),
      ).rejects.toThrow("Product ID and customer ID are required");
    });
  });

  describe("verifyLicense", () => {
    it("returns valid for active license with remaining activations", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          max_activations: 5,
          activation_count: 2,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      ]);

      const result = await service.verifyLicense("LIC-SINGLE-123");

      expect(result.valid).toBe(true);
      expect(result.remainingActivations).toBe(3);
    });

    it("returns invalid for non-existent license", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([]);

      const result = await service.verifyLicense("LIC-INVALID");

      expect(result.valid).toBe(false);
    });

    it("returns invalid for expired license", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          expires_at: new Date("2020-01-01"),
        },
      ]);
      vi.spyOn(service, "updateDownloadLicenses").mockResolvedValue({});

      const result = await service.verifyLicense("LIC-EXPIRED");

      expect(result.valid).toBe(false);
    });

    it("throws when license key is empty", async () => {
      await expect(service.verifyLicense("")).rejects.toThrow(
        "License key is required",
      );
    });
  });
});
