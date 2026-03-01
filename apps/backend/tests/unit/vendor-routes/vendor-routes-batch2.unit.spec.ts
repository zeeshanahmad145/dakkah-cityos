import {
  GET as classifiedGET,
  POST as classifiedPOST,
} from "../../../src/api/vendor/classified/route";
import {
  GET as crowdfundingGET,
  POST as crowdfundingPOST,
} from "../../../src/api/vendor/crowdfunding/route";
import {
  GET as educationGET,
  POST as educationPOST,
} from "../../../src/api/vendor/education/route";
import {
  GET as healthcareGET,
  POST as healthcarePOST,
} from "../../../src/api/vendor/healthcare/route";
import {
  GET as fitnessGET,
  POST as fitnessPOST,
} from "../../../src/api/vendor/fitness/route";
import {
  GET as groceryGET,
  POST as groceryPOST,
} from "../../../src/api/vendor/grocery/route";
import {
  GET as travelGET,
  POST as travelPOST,
} from "../../../src/api/vendor/travel/route";
import {
  GET as warrantyGET,
  POST as warrantyPOST,
} from "../../../src/api/vendor/warranty/route";
import {
  GET as advertisingGET,
  POST as advertisingPOST,
} from "../../../src/api/vendor/advertising/route";
import {
  GET as charityGET,
  POST as charityPOST,
} from "../../../src/api/vendor/charity/route";

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

describe("Vendor Routes Batch 2", () => {
  beforeEach(() => jest.clearAllMocks());

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

    it("POST creates classified listing", async () => {
      const item = { id: "cls_2" };
      mockService.createClassifiedListings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          title: "Old Phone",
          description: "Good condition",
          listing_type: "sell",
          currency_code: "usd",
        },
      });
      const res = createRes();
      await classifiedPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await classifiedPOST(req, res);
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
      const items = [{ id: "cf_1", title: "Tech Gadget" }];
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

    it("POST creates crowdfunding campaign", async () => {
      const item = { id: "cf_2" };
      mockService.createCrowdfundCampaigns.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          title: "Indie Game",
          description: "A fun game",
          campaign_type: "reward",
          goal_amount: 50000,
          currency_code: "usd",
          ends_at: "2026-06-01",
        },
      });
      const res = createRes();
      await crowdfundingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await crowdfundingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Education /vendor/education", () => {
    const mockService = { listCourses: jest.fn(), createCourses: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "edu_1", title: "Intro to JS" }];
      mockService.listCourses.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await educationGET(req, res);
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
      await educationGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates course", async () => {
      const item = { id: "edu_2" };
      mockService.createCourses.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { title: "React Course", format: "self_paced" },
      });
      const res = createRes();
      await educationPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await educationPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Healthcare /vendor/healthcare", () => {
    const mockService = {
      listHealthcareAppointments: jest.fn(),
      createHealthcareAppointments: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "hc_1", type: "checkup" }];
      mockService.listHealthcareAppointments.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await healthcareGET(req, res);
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
      await healthcareGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates healthcare appointment", async () => {
      const item = { id: "hc_2" };
      mockService.createHealthcareAppointments.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          patient_id: "pat_1",
          appointment_type: "consultation",
          scheduled_at: "2026-03-01T10:00:00Z",
        },
      });
      const res = createRes();
      await healthcarePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await healthcarePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Fitness /vendor/fitness", () => {
    const mockService = {
      listClassSchedules: jest.fn(),
      createClassSchedules: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "fit_1", name: "Yoga Morning" }];
      mockService.listClassSchedules.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await fitnessGET(req, res);
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
      await fitnessGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates class schedule", async () => {
      const item = { id: "fit_2" };
      mockService.createClassSchedules.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          class_name: "HIIT",
          class_type: "hiit",
          day_of_week: "monday",
          start_time: "09:00",
          end_time: "10:00",
          duration_minutes: 60,
          max_capacity: 20,
        },
      });
      const res = createRes();
      await fitnessPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await fitnessPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Grocery /vendor/grocery", () => {
    const mockService = {
      listFreshProducts: jest.fn(),
      createFreshProducts: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "groc_1", name: "Organic Apples" }];
      mockService.listFreshProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await groceryGET(req, res);
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
      await groceryGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates fresh product", async () => {
      const item = { id: "groc_2" };
      mockService.createFreshProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          product_id: "prod_1",
          storage_type: "chilled",
          shelf_life_days: 7,
          unit_type: "kg",
        },
      });
      const res = createRes();
      await groceryPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await groceryPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Travel /vendor/travel", () => {
    const mockService = {
      listTravelProperties: jest.fn(),
      createTravelProperties: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "trv_1", name: "Beach Resort" }];
      mockService.listTravelProperties.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await travelGET(req, res);
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
      await travelGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates travel property", async () => {
      const item = { id: "trv_2" };
      mockService.createTravelProperties.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          name: "Mountain Lodge",
          property_type: "hotel",
          address_line1: "789 Mountain Rd",
          city: "Aspen",
          country_code: "US",
        },
      });
      const res = createRes();
      await travelPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await travelPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Warranty /vendor/warranty", () => {
    const mockService = {
      listWarrantyPlans: jest.fn(),
      createWarrantyPlans: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "war_1", name: "Extended Warranty" }];
      mockService.listWarrantyPlans.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await warrantyGET(req, res);
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
      await warrantyGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates warranty plan", async () => {
      const item = { id: "war_2" };
      mockService.createWarrantyPlans.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          name: "Premium Warranty",
          plan_type: "extended",
          duration_months: 24,
          currency_code: "usd",
          coverage: ["parts", "labor"],
        },
      });
      const res = createRes();
      await warrantyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await warrantyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Advertising /vendor/advertising", () => {
    const mockService = {
      listAdCampaigns: jest.fn(),
      createAdCampaigns: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ad_1", name: "Summer Sale" }];
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

    it("POST creates ad campaign", async () => {
      const item = { id: "ad_2" };
      mockService.createAdCampaigns.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          name: "Black Friday",
          campaign_type: "sponsored_listing",
          budget: 5000,
          currency_code: "usd",
        },
      });
      const res = createRes();
      await advertisingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await advertisingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Charity /vendor/charity", () => {
    const mockService = {
      listDonationCampaigns: jest.fn(),
      createDonationCampaigns: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "chr_1", name: "Food Drive" }];
      mockService.listDonationCampaigns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await charityGET(req, res);
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
      await charityGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates donation campaign", async () => {
      const item = { id: "chr_2" };
      mockService.createDonationCampaigns.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {
          title: "Winter Clothes",
          currency_code: "usd",
          campaign_type: "one_time",
        },
      });
      const res = createRes();
      await charityPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await charityPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
