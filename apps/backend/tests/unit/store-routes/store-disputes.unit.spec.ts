import { GET, POST } from "../../../src/api/store/disputes/route";

describe("Store Disputes Routes", () => {
  let mockReq: any;
  let mockRes: any;
  let mockDisputeService: any;

  beforeEach(() => {
    mockDisputeService = {
      getByCustomer: jest.fn().mockResolvedValue([]),
      openDispute: jest.fn().mockResolvedValue({ id: "disp-1" }),
    };
    mockReq = {
      scope: { resolve: jest.fn().mockReturnValue(mockDisputeService) },
      auth_context: { actor_id: "customer-1", tenant_id: "tenant-1" },
      query: {},
      body: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("GET /store/disputes", () => {
    it("returns 401 when no auth context", async () => {
      mockReq.auth_context = undefined;
      await GET(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("returns customer disputes", async () => {
      const disputes = [{ id: "disp-1", status: "open" }];
      mockDisputeService.getByCustomer.mockResolvedValue(disputes);

      await GET(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: disputes, count: 1 }),
      );
    });

    it("passes status filter", async () => {
      mockReq.query = { status: "open" };
      await GET(mockReq, mockRes);
      expect(mockDisputeService.getByCustomer).toHaveBeenCalledWith(
        "customer-1",
        expect.objectContaining({ status: "open" }),
      );
    });

    it("applies pagination", async () => {
      mockReq.query = { limit: "5", offset: "10" };
      await GET(mockReq, mockRes);
      expect(mockDisputeService.getByCustomer).toHaveBeenCalledWith(
        "customer-1",
        expect.objectContaining({ limit: 5, offset: 10 }),
      );
    });

  });

  describe("POST /store/disputes", () => {
    it("returns 401 when no auth context", async () => {
      mockReq.auth_context = undefined;
      await POST(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("creates a dispute with valid data", async () => {
      mockReq.body = {
        order_id: "order-1",
        reason: "Damaged item",
        description: "Item arrived broken",
        type: "product_quality",
      };

      await POST(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ dispute: { id: "disp-1" } });
    });

    it("returns 400 when order_id is missing", async () => {
      mockReq.body = { reason: "test", description: "test" };
      await POST(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Validation failed" }),
      );
    });

    it("returns 400 when reason is missing", async () => {
      mockReq.body = { order_id: "order-1", description: "test" };
      await POST(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

  });
});
