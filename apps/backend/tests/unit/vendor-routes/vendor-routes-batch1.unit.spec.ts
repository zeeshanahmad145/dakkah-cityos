import { vi } from "vitest";
import {
  GET as subscriptionsGET,
  POST as subscriptionsPOST,
} from "../../../src/api/vendor/subscriptions/route";
import { GET as bookingsGET } from "../../../src/api/vendor/bookings/route";
import {
  GET as auctionsGET,
  POST as auctionsPOST,
} from "../../../src/api/vendor/auctions/route";
import {
  GET as rentalsGET,
  POST as rentalsPOST,
} from "../../../src/api/vendor/rentals/route";
import {
  GET as digitalProductsGET,
  POST as digitalProductsPOST,
} from "../../../src/api/vendor/digital-products/route";
import {
  GET as eventsGET,
  POST as eventsPOST,
} from "../../../src/api/vendor/events/route";
import {
  GET as membershipsGET,
  POST as membershipsPOST,
} from "../../../src/api/vendor/memberships/route";
import {
  GET as freelanceGET,
  POST as freelancePOST,
} from "../../../src/api/vendor/freelance/route";
import {
  GET as realEstateGET,
  POST as realEstatePOST,
} from "../../../src/api/vendor/real-estate/route";
import {
  GET as restaurantsGET,
  POST as restaurantsPOST,
} from "../../../src/api/vendor/restaurants/route";

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

describe("Vendor Routes Batch 1", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Subscriptions /vendor/subscriptions", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listSubscriptionPlans: vi.fn(),
      createSubscriptionPlans: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "sub_1", name: "Basic Plan" }];
      mockService.listSubscriptionPlans.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await subscriptionsGET(req, res);
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
      await subscriptionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("GET passes pagination params", async () => {
      mockService.listSubscriptionPlans.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        query: { limit: "5", offset: "10" },
      });
      const res = createRes();
      await subscriptionsGET(req, res);
      expect(mockService.listSubscriptionPlans).toHaveBeenCalledWith(
        { vendor_id: "vendor-123" },
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "sub_2", name: "Pro Plan" };
      mockService.createSubscriptionPlans.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          name: "Pro Plan",
          handle: "pro",
          price: 29.99,
          billing_interval: "monthly",
          currency_code: "usd",
        },
      });
      const res = createRes();
      await subscriptionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await subscriptionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await subscriptionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Bookings /vendor/bookings", () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 graph: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const bookings = [{ id: "book_1", booking_number: "BK-001" }];
      mockQuery.graph.mockResolvedValue({ data: bookings });
      const req = createReq({ scope: { resolve: vi.fn(() => mockQuery) } });
      const res = createRes();
      await bookingsGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        items: bookings,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockQuery) },
      });
      const res = createRes();
      await bookingsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("GET passes pagination params to query.graph", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        scope: { resolve: vi.fn(() => mockQuery) },
        query: { limit: "5", offset: "10" },
      });
      const res = createRes();
      await bookingsGET(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "booking",
          filters: expect.objectContaining({ provider_id: "vendor-123" }),
          pagination: { skip: 10, take: 5 },
        }),
      );
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

    it("POST creates auction item", async () => {
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

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await auctionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Rentals /vendor/rentals", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listRentalProducts: vi.fn(),
      createRentalProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "rent_1", name: "Camera Kit" }];
      mockService.listRentalProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await rentalsGET(req, res);
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
      await rentalsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates rental item", async () => {
      const item = { id: "rent_2" };
      mockService.createRentalProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          product_id: "prod_1",
          rental_type: "daily",
          base_price: 50,
          currency_code: "usd",
        },
      });
      const res = createRes();
      await rentalsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await rentalsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Digital Products /vendor/digital-products", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listDigitalAssets: vi.fn(),
      createDigitalAssets: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "dp_1", name: "eBook" }];
      mockService.listDigitalAssets.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await digitalProductsGET(req, res);
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
      await digitalProductsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates digital product", async () => {
      const item = { id: "dp_2" };
      mockService.createDigitalAssets.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          product_id: "prod_1",
          title: "Course Video",
          file_url: "https://example.com/file.pdf",
          file_type: "pdf",
        },
      });
      const res = createRes();
      await digitalProductsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await digitalProductsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Events /vendor/events", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listEvents: vi.fn(), createEvents: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "evt_1", name: "Tech Conference" }];
      mockService.listEvents.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await eventsGET(req, res);
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
      await eventsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates event", async () => {
      const item = { id: "evt_2" };
      mockService.createEvents.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Workshop",
          event_type: "workshop",
          starts_at: "2026-03-01",
          ends_at: "2026-03-02",
        },
      });
      const res = createRes();
      await eventsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await eventsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Memberships /vendor/memberships", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listMembershipTiers: vi.fn(),
      createMembershipTiers: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "mem_1", name: "Gold Tier" }];
      mockService.listMembershipTiers.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await membershipsGET(req, res);
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
      await membershipsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates membership tier", async () => {
      const item = { id: "mem_2" };
      mockService.createMembershipTiers.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          name: "Platinum",
          tier_level: 1,
          price: 99,
          currency_code: "usd",
          billing_period: "monthly",
        },
      });
      const res = createRes();
      await membershipsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await membershipsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Freelance /vendor/freelance", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listGigListings: vi.fn(),
      createGigListings: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "gig_1", title: "Web Design" }];
      mockService.listGigListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await freelanceGET(req, res);
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
      await freelanceGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates gig listing", async () => {
      const item = { id: "gig_2" };
      mockService.createGigListings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Logo Design",
          description: "Professional logo",
          listing_type: "fixed_price",
          currency_code: "usd",
        },
      });
      const res = createRes();
      await freelancePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await freelancePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Real Estate /vendor/real-estate", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listPropertyListings: vi.fn(),
      createPropertyListings: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "re_1", title: "Downtown Loft" }];
      mockService.listPropertyListings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await realEstateGET(req, res);
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
      await realEstateGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates property listing", async () => {
      const item = { id: "re_2" };
      mockService.createPropertyListings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Beach House",
          property_type: "house",
          listing_type: "sale",
          price: 500000,
          currency_code: "usd",
          address_line1: "123 Beach Rd",
          city: "Miami",
          postal_code: "33101",
          country_code: "US",
        },
      });
      const res = createRes();
      await realEstatePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await realEstatePOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Restaurants /vendor/restaurants", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listRestaurants: vi.fn(),
      createRestaurants: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "rest_1", name: "Pizza Palace" }];
      mockService.listRestaurants.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await restaurantsGET(req, res);
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
      await restaurantsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates restaurant", async () => {
      const item = { id: "rest_2" };
      mockService.createRestaurants.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          name: "Sushi Bar",
          handle: "sushi-bar",
          address_line1: "456 Main St",
          city: "NYC",
          postal_code: "10001",
          country_code: "US",
        },
      });
      const res = createRes();
      await restaurantsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await restaurantsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
