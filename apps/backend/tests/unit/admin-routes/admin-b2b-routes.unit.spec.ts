import { vi } from "vitest";
import { GET as listCompanies } from "../../../src/api/admin/companies/route";
import { POST as approveCompany } from "../../../src/api/admin/companies/[id]/approve/route";
import { GET as getCompanyCredit } from "../../../src/api/admin/companies/[id]/credit/route";
import { GET as getCompanyRoles } from "../../../src/api/admin/companies/[id]/roles/route";
import { GET as getSpendingLimits } from "../../../src/api/admin/companies/[id]/spending-limits/route";
import { GET as getTaxExemptions } from "../../../src/api/admin/companies/[id]/tax-exemptions/route";
import { GET as getWorkflow } from "../../../src/api/admin/companies/[id]/workflow/route";
import { GET as listPurchaseOrders } from "../../../src/api/admin/purchase-orders/route";
import { POST as approvePO } from "../../../src/api/admin/purchase-orders/[id]/approve/route";
import { POST as rejectPO } from "../../../src/api/admin/purchase-orders/[id]/reject/route";
import { GET as listQuotes } from "../../../src/api/admin/quotes/route";
import { POST as approveQuote } from "../../../src/api/admin/quotes/[id]/approve/route";
import { POST as rejectQuote } from "../../../src/api/admin/quotes/[id]/reject/route";
import { GET as listExpiringQuotes } from "../../../src/api/admin/quotes/expiring/route";
import { GET as listPricingTiers } from "../../../src/api/admin/pricing-tiers/route";

const createRes = () => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res;
};

describe("Admin Companies Routes", () => {
  describe("GET /admin/companies", () => {
    it("should list companies with pagination", async () => {
      const companies = [{ id: "comp_1", name: "Acme Corp" }];
      const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        listCompanies: vi.fn().mockResolvedValue([companies, 1]),
      };
      const req = {
        scope: {
          resolve: vi.fn((name: string) =>
            name === "tenantId" ? "ten_1" : mockService,
          ),
        },
        query: { limit: 20, offset: 0 },
        params: {},
        body: {},
      };
      const res = createRes();
      await listCompanies(req, res);
      expect(mockService.listCompanies).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("GET /admin/companies (with filters)", () => {
    it("should apply status and tier filters", async () => {
      const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        listCompanies: vi.fn().mockResolvedValue([[{ id: "comp_1" }], 1]),
      };
      const req = {
        scope: {
          resolve: vi.fn((name: string) =>
            name === "tenantId" ? "ten_1" : mockService,
          ),
        },
        query: { status: "approved", tier: "gold", limit: 10, offset: 0 },
        params: {},
        body: {},
      };
      const res = createRes();
      await listCompanies(req, res);
      expect(mockService.listCompanies).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved", tier: "gold" }),
        expect.any(Object),
      );
    });
  });
});

describe("Admin Company Approve Route", () => {
  it("should approve a pending company", async () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      retrieveCompany: jest
        .fn()
        .mockResolvedValue({ id: "comp_1", status: "pending" }),
      updateCompanies: jest
        .fn()
        .mockResolvedValue({ id: "comp_1", status: "approved" }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockService) },
      query: {},
      params: { id: "comp_1" },
      body: {},
      auth_context: { actor_id: "admin-1" },
    };
    const res = createRes();
    await approveCompany(req, res);
    expect(mockService.updateCompanies).toHaveBeenCalled();
  });

  it("should reject approving non-pending company", async () => {
    const mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      retrieveCompany: jest
        .fn()
        .mockResolvedValue({ id: "comp_1", status: "approved" }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockService) },
      query: {},
      params: { id: "comp_1" },
      body: {},
      auth_context: { actor_id: "admin-1" },
    };
    const res = createRes();
    await approveCompany(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Admin Company Credit Route", () => {
  it("should return company credit details", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: vi.fn().mockResolvedValue({
        data: [{ id: "comp_1", credit_limit: "5000", credit_used: "1000" }],
      }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_1" },
      body: {},
    };
    const res = createRes();
    await getCompanyCredit(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 for non-existent company", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: vi.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_missing" },
      body: {},
    };
    const res = createRes();
    await getCompanyCredit(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Company Roles Route", () => {
  it("should return company roles and users", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: "comp_1", name: "Corp", metadata: {} }],
        })
        .mockResolvedValueOnce({ data: [{ id: "cu_1", role: "admin" }] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_1" },
      body: {},
    };
    const res = createRes();
    await getCompanyRoles(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});

