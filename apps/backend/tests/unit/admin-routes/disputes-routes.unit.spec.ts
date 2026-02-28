import {
  GET as listDisputes,
  POST as createDispute,
} from "../../../src/api/admin/disputes/route";
import {
  GET as getDispute,
  POST as updateDispute,
  DELETE as deleteDispute,
} from "../../../src/api/admin/disputes/[id]/route";
import { POST as escalateDispute } from "../../../src/api/admin/disputes/[id]/escalate/route";
import { POST as resolveDispute } from "../../../src/api/admin/disputes/[id]/resolve/route";

const createMockService = () => ({
  listDisputes: jest.fn(),
  retrieveDispute: jest.fn(),
  createDisputes: jest.fn(),
  updateDisputes: jest.fn(),
  deleteDisputes: jest.fn(),
  escalate: jest.fn(),
  resolve: jest.fn(),
});

const createReq = (mockService: any, overrides: any = {}) =>
  ({
    scope: { resolve: jest.fn(() => mockService) },
    query: {},
    params: {},
    body: {},
    ...overrides,
  }) as any;

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Disputes Routes", () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();
    jest.clearAllMocks();
  });

  describe("GET /admin/disputes", () => {
    it("should list disputes with default pagination", async () => {
      const disputes = [{ id: "disp_1" }, { id: "disp_2" }];
      mockService.listDisputes.mockResolvedValue(disputes);
      const req = createReq(mockService);
      const res = createRes();

      await listDisputes(req, res);

      expect(mockService.listDisputes).toHaveBeenCalledWith(
        {},
        { take: 20, skip: 0 },
      );
      expect(res.json).toHaveBeenCalledWith({
        disputes,
        count: 2,
        limit: 20,
        offset: 0,
      });
    });

    it("should parse custom limit and offset", async () => {
      mockService.listDisputes.mockResolvedValue([]);
      const req = createReq(mockService, {
        query: { limit: "10", offset: "5" },
      });
      const res = createRes();

      await listDisputes(req, res);

      expect(mockService.listDisputes).toHaveBeenCalledWith(
        {},
        { take: 10, skip: 5 },
      );
      expect(res.json).toHaveBeenCalledWith({
        disputes: [],
        count: 0,
        limit: 10,
        offset: 5,
      });
    });

    it("should filter by status", async () => {
      mockService.listDisputes.mockResolvedValue([]);
      const req = createReq(mockService, { query: { status: "open" } });
      const res = createRes();

      await listDisputes(req, res);

      expect(mockService.listDisputes).toHaveBeenCalledWith(
        { status: "open" },
        { take: 20, skip: 0 },
      );
    });

    it("should filter by customer_id and order_id", async () => {
      mockService.listDisputes.mockResolvedValue([]);
      const req = createReq(mockService, {
        query: { customer_id: "cust_1", order_id: "ord_1" },
      });
      const res = createRes();

      await listDisputes(req, res);

      expect(mockService.listDisputes).toHaveBeenCalledWith(
        { customer_id: "cust_1", order_id: "ord_1" },
        { take: 20, skip: 0 },
      );
    });

    it("should handle non-array result", async () => {
      const single = { id: "disp_1" };
      mockService.listDisputes.mockResolvedValue(single);
      const req = createReq(mockService);
      const res = createRes();

      await listDisputes(req, res);

      expect(res.json).toHaveBeenCalledWith({
        disputes: [single],
        count: 1,
        limit: 20,
        offset: 0,
      });
    });

    it("should return 500 on service error", async () => {
      mockService.listDisputes.mockRejectedValue(new Error("Service failure"));
      const req = createReq(mockService);
      const res = createRes();

      await listDisputes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("POST /admin/disputes", () => {
    it("should create a dispute and return 201", async () => {
      const dispute = { id: "disp_new", reason: "damaged" };
      mockService.createDisputes.mockResolvedValue(dispute);
      const req = createReq(mockService, {
        body: { reason: "damaged", order_id: "ord_1" },
      });
      const res = createRes();

      await createDispute(req, res);

      expect(mockService.createDisputes).toHaveBeenCalledWith({
        reason: "damaged",
        order_id: "ord_1",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ dispute });
    });

    it("should return 500 on creation error", async () => {
      mockService.createDisputes.mockRejectedValue(
        new Error("Unknown data failure"),
      );
      const req = createReq(mockService, { body: {} });
      const res = createRes();

      await createDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GET /admin/disputes/:id", () => {
    it("should retrieve a single dispute", async () => {
      const dispute = { id: "disp_1", status: "open" };
      mockService.retrieveDispute.mockResolvedValue(dispute);
      const req = createReq(mockService, { params: { id: "disp_1" } });
      const res = createRes();

      await getDispute(req, res);

      expect(mockService.retrieveDispute).toHaveBeenCalledWith("disp_1");
      expect(res.json).toHaveBeenCalledWith({ dispute });
    });

    it("should return 404 when dispute not found", async () => {
      mockService.retrieveDispute.mockRejectedValue(new Error("Not found"));
      const req = createReq(mockService, { params: { id: "missing" } });
      const res = createRes();

      await getDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Not found" });
    });
  });

  describe("POST /admin/disputes/:id (update)", () => {
    it("should update a dispute", async () => {
      const updated = { id: "disp_1", status: "resolved" };
      mockService.updateDisputes.mockResolvedValue(updated);
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: { status: "resolved" },
      });
      const res = createRes();

      await updateDispute(req, res);

      expect(mockService.updateDisputes).toHaveBeenCalledWith("disp_1", {
        status: "resolved",
      });
      expect(res.json).toHaveBeenCalledWith({ dispute: updated });
    });

    it("should return 500 on update error", async () => {
      mockService.updateDisputes.mockRejectedValue(new Error("Update failed"));
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: {},
      });
      const res = createRes();

      await updateDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("DELETE /admin/disputes/:id", () => {
    it("should delete a dispute and return confirmation", async () => {
      mockService.deleteDisputes.mockResolvedValue(undefined);
      const req = createReq(mockService, { params: { id: "disp_1" } });
      const res = createRes();

      await deleteDispute(req, res);

      expect(mockService.deleteDisputes).toHaveBeenCalledWith("disp_1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "disp_1", deleted: true });
    });

    it("should return 500 on delete error", async () => {
      mockService.deleteDisputes.mockRejectedValue(new Error("Cannot delete"));
      const req = createReq(mockService, { params: { id: "disp_1" } });
      const res = createRes();

      await deleteDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("POST /admin/disputes/:id/escalate", () => {
    it("should escalate a dispute", async () => {
      const escalated = { id: "disp_1", status: "escalated" };
      mockService.escalate.mockResolvedValue(escalated);
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: { reason: "unresolved" },
      });
      const res = createRes();

      await escalateDispute(req, res);

      expect(mockService.escalate).toHaveBeenCalledWith("disp_1", "unresolved");
      expect(res.json).toHaveBeenCalledWith({ dispute: escalated });
    });

    it("should handle escalation without reason", async () => {
      const escalated = { id: "disp_1", status: "escalated" };
      mockService.escalate.mockResolvedValue(escalated);
      const req = createReq(mockService, { params: { id: "disp_1" } });
      const res = createRes();

      await escalateDispute(req, res);

      expect(mockService.escalate).toHaveBeenCalledWith("disp_1", undefined);
    });

    it("should return 500 on escalation error", async () => {
      mockService.escalate.mockRejectedValue(new Error("Escalation failed"));
      const req = createReq(mockService, { params: { id: "disp_1" } });
      const res = createRes();

      await escalateDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("POST /admin/disputes/:id/resolve", () => {
    it("should resolve a dispute with full body", async () => {
      const resolved = { id: "disp_1", status: "resolved" };
      mockService.resolve.mockResolvedValue(resolved);
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: {
          resolution: "refund",
          resolution_amount: 50,
          resolved_by: "admin_user",
          notes: "Full refund issued",
        },
      });
      const res = createRes();

      await resolveDispute(req, res);

      expect(mockService.resolve).toHaveBeenCalledWith({
        disputeId: "disp_1",
        resolution: "refund",
        resolutionAmount: 50,
        resolvedBy: "admin_user",
        notes: "Full refund issued",
      });
      expect(res.json).toHaveBeenCalledWith({ dispute: resolved });
    });

    it("should default resolved_by to admin", async () => {
      mockService.resolve.mockResolvedValue({ id: "disp_1" });
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: { resolution: "refund" },
      });
      const res = createRes();

      await resolveDispute(req, res);

      expect(mockService.resolve).toHaveBeenCalledWith(
        expect.objectContaining({ resolvedBy: "admin" }),
      );
    });

    it("should return 500 on resolve error", async () => {
      mockService.resolve.mockRejectedValue(new Error("Cannot resolve"));
      const req = createReq(mockService, {
        params: { id: "disp_1" },
        body: {},
      });
      const res = createRes();

      await resolveDispute(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
