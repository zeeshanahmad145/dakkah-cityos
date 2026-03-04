import { vi } from "vitest";
import { POST as registerVendor } from "../../src/api/store/vendors/register/route";

const mockJson = vi.fn();
const mockStatus = vi.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  params: {},
  auth_context: { actor_id: "cust_01" },
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

describe("Store Vendors Endpoints", () => {
  describe("POST /store/vendors/register", () => {
    const validBody = {
      company_name: "Acme Corp",
      business_email: "contact@acme.com",
      phone: "+1234567890",
      description: "Electronics retailer",
      business_type: "retail",
      agree_to_terms: true as const,
    };

    it("should register a new vendor successfully", async () => {
      const mockVendor = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        id: "vendor_01",
        name: "Acme Corp",
        handle: "acme-corp",
        status: "pending",
      };
      const req = createMockReq({
        body: validBody,
        vendor: {
          listVendors: vi.fn().mockResolvedValue([]),
          createVendors: vi.fn().mockResolvedValue(mockVendor),
        },
        event_bus: { emit: vi.fn().mockResolvedValue(undefined) },
      });
      const res = createMockRes();

      await registerVendor(req, res);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          vendor: expect.objectContaining({
            id: "vendor_01",
            handle: "acme-corp",
          }),
        }),
      );
    });

    it("should return 400 when vendor name already exists", async () => {
      const req = createMockReq({
        body: validBody,
        vendor: {
          listVendors: vi.fn().mockResolvedValue([{ id: "existing_vendor" }]),
        },
      });
      const res = createMockRes();

      await registerVendor(req, res);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "A vendor with this name already exists",
        }),
      );
    });

    it("should return 400 for invalid body (missing agree_to_terms)", async () => {
      const req = createMockReq({
        body: { company_name: "Test", business_email: "t@t.com" },
      });
      const res = createMockRes();

      await registerVendor(req, res);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Validation failed" }),
      );
    });

    it("should return 400 when company_name is empty", async () => {
      const req = createMockReq({
        body: { ...validBody, company_name: "" },
      });
      const res = createMockRes();

      await registerVendor(req, res);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should emit vendor.application_submitted event on success", async () => {
      const emit = vi.fn().mockResolvedValue(undefined);
      const mockVendor = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        id: "vendor_02",
        name: "Test Co",
        handle: "test-co",
        status: "pending",
      };
      const req = createMockReq({
        body: { ...validBody, company_name: "Test Co" },
        vendor: {
          listVendors: vi.fn().mockResolvedValue([]),
          createVendors: vi.fn().mockResolvedValue(mockVendor),
        },
        event_bus: { emit },
      });
      const res = createMockRes();

      await registerVendor(req, res);
      expect(emit).toHaveBeenCalledWith(
        "vendor.application_submitted",
        expect.objectContaining({ vendor_id: "vendor_02" }),
      );
    });
  });
});
