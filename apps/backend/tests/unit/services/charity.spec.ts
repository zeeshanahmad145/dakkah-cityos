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
        async retrieveDonationCampaign(_id: string): Promise<any> {
          return null;
        }
        async updateDonationCampaigns(_data: any): Promise<any> {
          return {};
        }
        async createDonations(_data: any): Promise<any> {
          return {};
        }
        async retrieveDonation(_id: string): Promise<any> {
          return null;
        }
        async listDonations(_filter: any): Promise<any> {
          return [];
        }
        async retrieveCharityOrg(_id: string): Promise<any> {
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

import CharityModuleService from "../../../src/modules/charity/service";

describe("CharityModuleService", () => {
  let service: CharityModuleService;

  beforeEach(() => {
    service = new CharityModuleService();
    jest.clearAllMocks();
  });

  describe("processDonation", () => {
    it("should process a valid donation", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp_01",
        status: "active",
        goal_amount: 100000,
        raised_amount: 50000,
        donor_count: 10,
      });
      jest.spyOn(service, "createDonations").mockResolvedValue({
        id: "don_01",
        campaign_id: "camp_01",
        donor_id: "donor_01",
        amount: 5000,
        status: "completed",
      });
      jest.spyOn(service, "updateDonationCampaigns").mockResolvedValue({});

      const result = await service.processDonation("camp_01", "donor_01", 5000);
      expect(result.amount).toBe(5000);
    });

    it("should reject donation to inactive campaign", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp_01",
        status: "completed",
        goal_amount: 100000,
      });

      await expect(
        service.processDonation("camp_01", "donor_01", 5000),
      ).rejects.toThrow("Campaign is not accepting donations");
    });

    it("should reject zero amount donation", async () => {
      await expect(
        service.processDonation("camp_01", "donor_01", 0),
      ).rejects.toThrow("Donation amount must be greater than zero");
    });
  });

  describe("issueTaxReceipt", () => {
    it("should generate a tax receipt for a completed donation", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_01",
        amount: 5000,
        donor_id: "donor_01",
        campaign_id: "camp_01",
        status: "completed",
        donated_at: new Date(),
      });
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        id: "camp_01",
        title: "Clean Water",
        charity_org_id: "org_01",
      });
      jest.spyOn(service, "retrieveCharityOrg").mockResolvedValue({
        id: "org_01",
        name: "Save the Children",
      });

      const result = await service.issueTaxReceipt("don_01");
      expect(result.receiptNumber).toBeDefined();
      expect(result.amount).toBe(5000);
      expect(result.organizationName).toBe("Save the Children");
    });

    it("should reject receipt for non-completed donation", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_01",
        status: "pending",
      });

      await expect(service.issueTaxReceipt("don_01")).rejects.toThrow(
        "Tax receipts can only be issued for completed donations",
      );
    });
  });

  describe("calculateTaxDeduction", () => {
    it("should calculate US tax deduction at 60%", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_01",
        amount: 10000,
        status: "completed",
      });

      const result = await service.calculateTaxDeduction("don_01", "US");
      expect(result.deductiblePercentage).toBe(60);
      expect(result.deductibleAmount).toBe(6000);
    });

    it("should calculate UK tax deduction at 100%", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_02",
        amount: 10000,
        status: "completed",
      });

      const result = await service.calculateTaxDeduction("don_02", "UK");
      expect(result.deductiblePercentage).toBe(100);
      expect(result.deductibleAmount).toBe(10000);
    });

    it("should return zero for non-deductible countries", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_03",
        amount: 10000,
        status: "completed",
      });

      const result = await service.calculateTaxDeduction("don_03", "SA");
      expect(result.deductibleAmount).toBe(0);
    });

    it("should reject for non-completed donations", async () => {
      jest.spyOn(service, "retrieveDonation").mockResolvedValue({
        id: "don_04",
        amount: 10000,
        status: "pending",
      });

      await expect(
        service.calculateTaxDeduction("don_04", "US"),
      ).rejects.toThrow(
        "Tax deduction can only be calculated for completed donations",
      );
    });
  });
});
