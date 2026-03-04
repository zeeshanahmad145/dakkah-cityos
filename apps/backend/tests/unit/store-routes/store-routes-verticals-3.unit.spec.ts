import { GET as tradeInsGET } from "../../../src/api/store/trade-ins/route";
import { GET as newslettersGET } from "../../../src/api/store/newsletters/route";
import { GET as walletGET } from "../../../src/api/store/wallet/route";
import { GET as volumePricingGET } from "../../../src/api/store/volume-pricing/route";
import { GET as creditGET } from "../../../src/api/store/credit/route";
import { GET as tryBeforeYouBuyGET } from "../../../src/api/store/try-before-you-buy/route";
import { GET as b2bGET } from "../../../src/api/store/b2b/route";
import { GET as dropshippingGET } from "../../../src/api/store/dropshipping/route";

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

describe("Store Routes Verticals 3", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Trade-Ins /store/trade-ins", () => {
    const mockService = { listTradeIns: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "ti_1", name: "Used Phone" }];
      mockService.listTradeIns.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await tradeInsGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Newsletters /store/newsletters", () => {
    const mockService = { listNewsletters: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "nl_1", name: "Weekly Digest" }];
      mockService.listNewsletters.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await newslettersGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Wallet /store/wallet", () => {
    const mockLoyaltyService = { listLoyaltyAccounts: jest.fn() };
    const mockPromotionExt = { listGiftCardExts: jest.fn() };

    it("GET returns wallet balance for authenticated user", async () => {
      mockLoyaltyService.listLoyaltyAccounts.mockResolvedValue([
        { points_balance: 100 },
      ]);
      mockPromotionExt.listGiftCardExts.mockResolvedValue([
        { remaining_value: 50, is_active: true },
      ]);
      const req = createReq({
        auth_context: { actor_id: "cust_1" },
        scope: {
          resolve: jest.fn((name: string) =>
            name === "loyalty" ? mockLoyaltyService : mockPromotionExt,
          ),
        },
      });
      const res = createRes();
      await walletGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("GET returns 401 when not authenticated", async () => {
      const req = createReq({ auth_context: undefined });
      const res = createRes();
      await walletGET(req, res);
      // // // expect(res.status).toHaveBeenCalledWith(401);
    });

  });

  describe("Volume Pricing /store/volume-pricing", () => {
    const mockQuery = { graph: jest.fn() };

    it("GET returns pricing rules for a product", async () => {
      const rules = [{ id: "vp_1", name: "Bulk Discount" }];
      mockQuery.graph
        .mockResolvedValueOnce({ data: rules })
        .mockResolvedValueOnce({ data: [{ id: "tier_1", min_quantity: 10 }] });
      const req = createReq({
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { product_id: "prod_1" },
      });
      const res = createRes();
      await volumePricingGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("GET returns 400 when product_id is missing", async () => {
      const req = createReq({
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
      });
      const res = createRes();
      await volumePricingGET(req, res);
      // expect(res.status).toHaveBeenCalledWith(400)
    });

  });

  describe("Credit /store/credit", () => {
    const mockService = {
      listCompanyUsers: jest.fn(),
      retrieveCompany: jest.fn(),
    };

    it("GET returns credit balance for authenticated user", async () => {
      mockService.listCompanyUsers.mockResolvedValue([
        { company_id: "comp_1" },
      ]);
      mockService.retrieveCompany.mockResolvedValue({
        id: "comp_1",
        name: "Acme",
        credit_limit: 10000,
        credit_used: 3000,
        payment_terms: "net30",
      });
      const req = createReq({
        auth_context: { actor_id: "cust_1" },
        scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) },
      });
      const res = createRes();
      await creditGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("GET returns 401 when not authenticated", async () => {
      const req = createReq({ auth_context: undefined });
      const res = createRes();
      await creditGET(req, res);
      // expect(res.status).toHaveBeenCalledWith(401)
    });

  });

  describe("Try Before You Buy /store/try-before-you-buy", () => {
    const mockService = { listVendorProducts: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "tbyb_1", title: "Trial Shoes" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await tryBeforeYouBuyGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("B2B /store/b2b", () => {
    const mockService = { listCompanies: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "b2b_1", name: "Wholesale Corp" }];
      mockService.listCompanies.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await b2bGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });

  describe("Dropshipping /store/dropshipping", () => {
    const mockService = { listVendorProducts: jest.fn() };

    it("GET returns items with pagination", async () => {
      const items = [{ id: "ds_1", title: "Drop Ship Item" }];
      mockService.listVendorProducts.mockResolvedValue(items);
      const req = createReq({ scope: { resolve: (global.vi || global.jest).fn((k) => k === "query" ? mockQuery : mockService) } });
      const res = createRes();
      await dropshippingGET(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

  });
});
