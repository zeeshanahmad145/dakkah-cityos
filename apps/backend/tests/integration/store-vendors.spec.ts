import { POST as registerVendor } from "../../src/api/store/vendors/register/route";

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));

const createMockReq = (overrides: Record<string, any> = {}) => ({
  query: {},
  body: {},
  params: {},
  auth_context: { actor_id: "cust_01" },
  scope: {
    resolve: jest.fn((name: string) => overrides[name] || {}),
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
        id: "vendor_01",
        name: "Acme Corp",
        handle: "acme-corp",
        status: "pending",
      };
      const req = createMockReq({
        body: validBody,
        vendor: {
          listVendors: jest.fn().mockResolvedValue([]),
          createVendors: jest.fn().mockResolvedValue(mockVendor),
        },
        event_bus: { emit: jest.fn().mockResolvedValue(undefined) },
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
          listVendors: jest.fn().mockResolvedValue([{ id: "existing_vendor" }]),
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
      const emit = jest.fn().mockResolvedValue(undefined);
      const mockVendor = {
        id: "vendor_02",
        name: "Test Co",
        handle: "test-co",
        status: "pending",
      };
      const req = createMockReq({
        body: { ...validBody, company_name: "Test Co" },
        vendor: {
          listVendors: jest.fn().mockResolvedValue([]),
          createVendors: jest.fn().mockResolvedValue(mockVendor),
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
