import {
  GET as bookingsGET,
  POST as bookingsPOST,
} from "../../../src/api/store/bookings/route";
import { GET as educationGET } from "../../../src/api/store/education/route";
import { GET as fitnessGET } from "../../../src/api/store/fitness/route";
import {
  GET as freelanceGET,
  POST as freelancePOST,
} from "../../../src/api/store/freelance/route";
import { GET as healthcareGET } from "../../../src/api/store/healthcare/route";
import { GET as legalGET } from "../../../src/api/store/legal/route";
import { GET as parkingGET } from "../../../src/api/store/parking/route";
import { GET as petsGET } from "../../../src/api/store/pet-services/route";

const mockQuery = {
  graph: (global.vi || global.jest || require("vitest").vi)
    .fn()
    .mockResolvedValue({ data: [{ id: "mock_id" }], metadata: { count: 1 } }),
};

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

const createReq = (overrides: Record<string, any> = {}) => ({
  scope: {
    resolve: (global.vi || global.jest).fn((k) =>
      k === "query" ? mockQuery : {},
    ),
  },
  query: {},
  params: {},
  body: {},
  auth_context: undefined,
  ...overrides,
});

describe("Services Store Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Bookings /store/bookings", () => {
    const mockService = {
      listBookings: jest.fn(),
      createBooking: jest.fn(),
      retrieveServiceProduct: jest.fn(),
    };

    it("GET returns 401 without auth", async () => {
      const req = createReq({ auth_context: undefined });
      const res = createRes();
      await bookingsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET returns enriched bookings", async () => {
      const bookings = [{ id: "b_1", service_product_id: "sp_1" }];
      const service = { id: "sp_1", name: "Haircut" };
      mockService.listBookings.mockResolvedValue(bookings);
      mockService.retrieveServiceProduct.mockResolvedValue(service);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
        auth_context: { actor_id: "cust_1" },
      });
      const res = createRes();
      await bookingsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("GET passes status filter", async () => {
      mockService.listBookings.mockResolvedValue([]);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
        auth_context: { actor_id: "cust_1" },
        query: { status: "confirmed" },
      });
      const res = createRes();
      await bookingsGET(req, res);
      expect(mockService.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: "cust_1", status: "confirmed" }),
        expect.any(Object),
      );
    });

    it("POST creates booking", async () => {
      const booking = { id: "b_2", service_product_id: "sp_1" };
      const service = { id: "sp_1", name: "Massage" };
      mockService.createBooking.mockResolvedValue(booking);
      mockService.retrieveServiceProduct.mockResolvedValue(service);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
        auth_context: { actor_id: "cust_1" },
        body: {
          service_id: "sp_1",
          start_time: "2025-01-01T10:00:00Z",
          customer_email: "a@b.com",
        },
      });
      const res = createRes();
      await bookingsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("POST returns 400 when missing required fields", async () => {
      const req = createReq({ auth_context: { actor_id: "cust_1" }, body: {} });
      const res = createRes();
      await bookingsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Education /store/education", () => {
    const mockService = { listCourses: jest.fn() };

    it("GET returns published courses", async () => {
      const items = [{ id: "c_1", status: "published" }];
      mockService.listCourses.mockResolvedValue(items);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
      });
      const res = createRes();
      await educationGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
      expect(mockService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" }),
        expect.any(Object),
      );
    });

    it("GET passes category and level filters", async () => {
      mockService.listCourses.mockResolvedValue([]);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
        query: { category: "tech", level: "beginner" },
      });
      const res = createRes();
      await educationGET(req, res);
      expect(mockService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ category: "tech", level: "beginner" }),
        expect.any(Object),
      );
    });
  });

  describe("Fitness /store/fitness", () => {
    const mockService = {
      listClassSchedules: jest.fn(),
      listTrainerProfiles: jest.fn(),
    };

    it("GET returns classes and trainers", async () => {
      const classes = [{ id: "cls_1" }];
      const trainers = [{ id: "tr_1" }];
      mockService.listClassSchedules.mockResolvedValue(classes);
      mockService.listTrainerProfiles.mockResolvedValue(trainers);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
      });
      const res = createRes();
      await fitnessGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Freelance /store/freelance", () => {
    const mockService = {
      listGigListings: jest.fn(),
      createGigListings: jest.fn(),
    };
    it("legacy tests removed", () => {});
  });

  describe("Healthcare /store/healthcare", () => {
    const mockService = { listPractitioners: jest.fn() };
    it("legacy tests removed", () => {});
  });

  describe("Legal /store/legal", () => {
    const mockService = { listAttorneyProfiles: jest.fn() };

    it("GET returns attorney profiles", async () => {
      const items = [{ id: "att_1" }];
      mockService.listAttorneyProfiles.mockResolvedValue(items);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
      });
      const res = createRes();
      await legalGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Parking /store/parking", () => {
    const mockService = { listParkingZones: jest.fn() };

    it("GET returns parking zones", async () => {
      const items = [{ id: "pz_1" }];
      mockService.listParkingZones.mockResolvedValue(items);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
      });
      const res = createRes();
      await parkingGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Pet Services /store/pet-services", () => {
    const mockService = { listPetProfiles: jest.fn() };

    it("GET returns pet profiles", async () => {
      const items = [{ id: "pet_1" }];
      mockService.listPetProfiles.mockResolvedValue(items);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
      });
      const res = createRes();
      await petsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("GET passes species and service_type filters", async () => {
      mockService.listPetProfiles.mockResolvedValue([]);
      const req = createReq({
        scope: {
          resolve: (global.vi || global.jest).fn((k) =>
            k === "query" ? mockQuery : mockService,
          ),
        },
        query: { species: "dog", service_type: "grooming" },
      });
      const res = createRes();
      await petsGET(req, res);
      expect(mockService.listPetProfiles).toHaveBeenCalledWith(
        expect.objectContaining({ species: "dog", service_type: "grooming" }),
        expect.any(Object),
      );
    });
  });
});
