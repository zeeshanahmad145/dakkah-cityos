import { vi } from "vitest";
import {
  GET as disputesGET,
  POST as disputesPOST,
} from "../../../src/api/vendor/disputes/route";
import {
  GET as invoicesGET,
  POST as invoicesPOST,
} from "../../../src/api/vendor/invoices/route";
import {
  GET as quotesGET,
  POST as quotesPOST,
} from "../../../src/api/vendor/quotes/route";
import {
  GET as reviewsGET,
  POST as reviewsPOST,
} from "../../../src/api/vendor/reviews/route";
import {
  GET as eventTicketingGET,
  POST as eventTicketingPOST,
} from "../../../src/api/vendor/event-ticketing/route";
import { GET as analyticsGET } from "../../../src/api/vendor/analytics/route";
import { GET as dashboardGET } from "../../../src/api/vendor/dashboard/route";
import { GET as transactionsGET } from "../../../src/api/vendor/transactions/route";

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

describe("Vendor Routes Batch 5", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Disputes /vendor/disputes", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listDisputes: vi.fn(),
      updateDisputes: vi.fn(),
      retrieveDispute: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "disp_1", reason: "product_damaged" }];
      mockService.listDisputes.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await disputesGET(req, res);
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
      await disputesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await disputesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Invoices /vendor/invoices", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listInvoices: vi.fn(), createInvoices: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "inv_1", invoice_number: "INV-001" }];
      mockService.listInvoices.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await invoicesGET(req, res);
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
      await invoicesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await invoicesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Quotes /vendor/quotes", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listQuotes: vi.fn(), createQuotes: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "quote_1", quote_number: "Q-001" }];
      mockService.listQuotes.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await quotesGET(req, res);
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
      await quotesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates quote with valid data", async () => {
      const item = { id: "quote_2" };
      mockService.createQuotes.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          customer_id: "cust_1",
          title: "Custom Quote",
          items: [{ description: "Widget", quantity: 2, unit_price: 100 }],
          currency_code: "usd",
          valid_until: "2026-12-31",
        },
      });
      const res = createRes();
      await quotesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });
  });

  describe("Reviews /vendor/reviews", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listReviews: vi.fn(), retrieveReview: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "rev_1", rating: 5 }];
      mockService.listReviews.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await reviewsGET(req, res);
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
      await reviewsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await reviewsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Event Ticketing /vendor/event-ticketing", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listEventTickets: vi.fn(),
      createEventTickets: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ticket_1", event_name: "Concert" }];
      mockService.listEventTickets.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await eventTicketingGET(req, res);
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
      await eventTicketingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await eventTicketingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Analytics /vendor/analytics", () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 graph: vi.fn() };

    it("GET returns analytics data when vendor_id present", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        vendor_id: "vendor-123",
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: vi.fn(() => mockQuery) },
      });
      const res = createRes();
      await analyticsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        cityosContext: undefined,
        scope: { resolve: vi.fn(() => mockQuery) },
      });
      const res = createRes();
      await analyticsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET accepts period query param", async () => {
      mockQuery.graph.mockResolvedValue({ data: [] });
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: vi.fn(() => mockQuery) },
        query: { period: "7d" },
      });
      const res = createRes();
      await analyticsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("Dashboard /vendor/dashboard", () => {
    const mockVendorModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 retrieveVendor: vi.fn() };
    const mockCommissionModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listCommissions: vi.fn() };
    const mockPayoutModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listPayouts: vi.fn() };

    it("GET returns dashboard data when cityosContext present", async () => {
      mockVendorModule.retrieveVendor.mockResolvedValue({
        id: "vendor-123",
        total_sales: 1000,
        total_commission_paid: 100,
      });
      mockCommissionModule.listCommissions.mockResolvedValue([]);
      mockPayoutModule.listPayouts.mockResolvedValue([]);
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: {
          resolve: vi.fn((name: string) => {
            if (name === "vendor") return mockVendorModule;
            if (name === "commission") return mockCommissionModule;
            if (name === "payout") return mockPayoutModule;
            return {};
          }),
        },
      });
      const res = createRes();
      await dashboardGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 403 when cityosContext missing", async () => {
      const req = createReq({
        cityosContext: undefined,
        scope: { resolve: vi.fn(() => ({})) },
      });
      const res = createRes();
      await dashboardGET(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("GET returns vendor stats in response", async () => {
      mockVendorModule.retrieveVendor.mockResolvedValue({
        id: "vendor-123",
        total_sales: 5000,
        total_commission_paid: 500,
      });
      mockCommissionModule.listCommissions.mockResolvedValue([
        { net_amount: 100, commission_amount: 10 },
      ]);
      mockPayoutModule.listPayouts.mockResolvedValue([
        { id: "pay_1", amount: 50 },
      ]);
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: {
          resolve: vi.fn((name: string) => {
            if (name === "vendor") return mockVendorModule;
            if (name === "commission") return mockCommissionModule;
            if (name === "payout") return mockPayoutModule;
            return {};
          }),
        },
      });
      const res = createRes();
      await dashboardGET(req, res);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty("vendor");
      expect(response).toHaveProperty("stats");
    });
  });

  describe("Transactions /vendor/transactions", () => {
    const mockCommissionModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listCommissions: vi.fn() };

    it("GET returns transactions when cityosContext present", async () => {
      const transactions = [{ id: "tx_1", amount: 100 }];
      mockCommissionModule.listCommissions.mockResolvedValue(transactions);
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: vi.fn(() => mockCommissionModule) },
      });
      const res = createRes();
      await transactionsGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        transactions,
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("GET returns 403 when cityosContext missing", async () => {
      const req = createReq({
        cityosContext: undefined,
        scope: { resolve: vi.fn(() => mockCommissionModule) },
      });
      const res = createRes();
      await transactionsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("GET passes pagination params", async () => {
      mockCommissionModule.listCommissions.mockResolvedValue([]);
      const req = createReq({
        cityosContext: { vendorId: "vendor-123" },
        scope: { resolve: vi.fn(() => mockCommissionModule) },
        query: { limit: 5, offset: 10 },
      });
      const res = createRes();
      await transactionsGET(req, res);
      expect(mockCommissionModule.listCommissions).toHaveBeenCalledWith(
        { vendor_id: "vendor-123" },
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });
});
