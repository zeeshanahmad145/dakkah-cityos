import { vi } from "vitest";
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

vi.mock("../../../src/workflows/vendor/approve-vendor-workflow", () => ({
  approveVendorWorkflow: vi.fn(() => ({
    run: vi.fn().mockResolvedValue({
      result: { vendor: { id: "vnd_1", status: "approved" } },
    }),
  })),
}));

const createRes = () => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        listVendors: vi.fn().mockResolvedValue([vendor]),
      };
      const req = {
        scope: { resolve: vi.fn(() => mockService) },
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
      const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listVendors: vi.fn().mockResolvedValue([]) };
      const req = {
        scope: { resolve: vi.fn(() => mockService) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        updateVendors: vi.fn().mockResolvedValue(updated),
      };
      const req = {
        scope: { resolve: vi.fn(() => mockService) },
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
        scope: { resolve: vi.fn() },
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
    } = (await import("../../../src/workflows/vendor/approve-vendor-workflow"));
    const mockRun = vi.fn().mockResolvedValue({
      result: { vendor: { id: "vnd_1", status: "approved" } },
    });
    (approveVendorWorkflow as jest.Mock).mockReturnValue({ run: mockRun });
    const req = {
      scope: { resolve: vi.fn() },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      rejectVendor: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "rejected" }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockService) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      rejectVendor: vi.fn().mockResolvedValue({ id: "vnd_1" }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockService) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      updateVendors: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "suspended" }),
    };
    const mockEventBus = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 emit: vi.fn() };
    const req = {
      scope: {
        resolve: vi.fn((name: string) =>
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      updateVendors: vi.fn().mockRejectedValue(new Error("DB error")),
    };
    const mockEventBus = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 emit: vi.fn() };
    const req = {
      scope: {
        resolve: vi.fn((name: string) =>
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "vnd_1", status: "suspended" }] }),
    };
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      updateVendors: jest
        .fn()
        .mockResolvedValue({ id: "vnd_1", status: "approved" }),
    };
    const req = {
      scope: {
        resolve: vi.fn((name: string) =>
          name === "vendor" ? mockService : mockQuery,
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
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 graph: vi.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "vnd_1", status: "active" }] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

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
      scope: { resolve: vi.fn(() => mockQuery) },
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
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

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
      scope: { resolve: vi.fn(() => mockQuery) },
      query: { period: "30d" },
      params: { id: "vnd_1" },
      body: {},
    };
    const res = createRes();
    await getVendorPerformance(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
  });

  it("should return 404 if vendor not found", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 graph: vi.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "vnd_missing" },
      body: {},
    };
    const res = createRes();
    await getVendorPerformance(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
