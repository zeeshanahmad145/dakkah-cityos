import {
  GET as tradeInGET,
  POST as tradeInPOST,
} from "../../../src/api/vendor/trade-in/route";
import {
  GET as shippingExtensionGET,
  POST as shippingExtensionPOST,
} from "../../../src/api/vendor/shipping-extension/route";
import {
  GET as subscriptionsGET,
  POST as subscriptionsPOST,
} from "../../../src/api/vendor/subscriptions/route";
import {
  GET as membershipsGET,
  POST as membershipsPOST,
} from "../../../src/api/vendor/memberships/route";
import {
  GET as loyaltyGET,
  POST as loyaltyPOST,
} from "../../../src/api/vendor/loyalty/route";
import { GET as wishlistsGET } from "../../../src/api/vendor/wishlists/route";
import {
  GET as warrantyGET,
  POST as warrantyPOST,
} from "../../../src/api/vendor/warranty/route";
import { GET as ordersGET } from "../../../src/api/vendor/orders/route";

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

describe("Vendor Routes Batch 8", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Trade-In /vendor/trade-in", () => {
    const mockService = { listTradeIns: jest.fn(), createTradeIns: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ti_1", product_name: "Old Phone" }];
      mockService.listTradeIns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await tradeInGET(req, res);
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
      await tradeInGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await tradeInPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Shipping Extension /vendor/shipping-extension", () => {
    const mockService = {
      listShippingRates: jest.fn(),
      createShippingRates: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "sr_1", rate_name: "Standard" }];
      mockService.listShippingRates.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await shippingExtensionGET(req, res);
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
      await shippingExtensionGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await shippingExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Subscriptions /vendor/subscriptions", () => {
    const mockService = {
      listSubscriptionPlans: jest.fn(),
      createSubscriptionPlans: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "sub_1", name: "Basic Plan" }];
      mockService.listSubscriptionPlans.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await subscriptionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await subscriptionsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Memberships /vendor/memberships", () => {
    const mockService = {
      listMembershipTiers: jest.fn(),
      createMembershipTiers: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "mem_1", name: "Gold Tier" }];
      mockService.listMembershipTiers.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await membershipsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates membership with valid data", async () => {
      const item = { id: "mem_2" };
      mockService.createMembershipTiers.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
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
  });

  describe("Loyalty /vendor/loyalty", () => {
    const mockService = {
      listLoyaltyPrograms: jest.fn(),
      createLoyaltyPrograms: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "loy_1", name: "Points Program" }];
      mockService.listLoyaltyPrograms.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await loyaltyGET(req, res);
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
      await loyaltyGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await loyaltyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Wishlists /vendor/wishlists", () => {
    const mockService = { listWishlists: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "wl_1", customer_id: "cust_1" }];
      mockService.listWishlists.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
      const res = createRes();
      await wishlistsGET(req, res);
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
      await wishlistsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET passes pagination params", async () => {
      mockService.listWishlists.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        query: { limit: "5", offset: "10" },
      });
      const res = createRes();
      await wishlistsGET(req, res);
      expect(mockService.listWishlists).toHaveBeenCalledWith(
        { vendor_id: "vendor-123" },
        expect.objectContaining({ skip: 10, take: 5 }),
      );
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

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await warrantyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Orders /vendor/orders", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns orders when vendor_id present", async () => {
      const orders = [
        {
          id: "ord_1",
          status: "pending",
          total: 100,
          order: {
            display_id: 1,
            email: "test@test.com",
            shipping_address: {},
          },
          items: [],
        },
      ];
      mockQuery.graph.mockResolvedValue({ data: orders });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
      const res = createRes();
      await ordersGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await ordersGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET passes pagination and status filters", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { limit: 10, offset: 5, status: "shipped" },
      });
      const res = createRes();
      await ordersGET(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "vendor_order",
          filters: { vendor_id: "vendor-123", status: "shipped" },
          pagination: { skip: 5, take: 10 },
        }),
      );
    });
  });
});
