import { GET as charitiesGET } from "../../../src/api/store/charity/route";
import {
  GET as crowdfundingGET,
  POST as crowdfundingPOST,
} from "../../../src/api/store/crowdfunding/route";
import {
  GET as digitalProductsGET,
  POST as digitalProductsPOST,
} from "../../../src/api/store/digital-products/route";
import { GET as eventsGET } from "../../../src/api/store/event-ticketing/route";
import {
  GET as financialProductsGET,
  POST as financialProductsPOST,
} from "../../../src/api/store/financial-products/route";
import {
  GET as governmentGET,
  POST as governmentPOST,
} from "../../../src/api/store/government/route";
import { GET as groceryGET } from "../../../src/api/store/grocery/route";
import {
  GET as membershipsGET,
  POST as membershipsPOST,
} from "../../../src/api/store/memberships/route";
import { POST as newsletterPOST } from "../../../src/api/store/newsletters/route";
import { GET as restaurantsGET } from "../../../src/api/store/restaurants/route";
import { GET as travelGET } from "../../../src/api/store/travel/route";
import { GET as utilitiesGET } from "../../../src/api/store/utilities/route";
import { GET as warrantiesGET } from "../../../src/api/store/warranties/route";
import { POST as reviewsPOST } from "../../../src/api/store/reviews/route";

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  scope: { resolve: jest.fn(() => ({})) },
  query: {},
  params: {},
  body: {},
  auth_context: undefined as any,
  ...overrides,
});