describe("Admin Company Spending Limits Route", () => {
  it("should return spending limits", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: "comp_1", auto_approve_limit: 500 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: "cu_1", spending_limit: 1000 }],
        }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_1" },
      body: {},
    };
    const res = createRes();
    await getSpendingLimits(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 for non-existent company", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: vi.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_missing" },
      body: {},
    };
    const res = createRes();
    await getSpendingLimits(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Company Tax Exemptions Route", () => {
  it("should return tax exemptions", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "ex_1", company_id: "comp_1" }] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_1" },
      body: {},
    };
    const res = createRes();
    await getTaxExemptions(req, res);
    expect(res.json).toHaveBeenCalledWith({ exemptions: expect.any(Array) });
  });
});

describe("Admin Company Workflow Route", () => {
  it("should return approval workflow config", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: vi.fn().mockResolvedValue({
        data: [
          {
            id: "comp_1",
            requires_approval: true,
            auto_approve_limit: 500,
            metadata: {},
          },
        ],
      }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_1" },
      body: {},
    };
    const res = createRes();
    await getWorkflow(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 for non-existent company", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: vi.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: { id: "comp_missing" },
      body: {},
    };
    const res = createRes();
    await getWorkflow(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Purchase Orders Routes", () => {
  it("should list purchase orders", async () => {
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValue({ data: [{ id: "po_1" }], metadata: { count: 1 } }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: { limit: 20, offset: 0 },
      params: {},
      body: {},
    };
    const res = createRes();
    await listPurchaseOrders(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});

describe("Admin Quotes Routes", () => {
  describe("POST /admin/quotes/:id/reject", () => {
    it("should reject a quote", async () => {
      const mockModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        updateQuotes: jest
          .fn()
          .mockResolvedValue({ id: "q_1", status: "rejected" }),
      };
      const req = {
        scope: { resolve: vi.fn(() => mockModule) },
        query: {},
        params: { id: "q_1" },
        body: { rejection_reason: "Too expensive" },
      };
      const res = createRes();
      await rejectQuote(req, res);
      expect(mockModule.updateQuotes).toHaveBeenCalledWith(
        expect.objectContaining({ status: "rejected" }),
      );
      expect(res.json).toHaveBeenCalledWith({
        quote: expect.objectContaining({ status: "rejected" }),
      });
    });
  });

  describe("GET /admin/quotes/expiring", () => {
    it("should list expiring quotes", async () => {
      const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

        graph: vi.fn().mockResolvedValue({
          data: [
            {
              id: "q_1",
              status: "pending",
              valid_until: new Date(Date.now() + 86400000).toISOString(),
            },
          ],
        }),
      };
      const req = {
        scope: { resolve: vi.fn(() => mockQuery) },
        query: { days_until_expiry: 7 },
        params: {},
        body: {},
      };
      const res = createRes();
      await listExpiringQuotes(req, res);
      expect(mockQuery.graph).toHaveBeenCalled();
    });
  });
});

describe("Admin Pricing Tiers Route", () => {
  it("should list pricing tiers", async () => {
    const tiers = [{ id: "tier_1", name: "Gold", discount_percentage: 10 }];
    const mockQuery = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      graph: jest
        .fn()
        .mockResolvedValueOnce({ data: tiers })
        .mockResolvedValueOnce({ data: [{ id: "comp_1" }] }),
    };
    const req = {
      scope: { resolve: vi.fn(() => mockQuery) },
      query: {},
      params: {},
      body: {},
    };
    const res = createRes();
    await listPricingTiers(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
  });
});
