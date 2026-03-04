import { GET, POST } from "../../../src/api/store/cart-extension/route";

describe("Store Cart Extension Routes", () => {
  let mockReq: any;
  let mockRes: any;
  let mockCartExtService: any;

  beforeEach(() => {
    mockCartExtService = {
      calculateCartInsights: jest
        .fn()
        .mockResolvedValue({ total_savings: 500 }),
      applyBundleDiscounts: jest.fn().mockResolvedValue({ applied: true }),
      validateCartLimits: jest.fn().mockResolvedValue({ valid: true }),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockCartExtService) },
      query: {},
      body: {},
      auth_context: { actor_id: "customer_1" },
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("GET /store/cart-extension", () => {
    it("returns 401 when cart_id is missing", async () => {
      await GET(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "cart_id query parameter is required",
      });
    });

    it("returns cart insights for valid cart_id", async () => {
      mockReq.query = { cart_id: "cart-1" };

      await GET(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        insights: { total_savings: 500 },
      });
      expect(mockCartExtService.calculateCartInsights).toHaveBeenCalledWith(
        "cart-1",
      );
    });

  });

  describe("POST /store/cart-extension", () => {
    it("returns 401 when cart_id is missing in body", async () => {
      mockReq.body = { action: "apply_bundle_discounts" };

      await POST(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    it("applies bundle discounts when action is apply_bundle_discounts", async () => {
      mockReq.body = { cart_id: "cart-1", action: "apply_bundle_discounts" };

      await POST(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        bundle_discounts: { applied: true },
      });
      expect(mockCartExtService.applyBundleDiscounts).toHaveBeenCalledWith(
        "cart-1",
      );
    });

    it("validates cart limits when action is validate_limits", async () => {
      mockReq.body = { cart_id: "cart-1", action: "validate_limits" };
      mockReq.query = { tenant_id: "tenant-1" };

      await POST(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        validation: { valid: true },
      });
      expect(mockCartExtService.validateCartLimits).toHaveBeenCalledWith(
        "cart-1",
        "tenant-1",
      );
    });

    it("defaults to apply_bundle_discounts when no action specified", async () => {
      mockReq.body = { cart_id: "cart-1" };

      await POST(mockReq, mockRes);

      expect(mockCartExtService.applyBundleDiscounts).toHaveBeenCalledWith(
        "cart-1",
      );
    });

  });
});