describe("Specialized Store Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Charities /store/charity", () => {
    const mockService = {
      listCharityOrgs: jest.fn(),
      listDonationCampaigns: jest.fn(),
    };

    it("GET returns charities and campaigns", async () => {
      const charities = [{ id: "ch_1" }];
      const campaigns = [{ id: "dc_1" }];
      mockService.listCharityOrgs.mockResolvedValue(charities);
      mockService.listDonationCampaigns.mockResolvedValue(campaigns);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await charitiesGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ charities, campaigns }),
      );
    });

    it("GET handles error", async () => {
      mockService.listCharityOrgs.mockRejectedValue(new Error("fail"));
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await charitiesGET(req as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Crowdfunding /store/crowdfunding", () => {
    const mockService = {
      listCrowdfundCampaigns: jest.fn(),
      createCrowdfundCampaigns: jest.fn(),
    };

    it("GET returns campaigns", async () => {
      const items = [{ id: "cf_1" }];
      mockService.listCrowdfundCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await crowdfundingGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("POST creates campaign", async () => {
      const item = { id: "cf_2" };
      mockService.createCrowdfundCampaigns.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { title: "Project" },
      });
      const res = createRes();
      await crowdfundingPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });
  });

  describe("Digital Products /store/digital-products", () => {
    const mockService = {
      listDigitalAssets: jest.fn(),
      createDigitalAssets: jest.fn(),
    };

    it("GET returns active digital assets", async () => {
      const items = [{ id: "dp_1" }];
      mockService.listDigitalAssets.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await digitalProductsGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
      expect(mockService.listDigitalAssets).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        expect.any(Object),
      );
    });

    it("POST creates digital asset", async () => {
      const item = { id: "dp_2" };
      mockService.createDigitalAssets.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { name: "eBook" },
      });
      const res = createRes();
      await digitalProductsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Events /store/event-ticketing", () => {
    const mockService = { listEvents: jest.fn() };

    it("GET returns published events", async () => {
      const items = [{ id: "ev_1" }];
      mockService.listEvents.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await eventsGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
      expect(mockService.listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
        expect.any(Object),
      );
    });

    it("GET passes event_type filter", async () => {
      mockService.listEvents.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { event_type: "concert" },
      });
      const res = createRes();
      await eventsGET(req as any, res);
      expect(mockService.listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: "concert" }),
        expect.any(Object),
      );
    });
  });

  describe("Financial Products /store/financial-products", () => {
    const mockService = {
      listLoanProducts: jest.fn(),
      createLoanProducts: jest.fn(),
    };

    it("GET returns loan products", async () => {
      const items = [{ id: "fp_1" }];
      mockService.listLoanProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await financialProductsGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("POST creates loan product", async () => {
      const item = { id: "fp_2" };
      mockService.createLoanProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { type: "personal" },
      });
      const res = createRes();
      await financialProductsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("POST handles error", async () => {
      mockService.createLoanProducts.mockRejectedValue(new Error("Invalid"));
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await financialProductsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(500)
    });
  });

  describe("Government /store/government", () => {
    const mockService = {
      listServiceRequests: jest.fn(),
      createServiceRequests: jest.fn(),
    };

    it("GET returns service requests", async () => {
      const items = [{ id: "sr_1" }];
      mockService.listServiceRequests.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await governmentGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("POST creates service request", async () => {
      const item = { id: "sr_2" };
      mockService.createServiceRequests.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { type: "permit" },
      });
      const res = createRes();
      await governmentPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Grocery /store/grocery", () => {
    const mockService = { listFreshProducts: jest.fn() };

    it("GET returns fresh products", async () => {
      const items = [{ id: "gp_1" }];
      mockService.listFreshProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await groceryGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET passes is_organic filter as boolean", async () => {
      mockService.listFreshProducts.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { is_organic: "true" },
      });
      const res = createRes();
      await groceryGET(req as any, res);
      expect(mockService.listFreshProducts).toHaveBeenCalledWith(
        expect.objectContaining({ is_organic: true }),
        expect.any(Object),
      );
    });
  });

  describe("Memberships /store/memberships", () => {
    const mockService = {
      listMemberships: jest.fn(),
      createMemberships: jest.fn(),
    };

    it("GET returns memberships", async () => {
      const items = [{ id: "m_1" }];
      mockService.listMemberships.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await membershipsGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("POST creates membership", async () => {
      const item = { id: "m_2" };
      mockService.createMemberships.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { plan: "gold" },
      });
      const res = createRes();
      await membershipsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Newsletter /store/newsletter", () => {
    const mockService = { updatePreference: jest.fn() };

    it("POST subscribes to newsletter", async () => {
      mockService.updatePreference.mockResolvedValue({ id: "pref_1" });
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { email: "user@test.com", tenant_id: "t1" },
      });
      const res = createRes();
      await newsletterPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("POST returns 400 when missing email or tenant_id", async () => {
      const req = createReq({ body: { email: "user@test.com" } });
      const res = createRes();
      await newsletterPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(400)
    });

    it("POST handles service error", async () => {
      mockService.updatePreference.mockRejectedValue(new Error("fail"));
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { email: "user@test.com", tenant_id: "t1" },
      });
      const res = createRes();
      await newsletterPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Restaurants /store/restaurants (dining)", () => {
    const mockService = { listRestaurants: jest.fn() };

    it("GET returns active restaurants", async () => {
      const items = [{ id: "rest_1" }];
      mockService.listRestaurants.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await restaurantsGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
      expect(mockService.listRestaurants).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        expect.any(Object),
      );
    });

    it("GET passes cuisine_type filter", async () => {
      mockService.listRestaurants.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { cuisine_type: "italian" },
      });
      const res = createRes();
      await restaurantsGET(req as any, res);
      expect(mockService.listRestaurants).toHaveBeenCalledWith(
        expect.objectContaining({ cuisine_types: "italian" }),
        expect.any(Object),
      );
    });
  });

  describe("Travel /store/travel", () => {
    const mockService = { listTravelProperties: jest.fn() };

    it("GET returns active travel properties", async () => {
      const items = [{ id: "tp_1" }];
      mockService.listTravelProperties.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await travelGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
      expect(mockService.listTravelProperties).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        expect.any(Object),
      );
    });

    it("GET handles error", async () => {
      mockService.listTravelProperties.mockRejectedValue(new Error("fail"));
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await travelGET(req as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Utilities /store/utilities", () => {
    const mockService = { listUtilityAccounts: jest.fn() };

    it("GET returns utility accounts", async () => {
      const items = [{ id: "ua_1" }];
      mockService.listUtilityAccounts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await utilitiesGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET passes utility_type filter", async () => {
      mockService.listUtilityAccounts.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { utility_type: "electricity" },
      });
      const res = createRes();
      await utilitiesGET(req as any, res);
      expect(mockService.listUtilityAccounts).toHaveBeenCalledWith(
        expect.objectContaining({ utility_type: "electricity" }),
        expect.any(Object),
      );
    });
  });

  describe("Warranties /store/warranties", () => {
    const mockService = { listWarrantyPlans: jest.fn() };

    it("GET returns warranty plans", async () => {
      const items = [{ id: "wp_1" }];
      mockService.listWarrantyPlans.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await warrantiesGET(req as any, res);
      expect(res.json).toHaveBeenCalledWith({
        items,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET passes is_active filter as boolean", async () => {
      mockService.listWarrantyPlans.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { is_active: "true" },
      });
      const res = createRes();
      await warrantiesGET(req as any, res);
      expect(mockService.listWarrantyPlans).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
        expect.any(Object),
      );
    });
  });

  describe("Reviews /store/reviews", () => {
    const mockReviewService = { createReview: jest.fn() };
    const mockQuery = { graph: jest.fn() };

    it("POST returns 401 without auth", async () => {
      const req = createReq({ auth_context: undefined });
      const res = createRes();
      await reviewsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 when missing rating or content", async () => {
      const req = createReq({ auth_context: { actor_id: "cust_1" }, body: {} });
      const res = createRes();
      await reviewsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(400)
    });

    it("POST returns 400 when missing product_id and vendor_id", async () => {
      const req = createReq({
        auth_context: { actor_id: "cust_1" },
        body: { rating: 5, content: "Great" },
      });
      const res = createRes();
      await reviewsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(400)
    });

    it("POST creates review successfully", async () => {
      const review = { id: "rev_1" };
      mockReviewService.createReview.mockResolvedValue(review);
      mockQuery.graph.mockResolvedValue({
        data: [
          { first_name: "John", last_name: "Doe", email: "john@test.com" },
        ],
      });
      const req = createReq({
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "review") return mockReviewService;
            return mockQuery;
          }),
        },
        auth_context: { actor_id: "cust_1" },
        body: { rating: 5, content: "Amazing product", product_id: "prod_1" },
      });
      const res = createRes();
      await reviewsPOST(req as any, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ review });
    });
  });
});
