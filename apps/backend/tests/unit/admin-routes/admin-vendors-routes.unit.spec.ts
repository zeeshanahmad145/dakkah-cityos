import {
  GET as getVendor,
  POST as updateVendor,
} from "../../../src/api/admin/vendors/[id]/route";
import { POST as approveVendor } from "../../../src/api/admin/vendors/[id]/approve/route";
import { POST as rejectVendor } from "../../../src/api/admin/vendors/[id]/reject/route";
import { POST as suspendVendor } from "../../../src/api/admin/vendors/[id]/suspend/route";
import { POST as reinstateVendor } from "../../../src/api/admin/vendors/[id]/reinstate/route";
import { GET as getVendorAnalytics } from "../../../src/api/admin/vendors/analytics/route";
import { GET as getVendorPerformance } from "../../../src/api/admin/vendors/[id]/performance/route";

jest.mock("../../../src/workflows/vendor/approve-vendor-workflow", () => ({
  approveVendorWorkflow: jest.fn(() => ({
    run: jest.fn().mockResolvedValue({
      result: { vendor: { id: "vnd_1", status: "approved" } },
    }),
  })),
}));

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Vendor Detail Routes", () => {
  describe("GET /admin/vendors/:id", () => {
    it("should return vendor by id", async () => {
      const vendor = {
        id: "vnd_1",
        store_name: "Test Vendor",
        status: "active",
      };
      const mockService = {
        listVendors: jest.fn().mockResolvedValue([vendor]),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "vnd_1" },
        body: {},
      };
      const res = createRes();
      await getVendor(req, res);
      expect(mockService.listVendors).toHaveBeenCalledWith(
        { id: "vnd_1" },
        { take: 1 },
      );
      expect(res.json).toHaveBeenCalledWith({ vendor });
    });

    it("should return 404 for non-existent vendor", async () => {
      const mockService = { listVendors: jest.fn().mockResolvedValue([]) };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "vnd_missing" },
        body: {},
      };
      const res = createRes();
      await getVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Vendor not found" });
    });
  });

  describe("POST /admin/vendors/:id (update)", () => {
    it("should update vendor with valid data", async () => {
      const updated = { id: "vnd_1", email: "new@test.com" };
      const mockService = {
        updateVendors: jest.fn().mockResolvedValue(updated),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "vnd_1" },
        body: { email: "new@test.com" },
      };
      const res = createRes();
      await updateVendor(req, res);
      expect(mockService.updateVendors).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ vendor: expect.any(Object) }),
      );
    });

    it("should return 400 for invalid email", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: { id: "vnd_1" },
        body: { email: "not-an-email" },
      };
      const res = createRes();
      await updateVendor(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Validation failed" }),
      );
    });
  });
});

describe("Admin Vendor Approve Route", () => {
  it("should approve vendor via workflow", async () => {
    const {
      approveVendorWorkflow,
    } = require("../../../src/workflows/vendor/approve-vendor-workflow");
    const mockRun = jest.fn().mockResolvedValue({
      result: { vendor: { id: "vnd_1", status: "approved" } },
    });
    (approveVendorWorkflow as jest.Mock).mockReturnValue({ run: mockRun });
    const req = {
      scope: { resolve: jest.fn() },
      query: {},
      params: { id: "vnd_1" },
      body: { notes: "Looks good" },
      auth: { userId: "admin-1" },
    };
    const res = createRes();
    await approveVendor(req, res);
    expect(approveVendorWorkflow).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      vendor: expect.objectContaining({ status: "approved" }),
    });
  });
});

