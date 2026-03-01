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
        async listCrowdfundCampaigns(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCrowdfundCampaign(_id: string): Promise<any> {
          return null;
        }
        async createCrowdfundCampaigns(_data: any): Promise<any> {
          return {};
        }
        async updateCrowdfundCampaigns(_data: any): Promise<any> {
          return {};
        }
        async listPledges(_filter: any): Promise<any> {
          return [];
        }
        async retrievePledge(_id: string): Promise<any> {
          return null;
        }
        async createPledges(_data: any): Promise<any> {
          return {};
        }
        async updatePledges(_data: any): Promise<any> {
          return {};
        }
        async listRewardTiers(_filter: any): Promise<any> {
          return [];
        }
        async retrieveRewardTier(_id: string): Promise<any> {
          return null;
        }
        async createRewardTiers(_data: any): Promise<any> {
          return {};
        }
        async updateRewardTiers(_data: any): Promise<any> {
          return {};
        }
        async listCampaignUpdates(_filter: any): Promise<any> {
          return [];
        }
        async listBackers(_filter: any): Promise<any> {
          return [];
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

import CrowdfundingModuleService from "../../../src/modules/crowdfunding/service";

describe("CrowdfundingModuleService", () => {
  let service: CrowdfundingModuleService;

  beforeEach(() => {
    service = new CrowdfundingModuleService();
    jest.clearAllMocks();
  });

  describe("launchCampaign", () => {
    it("launches a campaign successfully", async () => {
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const createSpy = jest
        .spyOn(service, "createCrowdfundCampaigns")
        .mockResolvedValue({ id: "camp-1" });

      const result = await service.launchCampaign({
        creatorId: "creator-1",
        title: "My Campaign",
        goalAmount: 10000,
        endDate,
      });

      expect(result.id).toBe("camp-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active", goal_amount: 10000 }),
      );
    });

    it("throws when title is empty", async () => {
      await expect(
        service.launchCampaign({
          creatorId: "c1",
          title: "",
          goalAmount: 10000,
          endDate: new Date(Date.now() + 86400000),
        }),
      ).rejects.toThrow("Campaign title is required");
    });

    it("throws when goal amount is zero or negative", async () => {
      await expect(
        service.launchCampaign({
          creatorId: "c1",
          title: "Test",
          goalAmount: 0,
          endDate: new Date(Date.now() + 86400000),
        }),
      ).rejects.toThrow("Goal amount must be greater than zero");
    });

    it("throws when end date is in the past", async () => {
      await expect(
        service.launchCampaign({
          creatorId: "c1",
          title: "Test",
          goalAmount: 10000,
          endDate: new Date("2020-01-01"),
        }),
      ).rejects.toThrow("End date must be in the future");
    });

    it("throws when campaign exceeds 90 days", async () => {
      const endDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
      await expect(
        service.launchCampaign({
          creatorId: "c1",
          title: "Test",
          goalAmount: 10000,
          endDate,
        }),
      ).rejects.toThrow("Campaign duration cannot exceed 90 days");
    });
  });

  describe("getCampaignDashboard", () => {
    it("returns dashboard metrics", async () => {
      const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      jest.spyOn(service, "retrieveCrowdfundCampaign").mockResolvedValue({
        id: "camp-1",
        goal_amount: 10000,
        current_amount: 5000,
        backer_count: 50,
        end_date: endDate,
      });
      jest.spyOn(service, "listRewardTiers").mockResolvedValue([{ id: "t1" }]);
      jest
        .spyOn(service, "listPledges")
        .mockResolvedValue([{ id: "p1", amount: 100, pledged_at: new Date() }]);

      const result = await service.getCampaignDashboard("camp-1");

      expect(result.raisedAmount).toBe(5000);
      expect(result.fundingPercentage).toBe(50);
      expect(result.backerCount).toBe(50);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.rewardTiers).toHaveLength(1);
    });
  });

  describe("claimReward", () => {
    it("claims reward when campaign is funded", async () => {
      jest.spyOn(service, "retrievePledge").mockResolvedValue({
        id: "p1",
        status: "active",
        reward_tier_id: "t1",
        campaign_id: "camp-1",
      });
      jest.spyOn(service, "retrieveCrowdfundCampaign").mockResolvedValue({
        id: "camp-1",
        goal_amount: 10000,
        current_amount: 15000,
      });
      jest
        .spyOn(service, "retrieveRewardTier")
        .mockResolvedValue({ id: "t1", limit: 100, claimed_count: 5 });
      jest.spyOn(service, "updateRewardTiers").mockResolvedValue({});
      const updateSpy = jest
        .spyOn(service, "updatePledges")
        .mockResolvedValue({ id: "p1", status: "reward_claimed" });

      const result = await service.claimReward("p1");

      expect(result.status).toBe("reward_claimed");
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "reward_claimed" }),
      );
    });

    it("throws when campaign has not met its funding goal", async () => {
      jest.spyOn(service, "retrievePledge").mockResolvedValue({
        id: "p1",
        status: "active",
        reward_tier_id: "t1",
        campaign_id: "camp-1",
      });
      jest.spyOn(service, "retrieveCrowdfundCampaign").mockResolvedValue({
        id: "camp-1",
        goal_amount: 10000,
        current_amount: 5000,
      });

      await expect(service.claimReward("p1")).rejects.toThrow(
        "Campaign has not met its funding goal yet",
      );
    });

    it("throws when pledge is not active", async () => {
      jest
        .spyOn(service, "retrievePledge")
        .mockResolvedValue({ id: "p1", status: "refunded" });

      await expect(service.claimReward("p1")).rejects.toThrow(
        "Only active pledges can claim rewards",
      );
    });
  });
});
