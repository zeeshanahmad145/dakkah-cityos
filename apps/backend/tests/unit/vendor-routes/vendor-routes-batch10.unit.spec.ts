import { vi } from "vitest";
import {
  GET as advertisingGET,
  POST as advertisingPOST,
} from "../../../src/api/vendor/advertising/route";
import {
  GET as affiliateGET,
  POST as affiliatePOST,
} from "../../../src/api/vendor/affiliate/route";
import {
  GET as auctionsGET,
  POST as auctionsPOST,
} from "../../../src/api/vendor/auctions/route";
import {
  GET as b2bGET,
  POST as b2bPOST,
} from "../../../src/api/vendor/b2b/route";
import {
  GET as classifiedGET,
  POST as classifiedPOST,
} from "../../../src/api/vendor/classified/route";
import {
  GET as crowdfundingGET,
  POST as crowdfundingPOST,
} from "../../../src/api/vendor/crowdfunding/route";
import {
  GET as socialCommerceGET,
  POST as socialCommercePOST,
} from "../../../src/api/vendor/social-commerce/route";

const createRes = () => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  vendor_id: "vendor-123",
  scope: { resolve: vi.fn(() => ({})) },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

describe("Vendor Routes Batch 10", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Advertising /vendor/advertising", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listAdCampaigns: vi.fn(),
      createAdCampaigns: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ad_1", name: "Summer Campaign" }];
      mockService.listAdCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await advertisingGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await advertisingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await advertisingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Affiliate /vendor/affiliate", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listAffiliates: vi.fn(),
      createAffiliates: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "aff_1", name: "Partner Program" }];
      mockService.listAffiliates.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await affiliateGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await affiliateGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await affiliatePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Auctions /vendor/auctions", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listAuctionListings: vi.fn(),
      createAuctionListings: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "auc_1", title: "Vintage Watch" }];
      mockService.listAuctionListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await auctionsGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await auctionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates auction with valid data", async () => {
      const item = { id: "auc_2" };
      mockService.createAuctionListings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          product_id: "prod_1",
          title: "Art Piece",
          auction_type: "english",
          starting_price: 100,
          currency_code: "usd",
          bid_increment: 10,
          starts_at: "2026-01-01",
          ends_at: "2026-02-01",
        },
      });
      const res = createRes();
      await auctionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });
  });

  describe("B2B /vendor/b2b", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listQuotes: vi.fn(), createQuotes: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "b2b_1", company: "Acme Corp" }];
      mockService.listQuotes.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await b2bGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await b2bGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await b2bPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Classified /vendor/classified", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listClassifiedListings: vi.fn(),
      createClassifiedListings: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "cls_1", title: "Used Laptop" }];
      mockService.listClassifiedListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await classifiedGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await classifiedGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await classifiedPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Crowdfunding /vendor/crowdfunding", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listCrowdfundCampaigns: vi.fn(),
      createCrowdfundCampaigns: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "cf_1", title: "Innovative Product" }];
      mockService.listCrowdfundCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await crowdfundingGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await crowdfundingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await crowdfundingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Social Commerce /vendor/social-commerce", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listLiveStreams: vi.fn(),
      createLiveStreams: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "sc_1", title: "Live Shopping Event" }];
      mockService.listLiveStreams.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await socialCommerceGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await socialCommerceGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await socialCommercePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
