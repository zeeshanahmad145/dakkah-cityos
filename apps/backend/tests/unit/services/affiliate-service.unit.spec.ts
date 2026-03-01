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
        async listAffiliates(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAffiliate(_id: string): Promise<any> {
          return null;
        }
        async createAffiliates(_data: any): Promise<any> {
          return {};
        }
        async updateAffiliates(_data: any): Promise<any> {
          return {};
        }
        async listReferralLinks(_filter: any): Promise<any> {
          return [];
        }
        async createReferralLinks(_data: any): Promise<any> {
          return {};
        }
        async updateReferralLinks(_data: any): Promise<any> {
          return {};
        }
        async listClickTrackings(_filter: any): Promise<any> {
          return [];
        }
        async createClickTrackings(_data: any): Promise<any> {
          return {};
        }
        async listAffiliateCommissions(_filter: any): Promise<any> {
          return [];
        }
        async createAffiliateCommissions(_data: any): Promise<any> {
          return {};
        }
        async listInfluencerCampaigns(_filter: any): Promise<any> {
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

import AffiliateModuleService from "../../../src/modules/affiliate/service";

describe("AffiliateModuleService", () => {
  let service: AffiliateModuleService;

  beforeEach(() => {
    service = new AffiliateModuleService();
    jest.clearAllMocks();
  });

  describe("registerAffiliate", () => {
    it("registers a new affiliate successfully", async () => {
      jest.spyOn(service, "listAffiliates").mockResolvedValue([]);
      const createSpy = jest
        .spyOn(service, "createAffiliates")
        .mockResolvedValue({ id: "aff-1", name: "Test Affiliate" });

      const result = await service.registerAffiliate({
        vendorId: "vendor-1",
        name: "Test Affiliate",
        commissionRate: 10,
        paymentMethod: "paypal",
      });

      expect(result.id).toBe("aff-1");
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ vendor_id: "vendor-1", status: "active" }),
      );
    });

    it("throws when vendorId or name is missing", async () => {
      await expect(
        service.registerAffiliate({
          vendorId: "",
          name: "Test",
          commissionRate: 10,
          paymentMethod: "paypal",
        }),
      ).rejects.toThrow("Vendor ID and name are required");
    });

    it("throws when commission rate is out of range", async () => {
      await expect(
        service.registerAffiliate({
          vendorId: "v1",
          name: "Test",
          commissionRate: 150,
          paymentMethod: "paypal",
        }),
      ).rejects.toThrow("Commission rate must be between 0 and 100");
    });

    it("throws when payment method is invalid", async () => {
      await expect(
        service.registerAffiliate({
          vendorId: "v1",
          name: "Test",
          commissionRate: 10,
          paymentMethod: "cash",
        }),
      ).rejects.toThrow("Invalid payment method");
    });

    it("throws when affiliate already exists for vendor", async () => {
      jest
        .spyOn(service, "listAffiliates")
        .mockResolvedValue([{ id: "aff-1" }]);

      await expect(
        service.registerAffiliate({
          vendorId: "v1",
          name: "Test",
          commissionRate: 10,
          paymentMethod: "paypal",
        }),
      ).rejects.toThrow("An affiliate already exists for this vendor");
    });
  });

  describe("calculatePayout", () => {
    it("sums unpaid commissions within period", async () => {
      jest
        .spyOn(service, "retrieveAffiliate")
        .mockResolvedValue({ id: "aff-1" });
      jest.spyOn(service, "listAffiliateCommissions").mockResolvedValue([
        { amount: 50, created_at: "2025-01-15", status: "pending" },
        { amount: 30, created_at: "2025-01-20", status: "pending" },
        { amount: 20, created_at: "2025-01-10", status: "paid" },
      ]);

      const result = await service.calculatePayout(
        "aff-1",
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(result.pendingAmount).toBe(80);
      expect(result.commissionCount).toBe(2);
    });
  });

  describe("getAffiliatePerformance", () => {
    it("aggregates performance stats correctly", async () => {
      jest
        .spyOn(service, "retrieveAffiliate")
        .mockResolvedValue({ id: "aff-1" });
      jest.spyOn(service, "listReferralLinks").mockResolvedValue([
        { click_count: 100, conversion_count: 10 },
        { click_count: 200, conversion_count: 30 },
      ]);
      jest
        .spyOn(service, "listAffiliateCommissions")
        .mockResolvedValue([{ amount: 50 }, { amount: 75 }]);

      const result = await service.getAffiliatePerformance("aff-1");

      expect(result.totalReferrals).toBe(300);
      expect(result.totalConversions).toBe(40);
      expect(result.totalEarnings).toBe(125);
      expect(result.conversionRate).toBe(13.33);
    });
  });
});
