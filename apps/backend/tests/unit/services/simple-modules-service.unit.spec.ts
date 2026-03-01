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
        async retrieveAdAccount(_id: string): Promise<any> {
          return null;
        }
        async retrieveAdCampaign(_id: string): Promise<any> {
          return null;
        }
        async retrieveAdCreative(_id: string): Promise<any> {
          return null;
        }
        async createAdCampaigns(_data: any): Promise<any> {
          return {};
        }
        async updateAdCampaigns(_data: any): Promise<any> {
          return {};
        }
        async createImpressionLogs(_data: any): Promise<any> {
          return {};
        }
        async retrieveAffiliate(_id: string): Promise<any> {
          return null;
        }
        async listAffiliates(_filter: any): Promise<any> {
          return [];
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
        async createClickTrackings(_data: any): Promise<any> {
          return {};
        }
        async listAffiliateCommissions(_filter: any): Promise<any> {
          return [];
        }
        async listAnalyticsEvents(_filter: any): Promise<any> {
          return [];
        }
        async createAnalyticsEvents(_data: any): Promise<any> {
          return {};
        }
        async retrieveReport(_id: string): Promise<any> {
          return null;
        }
        async updateReports(_data: any): Promise<any> {
          return {};
        }
        async listDashboards(_filter: any): Promise<any> {
          return [];
        }
        async retrieveAuctionListing(_id: string): Promise<any> {
          return null;
        }
        async updateAuctionListings(_data: any): Promise<any> {
          return {};
        }
        async listBids(_filter: any): Promise<any> {
          return [];
        }
        async createBids(_data: any): Promise<any> {
          return {};
        }
        async createAuctionResults(_data: any): Promise<any> {
          return {};
        }
        async listAuditLogs(_filter: any): Promise<any> {
          return [];
        }
        async createAuditLogs(_data: any): Promise<any> {
          return {};
        }
        async retrieveVehicleListing(_id: string): Promise<any> {
          return null;
        }
        async updateVehicleListings(_data: any): Promise<any> {
          return {};
        }
        async retrieveTradeIn(_id: string): Promise<any> {
          return null;
        }
        async listTradeIns(_filter: any): Promise<any> {
          return [];
        }
        async createTradeIns(_data: any): Promise<any> {
          return {};
        }
        async updateTradeIns(_data: any): Promise<any> {
          return {};
        }
        async retrieveDonationCampaign(_id: string): Promise<any> {
          return null;
        }
        async listDonations(_filter: any): Promise<any> {
          return [];
        }
        async createDonations(_data: any): Promise<any> {
          return {};
        }
        async updateDonationCampaigns(_data: any): Promise<any> {
          return {};
        }
        async createImpactReports(_data: any): Promise<any> {
          return {};
        }
        async retrieveClassifiedListing(_id: string): Promise<any> {
          return null;
        }
        async updateClassifiedListings(_data: any): Promise<any> {
          return {};
        }
        async createListingFlags(_data: any): Promise<any> {
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
import AffiliateModuleService from "../../../src/modules/affiliate/service";
import AnalyticsModuleService from "../../../src/modules/analytics/service";
import AuctionModuleService from "../../../src/modules/auction/service";
import AuditModuleService from "../../../src/modules/audit/service";
import AutomotiveModuleService from "../../../src/modules/automotive/service";
import CharityModuleService from "../../../src/modules/charity/service";
import ClassifiedModuleService from "../../../src/modules/classified/service";

describe("AdvertisingModuleService", () => {
  let service: AdvertisingModuleService;

  beforeEach(() => {
    service = new AdvertisingModuleService();
    jest.clearAllMocks();
  });

  describe("createCampaign", () => {
    it("throws when budget is zero", async () => {
      await expect(
        service.createCampaign({
          accountId: "a1",
          name: "Test",
          budget: 0,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Campaign name and positive budget are required");
    });

    it("throws when end date before start date", async () => {
      jest
        .spyOn(service, "retrieveAdAccount")
        .mockResolvedValue({ status: "active" });

      await expect(
        service.createCampaign({
          accountId: "a1",
          name: "Test",
          budget: 100,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2025-05-01"),
        }),
      ).rejects.toThrow("End date must be after start date");
    });

    it("throws when account not active", async () => {
      jest
        .spyOn(service, "retrieveAdAccount")
        .mockResolvedValue({ status: "suspended" });

      await expect(
        service.createCampaign({
          accountId: "a1",
          name: "Test",
          budget: 100,
          startDate: new Date(),
        }),
      ).rejects.toThrow("Ad account is not active");
    });
  });

  describe("calculateCTR", () => {
    it("calculates click-through rate", async () => {
      jest
        .spyOn(service, "retrieveAdCampaign")
        .mockResolvedValue({ impressions: 1000, clicks: 50 });

      const result = await service.calculateCTR("c1");
      expect(result.ctr).toBe(5);
    });

    it("returns zero CTR when no impressions", async () => {
      jest
        .spyOn(service, "retrieveAdCampaign")
        .mockResolvedValue({ impressions: 0, clicks: 0 });

      const result = await service.calculateCTR("c1");
      expect(result.ctr).toBe(0);
    });
  });

  describe("pauseCampaign", () => {
    it("throws when campaign not active", async () => {
      jest
        .spyOn(service, "retrieveAdCampaign")
        .mockResolvedValue({ status: "paused" });

      await expect(service.pauseCampaign("c1")).rejects.toThrow(
        "Only active campaigns can be paused",
      );
    });
  });
});

describe("AffiliateModuleService", () => {
  let service: AffiliateModuleService;

  beforeEach(() => {
    service = new AffiliateModuleService();
    jest.clearAllMocks();
  });

  describe("generateReferralCode", () => {
    it("creates a referral link with code", async () => {
      jest
        .spyOn(service, "retrieveAffiliate")
        .mockResolvedValue({ id: "aff_1" });
      jest
        .spyOn(service, "createReferralLinks")
        .mockResolvedValue({ id: "rl_1", code: "REF-123" });

      const result = await service.generateReferralCode("aff_1");
      expect(result.id).toBe("rl_1");
    });
  });

  describe("trackReferral", () => {
    it("throws for invalid referral code", async () => {
      jest.spyOn(service, "listReferralLinks").mockResolvedValue([]);

      await expect(service.trackReferral("INVALID", "order_1")).rejects.toThrow(
        "Invalid referral code",
      );
    });

    it("tracks conversion and updates link", async () => {
      jest
        .spyOn(service, "listReferralLinks")
        .mockResolvedValue([{ id: "rl_1", conversion_count: 0 }]);
      jest.spyOn(service, "updateReferralLinks").mockResolvedValue({});
      jest
        .spyOn(service, "createClickTrackings")
        .mockResolvedValue({ id: "ct_1" });

      const result = await service.trackReferral("REF-123", "order_1");
      expect(result.id).toBe("ct_1");
    });
  });

  describe("calculateCommission", () => {
    it("calculates total commission for period", async () => {
      jest.spyOn(service, "listAffiliateCommissions").mockResolvedValue([
        { amount: 50, created_at: new Date("2025-06-15") },
        { amount: 30, created_at: new Date("2025-06-20") },
        { amount: 100, created_at: new Date("2025-05-01") },
      ]);

      const result = await service.calculateCommission("aff_1", {
        start: new Date("2025-06-01"),
        end: new Date("2025-06-30"),
      });
      expect(result.totalCommission).toBe(80);
      expect(result.transactionCount).toBe(2);
    });
  });
});

describe("AnalyticsModuleService", () => {
  let service: AnalyticsModuleService;

  beforeEach(() => {
    service = new AnalyticsModuleService();
    jest.clearAllMocks();
  });

  describe("getEventCounts", () => {
    it("counts events within date range", async () => {
      jest
        .spyOn(service, "listAnalyticsEvents")
        .mockResolvedValue([
          { created_at: new Date("2025-06-15") },
          { created_at: new Date("2025-06-20") },
          { created_at: new Date("2025-05-01") },
        ]);

      const result = await service.getEventCounts("t1", "page_view", {
        start: new Date("2025-06-01"),
        end: new Date("2025-06-30"),
      });
      expect(result.count).toBe(2);
    });
  });

  describe("getSalesMetrics", () => {
    it("calculates revenue and average order value", async () => {
      jest.spyOn(service, "listAnalyticsEvents").mockResolvedValue([
        { created_at: new Date("2025-06-15"), revenue: 100 },
        { created_at: new Date("2025-06-20"), revenue: 200 },
      ]);

      const result = await service.getSalesMetrics("t1", {
        start: new Date("2025-06-01"),
        end: new Date("2025-06-30"),
      });
      expect(result.revenue).toBe(300);
      expect(result.avgOrderValue).toBe(150);
    });
  });

  describe("getDashboard", () => {
    it("throws when dashboard not found", async () => {
      jest.spyOn(service, "listDashboards").mockResolvedValue([]);

      await expect(service.getDashboard("t1", "overview")).rejects.toThrow(
        'Dashboard "overview" not found',
      );
    });
  });
});

describe("AuctionModuleService", () => {
  let service: AuctionModuleService;

  beforeEach(() => {
    service = new AuctionModuleService();
    jest.clearAllMocks();
  });

  describe("placeBid", () => {
    it("throws when bid amount is zero", async () => {
      await expect(service.placeBid("a1", "b1", 0)).rejects.toThrow(
        "Bid amount must be greater than zero",
      );
    });

    it("throws when auction not active", async () => {
      jest
        .spyOn(service, "retrieveAuctionListing")
        .mockResolvedValue({ status: "ended" });

      await expect(service.placeBid("a1", "b1", 100)).rejects.toThrow(
        "Auction is not active",
      );
    });

    it("throws when auction has ended", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        status: "active",
        ends_at: new Date(Date.now() - 100000),
      });

      await expect(service.placeBid("a1", "b1", 100)).rejects.toThrow(
        "Auction has ended",
      );
    });

    it("places bid successfully", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        status: "active",
        ends_at: new Date(Date.now() + 100000),
        starting_price: 10,
        bid_increment: 5,
      });
      jest.spyOn(service, "listBids").mockResolvedValue([]);
      jest
        .spyOn(service, "createBids")
        .mockResolvedValue({ id: "bid_1", amount: 15 });
      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.placeBid("a1", "b1", 15);
      expect(result.id).toBe("bid_1");
    });
  });

  describe("closeAuction", () => {
    it("returns sold status when reserve met", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        status: "active",
        reserve_price: 100,
      });
      jest
        .spyOn(service, "listBids")
        .mockResolvedValue([{ id: "bid_1", amount: 150, bidder_id: "b1" }]);
      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});
      jest
        .spyOn(service, "createAuctionResults")
        .mockResolvedValue({ winner_id: "b1" });

      const result = await service.closeAuction("a1");
      expect(result.winner_id).toBe("b1");
    });

    it("returns ended with no winner when reserve not met", async () => {
      jest.spyOn(service, "retrieveAuctionListing").mockResolvedValue({
        status: "active",
        reserve_price: 500,
      });
      jest
        .spyOn(service, "listBids")
        .mockResolvedValue([{ id: "bid_1", amount: 100, bidder_id: "b1" }]);
      jest.spyOn(service, "updateAuctionListings").mockResolvedValue({});

      const result = await service.closeAuction("a1");
      expect(result.winner).toBeNull();
    });
  });
});