describe("Admin Vendor Reject Route", () => {
  it("should reject vendor with reason", async () => {
    const mockService = {
      rejectVendor: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "rejected" }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: { id: "vnd_1" },
      body: { reason: "Incomplete docs" },
    };
    const res = createRes();
    await rejectVendor(req, res);
    expect(mockService.rejectVendor).toHaveBeenCalledWith(
      "vnd_1",
      "Incomplete docs",
    );
    expect(res.json).toHaveBeenCalledWith({
      vendor: expect.objectContaining({ status: "rejected" }),
    });
  });

  it("should use default reason when none provided", async () => {
    const mockService = {
      rejectVendor: jest.fn().mockResolvedValue({ id: "vnd_1" }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockService) },
      query: {},
      params: { id: "vnd_1" },
      body: {},
    };
    const res = createRes();
    await rejectVendor(req, res);
    expect(mockService.rejectVendor).toHaveBeenCalledWith(
      "vnd_1",
      "No reason provided",
    );
  });
});

describe("Admin Vendor Suspend Route", () => {
  it("should suspend vendor and emit event", async () => {
    const mockVendorService = {
      updateVendors: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "suspended" }),
    };
    const mockEventBus = { emit: jest.fn() };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "event_bus" ? mockEventBus : mockVendorService,
        ),
      },
      query: {},
      params: { id: "vnd_1" },
      body: { reason: "Violation" },
      auth_context: { actor_id: "admin-1" },
    };
    const res = createRes();
    await suspendVendor(req, res);
    expect(mockVendorService.updateVendors).toHaveBeenCalledWith(
      expect.objectContaining({ status: "suspended" }),
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      "vendor.suspended",
      expect.any(Object),
    );
    expect(res.json).toHaveBeenCalledWith({
      vendor: expect.objectContaining({ status: "suspended" }),
    });
  });

  it("should handle errors gracefully", async () => {
    const mockVendorService = {
      updateVendors: jest.fn().mockRejectedValue(new Error("DB error")),
    };
    const mockEventBus = { emit: jest.fn() };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "event_bus" ? mockEventBus : mockVendorService,
        ),
      },
      query: {},
      params: { id: "vnd_1" },
      body: { reason: "Test" },
      auth_context: { actor_id: "admin-1" },
    };
    const res = createRes();
    await suspendVendor(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("Admin Vendor Reinstate Route", () => {
  it("should reinstate suspended vendor", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "vnd_1", status: "suspended" }] }),
    };
    const mockService = {
      updateVendors: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "approved" }),
    };
    const req = {
      scope: {
        resolve: jest.fn((name: string) =>
          name === "vendorModuleService" ? mockService : mockQuery,
        ),
      },
      query: {},
      params: { id: "vnd_1" },
      body: { reason: "Resolved", notify_vendor: false },
    };
    const res = createRes();
    await reinstateVendor(req, res);
    expect(mockService.updateVendors).toHaveBeenCalled();
  });

  it("should return 404 if vendor not found", async () => {
    const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "vnd_missing" },
      body: {},
    };
    const res = createRes();
    await reinstateVendor(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 400 if vendor not suspended", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "vnd_1", status: "active" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "vnd_1" },
      body: {},
    };
    const res = createRes();
    await reinstateVendor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Vendor Analytics Route", () => {
  it("should return vendor analytics with aggregated stats", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: "vnd_1", store_name: "Shop", total_sales: 1000 }],
        })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            {
              id: "pay_1",
              vendor_id: "vnd_1",
              amount: 500,
              status: "completed",
            },
          ],
        }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: {},
      body: {},
    };
    const res = createRes();
    await getVendorAnalytics(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});

describe("Admin Vendor Performance Route", () => {
  it("should return vendor performance metrics", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: "vnd_1", name: "Test", status: "active" }],
        })
        .mockResolvedValueOnce({
          data: [{ id: "ord_1", total: 100, status: "completed", items: [] }],
        })
        .mockResolvedValueOnce({ data: [{ id: "rev_1", rating: 5 }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: { period: "30d" },
      params: { id: "vnd_1" },
      body: {},
    };
    const res = createRes();
    await getVendorPerformance(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
  });

  it("should return 404 if vendor not found", async () => {
    const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "vnd_missing" },
      body: {},
    };
    const res = createRes();
    await getVendorPerformance(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
