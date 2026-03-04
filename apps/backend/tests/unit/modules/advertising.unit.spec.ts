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
        async listAdCampaigns(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAdCampaign(_id: string): Promise<any> {
          return null;
        }
        async createAdCampaigns(_data: any): Promise<any> {
          return {};
        }
        async updateAdCampaigns(_data: any): Promise<any> {
          return {};
        }
        async retrieveAdAccount(_id: string): Promise<any> {
          return null;
        }
        async retrieveAdCreative(_id: string): Promise<any> {
          return null;
        }
        async updateAdCreatives(_data: any): Promise<any> {
          return {};
        }
        async createImpressionLogs(_data: any): Promise<any> {
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

import AdvertisingModuleService from "../../../src/modules/advertising/service";

describe("AdvertisingModuleService", () => {
  let service: AdvertisingModuleService;

  beforeEach(() => {
    service = new AdvertisingModuleService({ baseRepository: { serialize: vi.fn(), transaction: vi.fn(), manager: {} } });
    vi.clearAllMocks();
  });

  describe("createCampaign", () => {
    it("creates a campaign with valid data", async () => {
      jest
        .spyOn(service, "retrieveAdAccount")
        .mockResolvedValue({ id: "acc-1", status: "active" });
      const createSpy = jest
        .spyOn(service, "createAdCampaigns")
        .mockResolvedValue({ id: "camp-1" });

      const result = await service.createCampaign({
        accountId: "acc-1",
        name: "Summer Sale",
        budget: 5000,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(result).toEqual({ id: "camp-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Summer Sale",
          budget: 5000,
          status: "draft",
          spent: 0,
        }),
      );
    });

    it("throws when budget is zero or negative", async () => {
      await expect(
        service.createCampaign({
          accountId: "acc-1",
          name: "Bad Campaign",
          budget: 0,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Campaign name and positive budget are required");
    });

    it("throws when end date is before start date", async () => {
      jest
        .spyOn(service, "retrieveAdAccount")
        .mockResolvedValue({ id: "acc-1", status: "active" });

      await expect(
        service.createCampaign({
          accountId: "acc-1",
          name: "Bad Dates",
          budget: 1000,
          startDate: new Date("2025-06-30"),
          endDate: new Date("2025-06-01"),
        }),
      ).rejects.toThrow("End date must be after start date");
    });

    it("throws when ad account is not active", async () => {
      jest
        .spyOn(service, "retrieveAdAccount")
        .mockResolvedValue({ id: "acc-1", status: "suspended" });

      await expect(
        service.createCampaign({
          accountId: "acc-1",
          name: "Test",
          budget: 1000,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Ad account is not active");
    });
  });

  describe("pauseCampaign", () => {
    it("pauses an active campaign", async () => {
      jest
        .spyOn(service, "retrieveAdCampaign")
        .mockResolvedValue({ id: "camp-1", status: "active" });
      const updateSpy = jest
        .spyOn(service, "updateAdCampaigns")
        .mockResolvedValue({});

      await service.pauseCampaign("camp-1");

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "camp-1",
          status: "paused",
        }),
      );
    });

    it("throws when campaign is not active", async () => {
      jest
        .spyOn(service, "retrieveAdCampaign")
        .mockResolvedValue({ id: "camp-1", status: "paused" });

      await expect(service.pauseCampaign("camp-1")).rejects.toThrow(
        "Only active campaigns can be paused",
      );
    });
  });

  describe("calculateCTR", () => {
    it("calculates click-through rate correctly", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        impressions: 1000,
        clicks: 50,
      });

      const result = await service.calculateCTR("camp-1");

      expect(result.impressions).toBe(1000);
      expect(result.clicks).toBe(50);
      expect(result.ctr).toBe(5);
    });

    it("returns zero CTR when no impressions", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        impressions: 0,
        clicks: 0,
      });

      const result = await service.calculateCTR("camp-1");
      expect(result.ctr).toBe(0);
    });
  });

  describe("adjustBudget", () => {
    it("adjusts budget for a non-completed campaign", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        status: "active",
        spent: 200,
      });
      const updateSpy = jest
        .spyOn(service, "updateAdCampaigns")
        .mockResolvedValue({});

      await service.adjustBudget("camp-1", 5000);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "camp-1",
          budget: 5000,
        }),
      );
    });

    it("throws when new budget is less than spent amount", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        status: "active",
        spent: 3000,
      });

      await expect(service.adjustBudget("camp-1", 2000)).rejects.toThrow(
        "New budget cannot be less than already spent amount",
      );
    });

    it("throws when campaign is completed", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        status: "completed",
        spent: 0,
      });

      await expect(service.adjustBudget("camp-1", 5000)).rejects.toThrow(
        "Cannot adjust budget for a completed campaign",
      );
    });

    it("throws when budget is zero", async () => {
      await expect(service.adjustBudget("camp-1", 0)).rejects.toThrow(
        "Budget must be greater than zero",
      );
    });
  });

  describe("getROIReport", () => {
    it("returns ROI metrics for a campaign", async () => {
      vi.spyOn(service, "retrieveAdCampaign").mockResolvedValue({
        id: "camp-1",
        impressions: 10000,
        clicks: 500,
        spent: 2500,
        budget: 5000,
      });

      const result = await service.getROIReport("camp-1");

      expect(result.campaignId).toBe("camp-1");
      expect(result.impressions).toBe(10000);
      expect(result.clicks).toBe(500);
      expect(result.ctr).toBe(5);
      expect(result.budgetUtilization).toBe(50);
      expect(result.costPerClick).toBe(5);
    });
  });
});
