import {
  GET as cartExtensionGET,
  POST as cartExtensionPOST,
} from "../../../src/api/vendor/cart-extension/route";
import {
  GET as bundlesGET,
  POST as bundlesPOST,
} from "../../../src/api/vendor/bundles/route";
import {
  GET as consignmentsGET,
  POST as consignmentsPOST,
} from "../../../src/api/vendor/consignments/route";
import {
  GET as flashSalesGET,
  POST as flashSalesPOST,
} from "../../../src/api/vendor/flash-sales/route";
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

describe("Vendor Routes Batch 6", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Cart Extension /vendor/cart-extension", () => {
    const mockService = {
      listCartMetadatas: jest.fn(),
      createCartMetadatas: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "ce_1", name: "Gift Wrap" }];
      mockService.listCartMetadatas.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await cartExtensionGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST creates cart extension with valid data", async () => {
      const item = { id: "ce_2" };
      mockService.createCartMetadatas.mockResolvedValue(item);
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: { name: "Bulk Discount", rule_type: "bulk_discount" },
      });
      const res = createRes();
      await cartExtensionPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ item });
    });
  });

  describe("Bundles /vendor/bundles", () => {
    const mockService = {
      listProductBundles: jest.fn(),
      createProductBundles: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "bun_1", name: "Starter Pack" }];
      mockService.listProductBundles.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await bundlesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await bundlesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Consignments /vendor/consignments", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "con_1", status: "active" }];
      mockQuery.graph.mockResolvedValue({ data: items });
      const req = createReq({ scope: { resolve: jest.fn(() => mockQuery) } });
      const res = createRes();
      await consignmentsGET(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("GET returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await consignmentsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 401 when vendor_id missing", async () => {
      const req = createReq({
        vendor_id: undefined,
        scope: { resolve: jest.fn(() => mockQuery) },
      });
      const res = createRes();
      await consignmentsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Flash Sales /vendor/flash-sales", () => {
    const mockService = {
      listFlashSales: jest.fn(),
      createFlashSales: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "fs_1", name: "Summer Sale" }];
      mockService.listFlashSales.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await flashSalesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await flashSalesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Gift Cards /vendor/gift-cards", () => {
    const mockService = {
      listGiftCardExts: jest.fn(),
      createGiftCardExts: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "gc_1", code: "GIFT100" }];
      mockService.listGiftCardExts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await giftCardsGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await giftCardsPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Newsletter /vendor/newsletter", () => {
    const mockService = {
      listNotificationPreferences: jest.fn(),
      createNotificationPreferences: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "nl_1", email: "test@example.com" }];
      mockService.listNotificationPreferences.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await newsletterGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await newsletterPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Notification Preferences /vendor/notification-preferences", () => {
    const mockService = {
      listNotificationPreferences: jest.fn(),
      createNotificationPreferences: jest.fn(),
    };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "np_1", channel: "email" }];
      mockService.listNotificationPreferences.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await notificationPreferencesGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await notificationPreferencesPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Tax Config /vendor/tax-config", () => {
    const mockService = { listTaxRules: jest.fn(), createTaxRules: jest.fn() };

    it("GET returns items with pagination when vendor_id present", async () => {
      const items = [{ id: "tax_1", rate: 0.08 }];
      mockService.listTaxRules.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: jest.fn(() => mockService) } });
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
        scope: { resolve: jest.fn(() => mockService) },
      });
      const res = createRes();
      await taxConfigGET(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("POST returns 400 for invalid data", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockService) },
        body: {},
      });
      const res = createRes();
      await taxConfigPOST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
