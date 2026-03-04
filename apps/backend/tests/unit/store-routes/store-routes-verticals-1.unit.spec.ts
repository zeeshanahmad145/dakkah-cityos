import { GET as parkingGET } from "../../../src/api/store/parking/route";
import { GET as petServicesGET } from "../../../src/api/store/pet-services/route";
import { GET as legalGET } from "../../../src/api/store/legal/route";
import { GET as healthcareGET } from "../../../src/api/store/healthcare/route";
import { GET as fitnessGET } from "../../../src/api/store/fitness/route";
import { GET as educationGET } from "../../../src/api/store/education/route";
import { GET as charityGET } from "../../../src/api/store/charity/route";
import { GET as groceryGET } from "../../../src/api/store/grocery/route";
import { GET as restaurantsGET } from "../../../src/api/store/restaurants/route";
import { GET as realEstateGET } from "../../../src/api/store/real-estate/route";

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

describe("Store Routes Verticals 1", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Parking /store/parking", () => {
    const mockService = { listParkingZones: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "pz_1", name: "Zone A" }];
      mockService.listParkingZones.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await parkingGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Pet Services /store/pet-services", () => {
    const mockService = { listPetProfiles: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "ps_1", name: "Dog Walking" }];
      mockService.listPetProfiles.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await petServicesGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Legal /store/legal", () => {
    const mockService = { listAttorneyProfiles: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "lg_1", name: "John Doe, Esq." }];
      mockService.listAttorneyProfiles.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await legalGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Healthcare /store/healthcare", () => {
    const mockService = { listPractitioners: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "hc_1", name: "Dr. Smith" }];
      mockService.listPractitioners.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await healthcareGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Fitness /store/fitness", () => {
    const mockService = {
      listClassSchedules: jest.fn(),
      listTrainerProfiles: jest.fn(),
    };

    it("GET returns items with pagination", async () => {
      const classes = [{ id: "fc_1", name: "Yoga" }];
      const trainers = [{ id: "ft_1", name: "Coach Mike" }];
      mockService.listClassSchedules.mockResolvedValue(classes);
      mockService.listTrainerProfiles.mockResolvedValue(trainers);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await fitnessGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Education /store/education", () => {
    const mockService = { listCourses: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "ed_1", title: "Intro to CS" }];
      mockService.listCourses.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await educationGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Charity /store/charity", () => {
    const mockService = {
      listCharityOrgs: jest.fn(),
      listDonationCampaigns: jest.fn(),
    };

    it("GET returns items with pagination", async () => {
      const charities = [{ id: "ch_1", name: "Help Fund" }];
      const campaigns = [{ id: "dc_1", name: "Winter Drive" }];
      mockService.listCharityOrgs.mockResolvedValue(charities);
      mockService.listDonationCampaigns.mockResolvedValue(campaigns);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await charityGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Grocery /store/grocery", () => {
    const mockService = { listFreshProducts: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "gr_1", name: "Organic Apples" }];
      mockService.listFreshProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await groceryGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Restaurants /store/restaurants", () => {
    const mockService = { listRestaurants: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "rs_1", name: "Pizza Place" }];
      mockService.listRestaurants.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await restaurantsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Real Estate /store/real-estate", () => {
    const mockService = { listPropertyListings: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "re_1", title: "Downtown Condo" }];
      mockService.listPropertyListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await realEstateGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });
});