describe("AuditModuleService", () => {
  let service: AuditModuleService;

  beforeEach(() => {
    service = new AuditModuleService();
    jest.clearAllMocks();
  });

  describe("getAuditTrail", () => {
    it("filters logs by date range", async () => {
      jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([
          { created_at: new Date("2025-06-15") },
          { created_at: new Date("2025-05-01") },
        ]);

      const result = await service.getAuditTrail("t1", {
        from: new Date("2025-06-01"),
        to: new Date("2025-06-30"),
      });
      expect(result).toHaveLength(1);
    });

    it("returns all logs when no date filter", async () => {
      jest
        .spyOn(service, "listAuditLogs")
        .mockResolvedValue([{ created_at: new Date() }]);

      const result = await service.getAuditTrail("t1");
      expect(result).toHaveLength(1);
    });
  });
});

describe("AutomotiveModuleService", () => {
  let service: AutomotiveModuleService;

  beforeEach(() => {
    service = new AutomotiveModuleService();
    jest.clearAllMocks();
  });

  describe("submitTradeIn", () => {
    it("throws when duplicate trade-in exists", async () => {
      jest.spyOn(service, "listTradeIns").mockResolvedValue([{ id: "ti_1" }]);

      await expect(service.submitTradeIn("v1", "c1")).rejects.toThrow(
        "trade-in request already exists",
      );
    });
  });

  describe("calculateFinancing", () => {
    it("calculates monthly payment", async () => {
      const result = await service.calculateFinancing(30000, 5000, 60, 5.9);
      expect(result.loanAmount).toBe(25000);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it("throws for invalid parameters", async () => {
      await expect(service.calculateFinancing(0, 0, 12)).rejects.toThrow(
        "Invalid financing parameters",
      );
    });

    it("throws when down payment exceeds price", async () => {
      await expect(
        service.calculateFinancing(10000, 10000, 12),
      ).rejects.toThrow("Down payment cannot exceed");
    });

    it("defaults to 5.9% when rate is zero (falsy)", async () => {
      const result = await service.calculateFinancing(12000, 0, 12, 0);
      expect(result.loanAmount).toBe(12000);
      expect(result.monthlyPayment).toBeGreaterThan(1000);
    });
  });

  describe("publishListing", () => {
    it("throws when already published", async () => {
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValue({ status: "published" });

      await expect(service.publishListing("v1")).rejects.toThrow(
        "already published",
      );
    });

    it("throws when no price set", async () => {
      jest
        .spyOn(service, "retrieveVehicleListing")
        .mockResolvedValue({ status: "draft", price: null });

      await expect(service.publishListing("v1")).rejects.toThrow(
        "must have a price",
      );
    });
  });
});

describe("CharityModuleService", () => {
  let service: CharityModuleService;

  beforeEach(() => {
    service = new CharityModuleService();
    jest.clearAllMocks();
  });

  describe("processDonation", () => {
    it("throws when amount is zero", async () => {
      await expect(service.processDonation("c1", "d1", 0)).rejects.toThrow(
        "greater than zero",
      );
    });

    it("throws when campaign not active", async () => {
      jest
        .spyOn(service, "retrieveDonationCampaign")
        .mockResolvedValue({ status: "ended" });

      await expect(service.processDonation("c1", "d1", 100)).rejects.toThrow(
        "not accepting donations",
      );
    });

    it("processes donation and updates campaign", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        status: "active",
        end_date: null,
        raised_amount: 500,
        donor_count: 5,
      });
      jest.spyOn(service, "createDonations").mockResolvedValue({ id: "d1" });
      const updateSpy = jest
        .spyOn(service, "updateDonationCampaigns")
        .mockResolvedValue({});

      await service.processDonation("c1", "d1", 100);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ raised_amount: 600, donor_count: 6 }),
      );
    });
  });

  describe("getCampaignProgress", () => {
    it("calculates progress percentage", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        raised_amount: 500,
        goal_amount: 1000,
        donor_count: 10,
        end_date: null,
      });

      const result = await service.getCampaignProgress("c1");
      expect(result.percentage).toBe(50);
      expect(result.daysRemaining).toBeNull();
    });

    it("caps percentage at 100", async () => {
      jest.spyOn(service, "retrieveDonationCampaign").mockResolvedValue({
        raised_amount: 1500,
        goal_amount: 1000,
        donor_count: 20,
        end_date: null,
      });

      const result = await service.getCampaignProgress("c1");
      expect(result.percentage).toBe(100);
    });
  });
});

