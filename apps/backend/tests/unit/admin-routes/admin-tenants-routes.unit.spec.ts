import {
  GET as getTenant,
  PUT as updateTenant,
} from "../../../src/api/admin/tenants/[id]/route";
import { GET as getTenantBilling } from "../../../src/api/admin/tenants/[id]/billing/route";
import { GET as getTenantLimits } from "../../../src/api/admin/tenants/[id]/limits/route";
import { GET as getTenantTeam } from "../../../src/api/admin/tenants/[id]/team/route";
import { PUT as updateTeamMember } from "../../../src/api/admin/tenants/[id]/team/[userId]/route";
import { GET as listPlatformTenants } from "../../../src/api/admin/platform/tenants/route";

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res;
};

describe("Admin Tenant Detail Routes", () => {
  describe("GET /admin/tenants/:id", () => {
    it("should return tenant by id", async () => {
      const tenant = {
        id: "ten_1",
        name: "Main",
        slug: "main",
        status: "active",
      };
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [tenant] }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "ten_1" },
        body: {},
      };
      const res = createRes();
      await getTenant(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({ entity: "tenant", filters: { id: "ten_1" } }),
      );
      expect(res.json).toHaveBeenCalledWith({ tenant });
    });

    it("should return 404 for non-existent tenant", async () => {
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: [undefined] }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "ten_missing" },
        body: {},
      };
      const res = createRes();
      await getTenant(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("PUT /admin/tenants/:id", () => {
    it("should update tenant", async () => {
      const updated = { id: "ten_1", name: "Updated" };
      const mockService = {
        updateTenants: jest.fn().mockResolvedValue(updated),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: { id: "ten_1" },
        body: { name: "Updated" },
      };
      const res = createRes();
      await updateTenant(req, res);
      expect(mockService.updateTenants).toHaveBeenCalledWith({
        id: "ten_1",
        name: "Updated",
      });
      expect(res.json).toHaveBeenCalledWith({ tenant: updated });
    });
  });
});

describe("Admin Tenant Billing Route", () => {
  it("should return tenant billing and usage info", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: "ten_1", name: "Test" }] })
        .mockResolvedValueOnce({ data: [{ id: "bill_1", plan: "pro" }] })
        .mockResolvedValueOnce({ data: [{ id: "ord_1" }] })
        .mockResolvedValueOnce({ data: [{ id: "prod_1" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "ten_1" },
      body: {},
    };
    const res = createRes();
    await getTenantBilling(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 if tenant not found", async () => {
    const mockQuery = {
      graph: jest.fn().mockResolvedValue({ data: [undefined] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "ten_missing" },
      body: {},
    };
    const res = createRes();
    await getTenantBilling(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Tenant Limits Route", () => {
  it("should return tenant limits and usage", async () => {
    const mockQuery = {
      graph: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: "ten_1", plan: "pro", limits: { max_products: 100 } }],
        })
        .mockResolvedValueOnce({ data: [{ id: "p1" }, { id: "p2" }] })
        .mockResolvedValueOnce({ data: [{ id: "o1" }] })
        .mockResolvedValueOnce({ data: [{ id: "u1" }] }),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "ten_1" },
      body: {},
    };
    const res = createRes();
    await getTenantLimits(req, res);
    expect(mockQuery.graph).toHaveBeenCalled();
  });

  it("should return 404 if tenant not found", async () => {
    const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
    const req = {
      scope: { resolve: jest.fn(() => mockQuery) },
      query: {},
      params: { id: "ten_missing" },
      body: {},
    };
    const res = createRes();
    await getTenantLimits(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("Admin Tenant Team Routes", () => {
  describe("GET /admin/tenants/:id/team", () => {
    it("should list team members", async () => {
      const members = [
        { id: "mem_1", role: "admin" },
        { id: "mem_2", role: "member" },
      ];
      const mockQuery = {
        graph: jest.fn().mockResolvedValue({ data: members }),
      };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "ten_1" },
        body: {},
      };
      const res = createRes();
      await getTenantTeam(req, res);
      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { tenant_id: "ten_1" } }),
      );
      expect(res.json).toHaveBeenCalledWith({ members });
    });
  });

  describe("PUT /admin/tenants/:id/team/:userId", () => {
    it("should update team member role", async () => {
      const mockQuery = {
        graph: jest
          .fn()
          .mockResolvedValue({ data: [{ id: "mem_1", role: "member" }] }),
      };
      const mockService = {
        updateTenantUsers: jest
          .fn()
          .mockResolvedValue({ id: "mem_1", role: "admin" }),
      };
      const req = {
        scope: {
          resolve: jest.fn((name: string) =>
            name === "tenantModuleService" ? mockService : mockQuery,
          ),
        },
        query: {},
        params: { id: "ten_1", userId: "user_1" },
        body: { role: "admin" },
      };
      const res = createRes();
      await updateTeamMember(req, res);
      expect(mockQuery.graph).toHaveBeenCalled();
    });

    it("should return 404 if member not found", async () => {
      const mockQuery = { graph: jest.fn().mockResolvedValue({ data: [] }) };
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: { id: "ten_1", userId: "user_missing" },
        body: { role: "admin" },
      };
      const res = createRes();
      await updateTeamMember(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

describe("Platform Tenants Route", () => {
  it("should list tenants for super_admin", async () => {
    const mockService = {
      listAndCountTenants: jest.fn().mockResolvedValue([[{ id: "ten_1" }], 1]),
    };
    const req = {
      scope: { resolve: jest.fn(() => mockService) },
      query: { limit: 50, offset: 0 },
      params: {},
      body: {},
      auth_context: { app_metadata: { role: "super_admin" } },
    };
    const res = createRes();
    await listPlatformTenants(req, res);
    expect(mockService.listAndCountTenants).toHaveBeenCalled();
  });

  it("should return 403 for non-super_admin", async () => {
    const req = {
      scope: { resolve: jest.fn() },
      query: {},
      params: {},
      body: {},
      auth_context: { app_metadata: { role: "admin" } },
    };
    const res = createRes();
    await listPlatformTenants(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
