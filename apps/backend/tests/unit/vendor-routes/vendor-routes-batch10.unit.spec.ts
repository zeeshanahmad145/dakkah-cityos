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
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  vendor_id: "vendor-123",
  scope: { resolve: jest.fn(() => ({})) },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

describe("Vendor Routes Batch 10", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Advertising /vendor/advertising", () => {
    const mockService = {
      listAdCampaigns: jest.fn(),
      createAdCampaigns: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ad_1", name: "Summer Campaign" }];
      mockService.listAdCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await advertisingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await advertisingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Affiliate /vendor/affiliate", () => {
    const mockService = {
      listAffiliates: jest.fn(),
      createAffiliates: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "aff_1", name: "Partner Program" }];
      mockService.listAffiliates.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await affiliateGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await affiliatePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Auctions /vendor/auctions", () => {
    const mockService = {
      listAuctionListings: jest.fn(),
      createAuctionListings: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "auc_1", title: "Vintage Watch" }];
      mockService.listAuctionListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await auctionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates auction with valid data", async () => {
      const item = { id: "auc_2" };
      mockService.createAuctionListings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
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
    const mockService = { listQuotes: jest.fn(), createQuotes: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "b2b_1", company: "Acme Corp" }];
      mockService.listQuotes.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await b2bGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await b2bPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Classified /vendor/classified", () => {
    const mockService = {
      listClassifiedListings: jest.fn(),
      createClassifiedListings: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "cls_1", title: "Used Laptop" }];
      mockService.listClassifiedListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await classifiedGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await classifiedPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Crowdfunding /vendor/crowdfunding", () => {
    const mockService = {
      listCrowdfundCampaigns: jest.fn(),
      createCrowdfundCampaigns: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "cf_1", title: "Innovative Product" }];
      mockService.listCrowdfundCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await crowdfundingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await crowdfundingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Social Commerce /vendor/social-commerce", () => {
    const mockService = {
      listLiveStreams: jest.fn(),
      createLiveStreams: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "sc_1", title: "Live Shopping Event" }];
      mockService.listLiveStreams.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await socialCommerceGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await socialCommercePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
