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

describe("Vendor Routes Batch 7", () => {
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
      const items = [{ id: "ie_1", sku: "SKU-001" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await inventoryExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "vp_1", min_quantity: 10, price: 9.99 }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await volumePricingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "ds_1", product_id: "prod_1" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await dropshippingPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "pod_1", product_id: "prod_1" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await printOnDemandPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "wl_1", product_id: "prod_1" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await whiteLabelPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "tbyb_1", product_id: "prod_1" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await tryBeforeYouBuyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
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
      const items = [{ id: "cr_1", product_name: "BNPL" }];
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
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await creditPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Wallet /vendor/wallet", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listLoyaltyAccounts: vi.fn() };

    it("GET returns wallet data when vendor_id present", async () => {
      const accounts = [
        {
          id: "wal_1",
          balance: 500,
          pending: 50,
          total_earned: 1000,
          currency_code: "usd",
        },
      ];
      mockService.listLoyaltyAccounts.mockResolvedValue(accounts);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await walletGET(req, res);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty("balance");
      expect(response).toHaveProperty("currency_code");
      expect(response).toHaveProperty("transactions");
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await walletGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("GET passes pagination params", async () => {
      mockService.listLoyaltyAccounts.mockResolvedValue([]);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        query: { limit: "5", offset: "10" },
      });
      const res = createRes();
      await walletGET(req, res);
      expect(mockService.listLoyaltyAccounts).toHaveBeenCalledWith(
        { vendor_id: "vendor-123" },
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });
});
