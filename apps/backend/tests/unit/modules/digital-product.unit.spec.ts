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
        async listDigitalAssets(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveDigitalAsset(_id: string): Promise<any> {
          return null;
        }
        async createDigitalAssets(_data: any): Promise<any> {
          return {};
        }
        async listDownloadLicenses(_filter: any, _options?: any): Promise<any> {
          return [];
        }
        async retrieveDownloadLicense(_id: string): Promise<any> {
          return null;
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
    Module: (_config: any) => ({}),
  };
});

import DigitalProductModuleService from "../../../src/modules/digital-product/service";

describe("DigitalProductModuleService", () => {
  let service: DigitalProductModuleService;

  beforeEach(() => {
    service = new DigitalProductModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("generateTimedDownloadLink", () => {
    it("generates a timed download link for valid license", async () => {
      jest
        .spyOn(service, "retrieveDigitalAsset")
        .mockResolvedValue({ id: "asset-1" });
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          download_count: 0,
          max_downloads: 100,
        },
      ]);

      const result = await service.generateTimedDownloadLink(
        "asset-1",
        "cust-1",
        7200,
      );

      expect(result.url).toContain("/downloads/");
      expect(result.token).toBeDefined();
      expect(result.productId).toBe("asset-1");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("throws when no active license found", async () => {
      jest
        .spyOn(service, "retrieveDigitalAsset")
        .mockResolvedValue({ id: "asset-1" });
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([]);

      await expect(
        service.generateTimedDownloadLink("asset-1", "cust-1"),
      ).rejects.toThrow("No active license found");
    });

    it("throws when download limit reached", async () => {
      jest
        .spyOn(service, "retrieveDigitalAsset")
        .mockResolvedValue({ id: "asset-1" });
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          download_count: 100,
          max_downloads: 100,
        },
      ]);

      await expect(
        service.generateTimedDownloadLink("asset-1", "cust-1"),
      ).rejects.toThrow("Download limit reached");
    });
  });

  describe("trackDownloadWithLimits", () => {
    it("tracks download and returns remaining count", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          download_count: 5,
          max_downloads: 100,
        },
      ]);
      vi.spyOn(service, "updateDownloadLicenses").mockResolvedValue({});

      const result = await service.trackDownloadWithLimits("asset-1", "cust-1");

      expect(result.downloadCount).toBe(6);
      expect(result.remainingDownloads).toBe(94);
      expect(result.limitReached).toBe(false);
    });

    it("returns limit reached when at max downloads", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        {
          id: "lic-1",
          status: "active",
          download_count: 100,
          max_downloads: 100,
        },
      ]);

      const result = await service.trackDownloadWithLimits("asset-1", "cust-1");

      expect(result.limitReached).toBe(true);
      expect(result.remainingDownloads).toBe(0);
    });

    it("throws when no active license exists", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([]);

      await expect(
        service.trackDownloadWithLimits("asset-1", "cust-1"),
      ).rejects.toThrow("No active license found");
    });
  });

  describe("revokeAccessWithReason", () => {
    it("revokes all active licenses with a reason", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([
        { id: "lic-1", status: "active", metadata: {} },
        { id: "lic-2", status: "active", metadata: {} },
      ]);
      vi.spyOn(service, "updateDownloadLicenses").mockResolvedValue({});

      const result = await service.revokeAccessWithReason(
        "asset-1",
        "cust-1",
        "Violation of TOS",
      );

      expect(result.revokedCount).toBe(2);
      expect(result.reason).toBe("Violation of TOS");
    });

    it("throws when no active license to revoke", async () => {
      vi.spyOn(service, "listDownloadLicenses").mockResolvedValue([]);

      await expect(
        service.revokeAccessWithReason("asset-1", "cust-1"),
      ).rejects.toThrow("No active license found to revoke");
    });
  });
});
