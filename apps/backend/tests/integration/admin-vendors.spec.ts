import { vi } from "vitest";
import { GET, POST } from "../../src/api/admin/vendors/route";

vi.mock("../../src/workflows/vendor/create-vendor-workflow", () => ({
  createVendorWorkflow: vi.fn(),
}));

const {
  createVendorWorkflow,
} = (await import("../../src/workflows/vendor/create-vendor-workflow"));

const mockJson = vi.fn();
const mockStatus = vi.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  params: {},
  cityosContext: { tenantId: "tenant_01", storeId: "store_01" },
  scope: {
    resolve: vi.fn((name: string) => overrides[name] || {}),
  },
  ...overrides,
});

const createMockRes = () => {
  const res: any = { json: mockJson, status: mockStatus };
  mockJson.mockClear();
  mockStatus.mockClear();
  mockStatus.mockReturnValue({ json: mockJson });
  return res;
};

describe("Admin Vendors Endpoints", () => {
  describe("GET /admin/vendors", () => {
    it("should list vendors for the tenant", async () => {
      const mockVendors = [
        { id: "vendor_01", name: "Acme Corp", status: "active" },
        { id: "vendor_02", name: "Tech Inc", status: "pending" },
      ];
      const req = createMockReq({
        vendor: { listVendors: vi.fn().mockResolvedValue(mockVendors) },
      });
      const res = createMockRes();

      await GET(req, res);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ vendors: mockVendors, count: 2 }),
      );
    });

    it("should return 403 when tenant context is missing", async () => {
      const req = createMockReq({ cityosContext: {} });
      const res = createMockRes();

      await GET(req, res);
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Tenant context required" }),
      );
    });

    it("should respect pagination params", async () => {
      const listVendors = vi.fn().mockResolvedValue([]);
      const req = createMockReq({
        query: { limit: "5", offset: "10" },
        vendor: { listVendors },
      });
      const res = createMockRes();

      await GET(req, res);
      expect(listVendors).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  describe("POST /admin/vendors", () => {
    const validBody = {
      handle: "new-vendor",
      businessName: "New Vendor LLC",
      legalName: "New Vendor LLC",
      email: "vendor@newvendor.com",
      address: {
        line1: "123 Main St",
        city: "Springfield",
        postalCode: "62701",
        countryCode: "US",
      },
    };

    it("should create a vendor via workflow", async () => {
      const mockResult = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        vendor: { id: "vendor_03", name: "New Vendor LLC" },
      };
      createVendorWorkflow.mockReturnValue({
        run: vi.fn().mockResolvedValue({ result: mockResult }),
      });
      const req = createMockReq({ body: validBody });
      const res = createMockRes();

      await POST(req, res);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ vendor: mockResult.vendor }),
      );
    });

    it("should return 403 when tenant context is missing", async () => {
      const req = createMockReq({ body: validBody, cityosContext: {} });
      const res = createMockRes();

      await POST(req, res);
      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it("should return 400 for invalid body", async () => {
      const req = createMockReq({ body: { handle: "x" } });
      const res = createMockRes();

      await POST(req, res);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Validation failed" }),
      );
    });

    it("should return 400 for invalid email format", async () => {
      const req = createMockReq({
        body: { ...validBody, email: "not-an-email" },
      });
      const res = createMockRes();

      await POST(req, res);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});
