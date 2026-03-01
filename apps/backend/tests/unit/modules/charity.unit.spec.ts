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
        async listCharityOrgs(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCharityOrg(_id: string): Promise<any> {
          return null;
        }
        async listDonationCampaigns(_filter: any): Promise<any> {
          return [];
        }
        async retrieveDonationCampaign(_id: string): Promise<any> {
          return null;
        }
        async createDonationCampaigns(_data: any): Promise<any> {
          return {};
        }
        async updateDonationCampaigns(_data: any): Promise<any> {
          return {};
        }
        async listDonations(_filter: any): Promise<any> {
          return [];
        }
        async retrieveDonation(_id: string): Promise<any> {
          return null;
        }
        async createDonations(_data: any): Promise<any> {
          return {};
        }
        async createImpactReports(_data: any): Promise<any> {
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

import CharityModuleService from "../../../src/modules/charity/service";

describe("CharityModuleService", () => {
  let service: CharityModuleService;

  beforeEach(() => {
    service = new CharityModuleService();
    jest.clearAllMocks();
  });

  describe("processDonation", () => {
    it("processes a valid donation", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        status: "active",
        raised_amount: 500,
        donor_count: 10,
      });
      const createSpy = jest
        .spyOn(service, "createDonations")
        .mockResolvedValue({ id: "don-1" });
      const updateSpy = jest
        .spyOn(service, "updateDonationCampaigns")
        .mockResolvedValue({});

      const result = await service.processDonation("camp-1", "donor-1", 100);

      expect(result).toEqual({ id: "don-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_id: "camp-1",
          donor_id: "donor-1",
          amount: 100,
          status: "completed",
        }),
      );
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          raised_amount: 600,
          donor_count: 11,
        }),
      );
    });

    it("throws when donation amount is zero", async () => {
      await expect(
        service.processDonation("camp-1", "donor-1", 0),
      ).rejects.toThrow("Donation amount must be greater than zero");
    });

    it("throws when campaign is not active", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        status: "completed",
      });

      await expect(
        service.processDonation("camp-1", "donor-1", 100),
      ).rejects.toThrow("Campaign is not accepting donations");
    });

    it("throws when campaign has ended", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        status: "active",
        end_date: "2020-01-01",
      });

      await expect(
        service.processDonation("camp-1", "donor-1", 100),
      ).rejects.toThrow("Campaign has ended");
    });
  });

  describe("getCampaignProgress", () => {
    it("calculates campaign progress correctly", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        raised_amount: 7500,
        goal_amount: 10000,
        donor_count: 50,
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await service.getCampaignProgress("camp-1");

      expect(result.raised).toBe(7500);
      expect(result.goal).toBe(10000);
      expect(result.percentage).toBe(75);
      expect(result.donorCount).toBe(50);
      expect(result.daysRemaining).toBeGreaterThan(0);
    });

    it("caps percentage at 100 when goal is exceeded", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        raised_amount: 15000,
        goal_amount: 10000,
        donor_count: 100,
      });

      const result = await service.getCampaignProgress("camp-1");

      expect(result.percentage).toBe(100);
    });

    it("returns null days remaining when no end date", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        raised_amount: 0,
        goal_amount: 10000,
        donor_count: 0,
      });

      const result = await service.getCampaignProgress("camp-1");

      expect(result.daysRemaining).toBeNull();
    });
  });

  describe("createCampaign", () => {
    it("creates a campaign with valid data", async () => {
      jest
        .spyOn(service, "retrieveCharityOrg")
        .mockResolvedValue({ id: "org-1", status: "active" });
      const createSpy = jest
        .spyOn(service, "createDonationCampaigns")
        .mockResolvedValue({ id: "camp-1" });

      const result = await service.createCampaign({
        name: "Clean Water Fund",
        description: "Providing clean water",
        goalAmount: 50000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        organizationId: "org-1",
      });

      expect(result).toEqual({ id: "camp-1" });
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Clean Water Fund",
          goal_amount: 50000,
          status: "active",
        }),
      );
    });

    it("throws when goal amount is zero", async () => {
      await expect(
        service.createCampaign({
          name: "Test",
          description: "Test",
          goalAmount: 0,
          startDate: new Date(),
          endDate: new Date(),
          organizationId: "org-1",
        }),
      ).rejects.toThrow("Goal amount must be greater than zero");
    });

    it("throws when org is not active or verified", async () => {
      jest
        .spyOn(service, "retrieveCharityOrg")
        .mockResolvedValue({ id: "org-1", status: "pending" });

      await expect(
        service.createCampaign({
          name: "Test",
          description: "Test",
          goalAmount: 1000,
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-12-31"),
          organizationId: "org-1",
        }),
      ).rejects.toThrow("Organization must be active or verified");
    });
  });

  describe("issueTaxReceipt", () => {
    it("issues a tax receipt for a completed donation", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don-1",
        campaign_id: "camp-1",
        donor_id: "donor-1",
        amount: 500,
        status: "completed",
        donated_at: new Date(),
      });
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp-1",
        charity_org_id: "org-1",
        title: "Clean Water Fund",
      });
      jest
        .spyOn(service, "retrieveCharityOrg")
        .mockResolvedValue({ id: "org-1", name: "Water.org" });

      const result = await service.issueTaxReceipt("don-1");

      expect(result.donationId).toBe("don-1");
      expect(result.donorId).toBe("donor-1");
      expect(result.amount).toBe(500);
      expect(result.campaignName).toBe("Clean Water Fund");
      expect(result.organizationName).toBe("Water.org");
      expect(result.receiptNumber).toMatch(/^TR-/);
    });

    it("throws for non-completed donations", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don-1",
        status: "pending",
      });

      await expect(service.issueTaxReceipt("don-1")).rejects.toThrow(
        "Tax receipts can only be issued for completed donations",
      );
    });
  });
});