describe("ClassifiedModuleService", () => {
  let service: ClassifiedModuleService;

  beforeEach(() => {
    service = new ClassifiedModuleService();
    jest.clearAllMocks();
  });

  describe("publishListing", () => {
    it("throws when already published", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ status: "published" });

      await expect(service.publishListing("l1")).rejects.toThrow(
        "already published",
      );
    });

    it("throws when listing is flagged", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ status: "flagged" });

      await expect(service.publishListing("l1")).rejects.toThrow(
        "Flagged listings cannot be published",
      );
    });
  });

  describe("expireListing", () => {
    it("throws when listing not published", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ status: "draft" });

      await expect(service.expireListing("l1")).rejects.toThrow(
        "Only published listings can be expired",
      );
    });
  });

  describe("flagListing", () => {
    it("throws when reason is empty", async () => {
      await expect(service.flagListing("l1", "")).rejects.toThrow(
        "Flag reason is required",
      );
    });

    it("creates flag and updates listing", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ flag_count: 0 });
      jest.spyOn(service, "createListingFlags").mockResolvedValue({ id: "f1" });
      jest.spyOn(service, "updateClassifiedListings").mockResolvedValue({});

      const result = await service.flagListing("l1", "Inappropriate content");
      expect(result.id).toBe("f1");
    });
  });

  describe("renewListing", () => {
    it("throws for non-renewable status", async () => {
      jest
        .spyOn(service, "retrieveClassifiedListing")
        .mockResolvedValue({ status: "draft" });

      await expect(service.renewListing("l1")).rejects.toThrow(
        "Only expired or published listings can be renewed",
      );
    });
  });
});
