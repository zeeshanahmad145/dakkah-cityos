jest.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: jest.fn((res, _error, context) => {
    return res.status(500).json({ message: `${context} failed` });
  }),
}));

import { GET } from "../../../src/api/store/cityos/governance/route";

describe("GET /store/cityos/governance", () => {
  let mockGovernanceModule: {
    resolveEffectivePolicies: jest.Mock;
    listGovernanceAuthorities: jest.Mock;
  };
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockGovernanceModule = {
      resolveEffectivePolicies: jest.fn(),
      listGovernanceAuthorities: jest.fn(),
    };

    mockReq = {
      nodeContext: { tenantId: "tenant_123" },
      query: {},
      scope: {
        resolve: jest.fn().mockReturnValue(mockGovernanceModule),
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("returns 400 when no tenantId is provided", async () => {
    mockReq.nodeContext = {};
    mockReq.query = {};

    await GET(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Tenant context required",
    });
  });

  it("resolves tenantId from nodeContext", async () => {
    const policies = { maxProducts: 10 };
    const authorities = [{ id: "auth_1", name: "Authority 1" }];
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue(policies);
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      authorities,
    );

    await GET(mockReq, mockRes);

    expect(mockGovernanceModule.resolveEffectivePolicies).toHaveBeenCalledWith(
      "tenant_123",
    );
    expect(mockGovernanceModule.listGovernanceAuthorities).toHaveBeenCalledWith(
      { tenant_id: "tenant_123" },
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      authorities,
      effective_policies: policies,
    });
  });

  it("resolves tenantId from query param when nodeContext is absent", async () => {
    mockReq.nodeContext = {};
    mockReq.query = { tenant_id: "tenant_456" };
    const policies = { maxProducts: 5 };
    const authorities = [{ id: "auth_2" }];
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue(policies);
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      authorities,
    );

    await GET(mockReq, mockRes);

    expect(mockGovernanceModule.resolveEffectivePolicies).toHaveBeenCalledWith(
      "tenant_456",
    );
    expect(mockGovernanceModule.listGovernanceAuthorities).toHaveBeenCalledWith(
      { tenant_id: "tenant_456" },
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      authorities,
      effective_policies: policies,
    });
  });

  it("returns authorities directly when they are an array", async () => {
    const authorities = [{ id: "a1" }, { id: "a2" }];
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue({});
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      authorities,
    );

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ authorities }),
    );
  });

  it("wraps a single authority object in an array", async () => {
    const singleAuthority = { id: "a1", name: "Single" };
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue({});
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      singleAuthority,
    );

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ authorities: [singleAuthority] }),
    );
  });

  it("defaults authorities to empty array when listGovernanceAuthorities throws", async () => {
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue({
      policy: "value",
    });
    mockGovernanceModule.listGovernanceAuthorities.mockRejectedValue(
      new Error("DB error"),
    );

    await GET(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      authorities: [],
      effective_policies: { policy: "value" },
    });
  });

  it("returns 500 when resolveEffectivePolicies throws", async () => {
    mockGovernanceModule.resolveEffectivePolicies.mockRejectedValue(
      new Error("Fatal error"),
    );

    await GET(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "STORE-CITYOS-GOVERNANCE failed",
    });
  });

  it("returns correct response shape with authorities and effective_policies", async () => {
    const policies = {
      featureFlags: { billing: true },
      limits: { products: 100 },
    };
    const authorities = [
      { id: "auth_1", type: "municipal" },
      { id: "auth_2", type: "regional" },
    ];
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue(policies);
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      authorities,
    );

    await GET(mockReq, mockRes);

    const response = mockRes.json.mock.calls[0][0];
    expect(response).toHaveProperty("authorities");
    expect(response).toHaveProperty("effective_policies");
    expect(Array.isArray(response.authorities)).toBe(true);
    expect(response.effective_policies).toEqual(policies);
  });

  it("resolves governance module from request scope", async () => {
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue({});
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue([]);

    await GET(mockReq, mockRes);

    expect(mockReq.scope.resolve).toHaveBeenCalledWith("governance");
  });
});
