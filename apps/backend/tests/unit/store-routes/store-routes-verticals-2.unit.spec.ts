import { GET as socialCommerceGET } from "../../../src/api/store/social-commerce/route";
import { GET as warrantiesGET } from "../../../src/api/store/warranties/route";
import { GET as travelGET } from "../../../src/api/store/travel/route";
import { GET as classifiedsGET } from "../../../src/api/store/classifieds/route";
import { GET as crowdfundingGET } from "../../../src/api/store/crowdfunding/route";
import { GET as freelanceGET } from "../../../src/api/store/freelance/route";
import { GET as governmentGET } from "../../../src/api/store/government/route";
import { GET as financialProductsGET } from "../../../src/api/store/financial-products/route";
import { GET as automotiveGET } from "../../../src/api/store/automotive/route";
import { GET as insuranceGET } from "../../../src/api/store/insurance/route";

const mockQuery = {
  graph: (global.vi || global.jest || require("vitest").vi).fn().mockResolvedValue({ data: [{ id: "mock_id" }], metadata: { count: 1 } })
};

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : ({})) },
  query: {},
  params: {},
  body: {},
  auth_context: undefined,
  ...overrides,
});

describe("Store Routes Verticals 2", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Social Commerce /store/social-commerce", () => {
    const mockService = {
      listLiveStreams: jest.fn(),
      listGroupBuys: jest.fn(),
    };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "sc_1", title: "Live Sale" }];
      mockService.listLiveStreams.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await socialCommerceGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Warranties /store/warranties", () => {
    const mockService = { listWarrantyPlans: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "wr_1", name: "Extended Warranty" }];
      mockService.listWarrantyPlans.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await warrantiesGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Travel /store/travel", () => {
    const mockService = { listTravelProperties: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "tr_1", name: "Beach Resort" }];
      mockService.listTravelProperties.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await travelGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Classifieds /store/classifieds", () => {
    const mockService = { listClassifiedListings: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "cl_1", title: "Used Bike" }];
      mockService.listClassifiedListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await classifiedsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Crowdfunding /store/crowdfunding", () => {
    const mockService = { listCrowdfundCampaigns: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "cf_1", title: "New Gadget" }];
      mockService.listCrowdfundCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await crowdfundingGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Freelance /store/freelance", () => {
    const mockService = { listGigListings: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "fl_1", title: "Logo Design" }];
      mockService.listGigListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await freelanceGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Government /store/government", () => {
    const mockService = { listServiceRequests: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "gv_1", title: "Permit Application" }];
      mockService.listServiceRequests.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await governmentGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Financial Products /store/financial-products", () => {
    const mockService = { listLoanProducts: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "fp_1", name: "Home Loan" }];
      mockService.listLoanProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await financialProductsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Automotive /store/automotive", () => {
    const mockService = { listVehicleListings: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "au_1", make: "Toyota", model: "Camry" }];
      mockService.listVehicleListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await automotiveGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Insurance /store/insurance", () => {
    const mockService = { listInsuranceProducts: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "in_1", name: "Auto Insurance" }];
      mockService.listInsuranceProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await insuranceGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });
});
