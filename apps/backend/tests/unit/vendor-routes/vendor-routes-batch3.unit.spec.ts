import { vi } from "vitest";
import {
  GET as loyaltyGET,
  POST as loyaltyPOST,
} from "../../../src/api/vendor/loyalty/route";
import { GET as wishlistsGET } from "../../../src/api/vendor/wishlists/route";
import {
  GET as flashSalesGET,
  POST as flashSalesPOST,
} from "../../../src/api/vendor/flash-sales/route";
import {
  GET as bundlesGET,
  POST as bundlesPOST,
} from "../../../src/api/vendor/bundles/route";
import {
  GET as consignmentsGET,
  POST as consignmentsPOST,
} from "../../../src/api/vendor/consignments/route";
import {
  GET as giftCardsGET,
  POST as giftCardsPOST,
} from "../../../src/api/vendor/gift-cards/route";
import {
  GET as newsletterGET,
  POST as newsletterPOST,
} from "../../../src/api/vendor/newsletter/route";
import {
  GET as notificationPreferencesGET,
  POST as notificationPreferencesPOST,
} from "../../../src/api/vendor/notification-preferences/route";
import {
  GET as taxConfigGET,
  POST as taxConfigPOST,
} from "../../../src/api/vendor/tax-config/route";
import {
  GET as shippingExtensionGET,
  POST as shippingExtensionPOST,
} from "../../../src/api/vendor/shipping-extension/route";

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

describe("Vendor Routes Batch 3", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Loyalty /vendor/loyalty", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listLoyaltyPrograms: vi.fn(),
      createLoyaltyPrograms: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "loy_1", name: "Points Program" }];
      mockService.listLoyaltyPrograms.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
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
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await loyaltyGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "loy_2", name: "Rewards" };
      mockService.createLoyaltyPrograms.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { name: "Rewards", points_per_currency: 1, currency_code: "usd" },
      });
      const res = createRes();
      await loyaltyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await loyaltyPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Wishlists /vendor/wishlists", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listWishlists: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "wl_1", name: "My Wishlist" }];
      mockService.listWishlists.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
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
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await wishlistsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });
  });

  describe("Flash Sales /vendor/flash-sales", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listFlashSales: vi.fn(),
      createFlashSales: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "fs_1", title: "Summer Sale" }];
      mockService.listFlashSales.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await flashSalesGET(req, res);
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
      await flashSalesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "fs_2", title: "Flash Deal" };
      mockService.createFlashSales.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Flash Deal",
          discount_type: "percentage",
          discount_value: 20,
          starts_at: "2026-01-01",
          ends_at: "2026-01-02",
        },
      });
      const res = createRes();
      await flashSalesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await flashSalesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Bundles /vendor/bundles", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listProductBundles: vi.fn(),
      createProductBundles: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "bun_1", title: "Starter Pack" }];
      mockService.listProductBundles.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await bundlesGET(req, res);
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
      await bundlesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "bun_2", title: "Value Pack" };
      mockService.createProductBundles.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          title: "Value Pack",
          handle: "value-pack",
          bundle_type: "fixed",
          discount_type: "percentage",
          discount_value: 15,
        },
      });
      const res = createRes();
      await bundlesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await bundlesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Consignments /vendor/consignments", () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 graph: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const orders = [
        {
          id: "ord_1",
          display_id: 1,
          fulfillments: [
            {
              id: "ful_1",
              tracking_links: [],
              shipped_at: null,
              delivered_at: null,
              canceled_at: null,
              created_at: "2026-01-01",
              items: [],
            },
          ],
        },
      ];
      mockQuery.graph.mockResolvedValue({ data: orders });
      const req = createReq({ scope: { resolve: vi.fn(() => mockQuery) } });
      const res = createRes();
      await consignmentsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1, limit: 20, offset: 0 }),
      );
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockQuery) },
      });
      const res = createRes();
      await consignmentsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const req = createReq({
        scope: { resolve: vi.fn(() => mockQuery) },
        body: {
          product_id: "prod_1",
          title: "Consignment Item",
          quantity: 5,
          price: 100,
          currency_code: "usd",
        },
      });
      const res = createRes();
      await consignmentsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({ vendor_id: "vendor-123" }),
        }),
      );
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockQuery) },
      });
      const res = createRes();
      await consignmentsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Gift Cards /vendor/gift-cards", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listGiftCardExts: vi.fn(),
      createGiftCardExts: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "gc_1", code: "GIFT100" }];
      mockService.listGiftCardExts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await giftCardsGET(req, res);
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
      await giftCardsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "gc_2", code: "GIFT200" };
      mockService.createGiftCardExts.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { code: "GIFT200", initial_value: 200, currency_code: "usd" },
      });
      const res = createRes();
      await giftCardsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await giftCardsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Newsletter /vendor/newsletter", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listNotificationPreferences: vi.fn(),
      createNotificationPreferences: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "nl_1", subject: "Weekly Update" }];
      mockService.listNotificationPreferences.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await newsletterGET(req, res);
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
      await newsletterGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "nl_2", subject: "New Products" };
      mockService.createNotificationPreferences.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          subject: "New Products",
          content: "Check out our latest items",
        },
      });
      const res = createRes();
      await newsletterPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await newsletterPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Notification Preferences /vendor/notification-preferences", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listNotificationPreferences: vi.fn(),
      updatePreference: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "np_1", channel: "email" }];
      mockService.listNotificationPreferences.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await notificationPreferencesGET(req, res);
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
      await notificationPreferencesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "np_2", channel: "sms" };
      mockService.updatePreference.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { channel: "sms", event_type: "order_update", enabled: true },
      });
      const res = createRes();
      await notificationPreferencesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await notificationPreferencesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Tax Config /vendor/tax-config", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listTaxRules: vi.fn(), createTaxRules: vi.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "tax_1", name: "VAT" }];
      mockService.listTaxRules.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
      const res = createRes();
      await taxConfigGET(req, res);
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
      await taxConfigGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "tax_2", name: "Sales Tax" };
      mockService.createTaxRules.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: { name: "Sales Tax", country_code: "US", tax_rate: 8.5 },
      });
      const res = createRes();
      await taxConfigPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await taxConfigPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Shipping Extension /vendor/shipping-extension", () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listShippingRates: vi.fn(),
      createShippingRates: vi.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ship_1", carrier_name: "FedEx" }];
      mockService.listShippingRates.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: vi.fn(() => mockService) } });
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
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await shippingExtensionGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Vendor authentication required",
      });
    });

    it("POST creates item with valid data", async () => {
      const item = { id: "ship_2", carrier_name: "UPS" };
      mockService.createShippingRates.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: vi.fn(() => mockService) },
        body: {
          carrier_id: "car_1",
          carrier_name: "UPS",
          service_type: "ground",
          base_rate: 9.99,
          estimated_days_min: 3,
          estimated_days_max: 7,
        },
      });
      const res = createRes();
      await shippingExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: vi.fn(() => mockService) },
      });
      const res = createRes();
      await shippingExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
