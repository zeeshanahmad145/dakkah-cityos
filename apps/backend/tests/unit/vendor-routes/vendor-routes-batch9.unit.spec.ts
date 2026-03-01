import {
  GET as productsGET,
  POST as productsPOST,
} from "../../../src/api/vendor/products/route";
import { GET as payoutsGET } from "../../../src/api/vendor/payouts/route";
import { POST as payoutsRequestPOST } from "../../../src/api/vendor/payouts/request/route";
import { GET as commissionsGET } from "../../../src/api/vendor/commissions/route";
import { GET as bookingsGET } from "../../../src/api/vendor/bookings/route";
import {
  GET as rentalsGET,
  POST as rentalsPOST,
} from "../../../src/api/vendor/rentals/route";
import {
  GET as digitalProductsGET,
  POST as digitalProductsPOST,
} from "../../../src/api/vendor/digital-products/route";

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

describe("Vendor Routes Batch 9", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Products /vendor/products", () => {
    const mockQuery = { graph: jest.fn() };
    const mockVendorModule = { createVendorProducts: jest.fn() };
    const mockProductModule = { createProducts: jest.fn() };
    const mockEventBus = { emit: jest.fn() };

    it("GET returns products when vendor_id present", async () => {
      const products = [
        {
          id: "vp_1",
          vendor_id: "vendor-123",
          product_id: "prod_1",
          product: {
            title: "Test",
            handle: "test",
            thumbnail: null,
            variants: [],
            images: [],
          },
          status: "active",
          vendor_sku: "SKU-1",
          vendor_cost: 10,
          commission_override: null,
          inventory_quantity: 50,
          is_primary_vendor: true,
          created_at: "2026-01-01",
        },
      ];
      mockQuery.graph.mockResolvedValue({ data: products });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
      const res = createRes();
      await productsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await productsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => ({})) },
      });
      const res = createRes();
      await productsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Payouts /vendor/payouts", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns payouts when vendor_id present", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        vendor_id: "vendor-123",
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await payoutsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 403 when vendor context missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        cityosContext: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await payoutsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("GET includes summary with balances", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await payoutsGET(req, res);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty("summary");
      expect(response).toHaveProperty("count");
    });
  });

  describe("Payouts Request /vendor/payouts/request", () => {
    const mockQuery = { graph: jest.fn() };
    const mockPayoutModule = {
      createPayouts: jest.fn(),
      createPayoutTransactionLinks: jest.fn(),
    };
    const mockCommissionModule = { updateCommissionTransactions: jest.fn() };

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await payoutsRequestPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 when no funds available", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "payout") return mockPayoutModule;
            return mockQuery;
          }),
        },
      });
      const res = createRes();
      await payoutsRequestPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No funds available for payout",
      });
    });

    it("POST creates payout when funds available", async () => {
      const payout = { id: "pay_1", amount: 100, status: "pending" };
      mockQuery.graph.mockResolvedValue({
        data: [{ id: "ct_1", net_amount: 100 }],
      });
      mockPayoutModule.createPayouts.mockResolvedValue(payout);
      mockPayoutModule.createPayoutTransactionLinks.mockResolvedValue([]);
      mockCommissionModule.updateCommissionTransactions.mockResolvedValue({});
      const req = createReq({
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "payout") return mockPayoutModule;
            if (name === "commission") return mockCommissionModule;
            return mockQuery;
          }),
        },
      });
      const res = createRes();
      await payoutsRequestPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Commissions /vendor/commissions", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns commissions when vendor_id present", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
      const res = createRes();
      await commissionsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await commissionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET includes summary in response", async () => {
      const transactions = [
        {
          id: "ct_1",
          gross_amount: 100,
          commission_amount: 10,
          net_amount: 90,
          commission_rate: 0.1,
          order: { display_id: 1 },
        },
      ];
      mockQuery.graph.mockResolvedValue({ data: transactions });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
      const res = createRes();
      await commissionsGET(req, res);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty("summary");
      expect(response).toHaveProperty("commissions");
    });
  });

  describe("Bookings /vendor/bookings", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns bookings when vendor_id present", async () => {
      const bookings = [{ id: "book_1", booking_number: "BK-001" }];
      mockQuery.graph.mockResolvedValue({ data: bookings });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
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
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await bookingsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET passes pagination params", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        scope: { resolve: jest.fn(() => mockQuery) },
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

  describe("Rentals /vendor/rentals", () => {
    const mockService = {
      listRentalProducts: jest.fn(),
      createRentalProducts: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "rent_1", name: "Camera Kit" }];
      mockService.listRentalProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await rentalsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates rental with valid data", async () => {
      const item = { id: "rent_2" };
      mockService.createRentalProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
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
  });

  describe("Digital Products /vendor/digital-products", () => {
    const mockService = {
      listDigitalAssets: jest.fn(),
      createDigitalAssets: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "dp_1", name: "eBook" }];
      mockService.listDigitalAssets.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await digitalProductsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates digital product with valid data", async () => {
      const item = { id: "dp_2" };
      mockService.createDigitalAssets.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
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
  });
});
