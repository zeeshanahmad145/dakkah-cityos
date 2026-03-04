import { vi } from "vitest";
import {
  GET as inventoryExtensionGET,
  POST as inventoryExtensionPOST,
} from "../../../src/api/vendor/inventory-extension/route";
import {
  GET as volumePricingGET,
  POST as volumePricingPOST,
} from "../../../src/api/vendor/volume-pricing/route";
import {
  GET as dropshippingGET,
  POST as dropshippingPOST,
} from "../../../src/api/vendor/dropshipping/route";
import {
  GET as printOnDemandGET,
  POST as printOnDemandPOST,
} from "../../../src/api/vendor/print-on-demand/route";
import {
  GET as whiteLabelGET,
  POST as whiteLabelPOST,
} from "../../../src/api/vendor/white-label/route";
import {
  GET as tryBeforeYouBuyGET,
  POST as tryBeforeYouBuyPOST,
} from "../../../src/api/vendor/try-before-you-buy/route";
import {
  GET as creditGET,
  POST as creditPOST,
} from "../../../src/api/vendor/credit/route";
import { GET as walletGET } from "../../../src/api/vendor/wallet/route";
import {
  GET as tradeInGET,
  POST as tradeInPOST,
} from "../../../src/api/vendor/trade-in/route";
import {
  GET as cartExtensionGET,
  POST as cartExtensionPOST,
} from "../../../src/api/vendor/cart-extension/route";

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

describe("Vendor Routes Batch 4", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Inventory Extension /vendor/inventory-extension", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listReservationHolds: vi.fn(),
      createReservationHolds: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "inv_1", variant_id: "var_1" }];
      mockService.listReservationHolds.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await inventoryExtensionGET(req, res);
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
      await inventoryExtensionGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "inv_2", variant_id: "var_2" };
      mockService.createReservationHolds.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { variant_id: "var_2", quantity: 10, reason: "manual" },
      });
      const res = createRes();
      await inventoryExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await inventoryExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Volume Pricing /vendor/volume-pricing", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listVolumePricings: vi.fn(),
      createVolumePricings: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "vp_1", name: "Bulk Tier 1" }];
      mockService.listVolumePricings.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await volumePricingGET(req, res);
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
      await volumePricingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "vp_2", name: "Bulk Tier 2" };
      mockService.createVolumePricings.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          name: "Bulk Tier 2",
          min_quantity: 10,
          discount_type: "percentage",
          discount_value: 10,
        },
      });
      const res = createRes();
      await volumePricingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await volumePricingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Dropshipping /vendor/dropshipping", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listVendorProducts: vi.fn(),
      createVendorProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ds_1", title: "Drop Product" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await dropshippingGET(req, res);
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
      await dropshippingGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "ds_2", title: "Drop Widget" };
      mockService.createVendorProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { product_id: "prod_1", title: "Drop Widget" },
      });
      const res = createRes();
      await dropshippingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await dropshippingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Print on Demand /vendor/print-on-demand", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listVendorProducts: vi.fn(),
      createVendorProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "pod_1", title: "Custom T-Shirt" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await printOnDemandGET(req, res);
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
      await printOnDemandGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "pod_2", title: "Custom Mug" };
      mockService.createVendorProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Custom Mug",
          design_url: "https://example.com/design.png",
          product_type: "mug",
        },
      });
      const res = createRes();
      await printOnDemandPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await printOnDemandPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("White Label /vendor/white-label", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listVendorProducts: vi.fn(),
      createVendorProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "wl_1", title: "Branded Product" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await whiteLabelGET(req, res);
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
      await whiteLabelGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "wl_2", title: "Custom Brand Item" };
      mockService.createVendorProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { title: "Custom Brand Item" },
      });
      const res = createRes();
      await whiteLabelPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await whiteLabelPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Try Before You Buy /vendor/try-before-you-buy", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listVendorProducts: vi.fn(),
      createVendorProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "tbyb_1", title: "Trial Product" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await tryBeforeYouBuyGET(req, res);
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
      await tryBeforeYouBuyGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "tbyb_2", title: "Trial Shoes" };
      mockService.createVendorProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          product_id: "prod_1",
          title: "Trial Shoes",
          retail_price: 99.99,
        },
      });
      const res = createRes();
      await tryBeforeYouBuyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await tryBeforeYouBuyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Credit /vendor/credit", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listLoanProducts: vi.fn(),
      createLoanProducts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "cred_1", name: "Personal Loan" }];
      mockService.listLoanProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await creditGET(req, res);
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
      await creditGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "cred_2", name: "Business Loan" };
      mockService.createLoanProducts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          name: "Business Loan",
          loan_type: "business",
          min_amount: 1000,
          max_amount: 50000,
          currency_code: "usd",
          interest_rate_min: 5,
          interest_rate_max: 15,
          interest_type: "fixed",
          min_term_months: 6,
          max_term_months: 36,
        },
      });
      const res = createRes();
      await creditPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await creditPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Wallet /vendor/wallet", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listLoyaltyAccounts: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [
        {
          id: "wal_1",
          balance: 500,
          pending: 100,
          total_earned: 1000,
          currency_code: "usd",
          activity: [],
        },
      ];
      mockService.listLoyaltyAccounts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await walletGET(req, res);
      expect(res.json).toHaveBeenCalledWith({
        balance: 500,
        pending: 100,
        total_earned: 1000,
        currency_code: "usd",
        transactions: [],
      });
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await walletGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });
  });

  describe("Trade-In /vendor/trade-in", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listTradeIns: vi.fn(), createTradeIns: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ti_1", title: "Phone Trade-In" }];
      mockService.listTradeIns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
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
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await tradeInGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "ti_2", title: "Laptop Trade-In" };
      mockService.createTradeIns.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { title: "Laptop Trade-In" },
      });
      const res = createRes();
      await tradeInPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await tradeInPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Cart Extension /vendor/cart-extension", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listCartMetadatas: vi.fn(),
      createCartMetadatas: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ce_1", name: "Gift Wrap" }];
      mockService.listCartMetadatas.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await cartExtensionGET(req, res);
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
      await cartExtensionGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "ce_2", name: "Free Shipping Rule" };
      mockService.createCartMetadatas.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { name: "Free Shipping Rule", rule_type: "free_shipping" },
      });
      const res = createRes();
      await cartExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await cartExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
