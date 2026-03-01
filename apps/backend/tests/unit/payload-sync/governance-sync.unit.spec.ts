import { MedusaToPayloadSync } from "../../../src/integrations/payload-sync/medusa-to-payload";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
    })),
  },
}));

const mockGovernanceModule = {
  resolveEffectivePolicies: jest.fn(),
  listGovernanceAuthorities: jest.fn(),
};

const mockContainer = {
  resolve: jest.fn((key: string) => {
    if (key === "governance") return mockGovernanceModule;
    return {};
  }),
};

const TEST_TENANT_ID = "tenant_test_123";

const mockAuthority = {
  id: "auth_1",
  name: "City Authority",
  slug: "city-authority",
  type: "municipal",
  jurisdiction_level: "city",
  residency_zone: "zone-a",
  policies: { tax_rate: 0.08 },
  status: "active",
  extra_field: "should_be_excluded",
};

const mockEffectivePolicies = {
  commerce: { require_kyc: true, max_transaction_amount: 5000 },
  content_moderation: { prohibited_categories: ["gambling"] },
};

describe("MedusaToPayloadSync - syncGovernancePolicies", () => {
  let sync: MedusaToPayloadSync;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.resolve.mockImplementation((key: string) => {
      if (key === "governance") return mockGovernanceModule;
      return {};
    });
    sync = new MedusaToPayloadSync(mockContainer, {
      payloadUrl: "http://localhost:3001",
      payloadApiKey: "test-api-key",
    });
    mockGovernanceModule.resolveEffectivePolicies.mockResolvedValue(
      mockEffectivePolicies,
    );
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue([
      mockAuthority,
    ]);
  });

  it("creates new policy when none exists (POST)", async () => {
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    expect(mockGovernanceModule.resolveEffectivePolicies).toHaveBeenCalledWith(
      TEST_TENANT_ID,
    );
    expect(mockGovernanceModule.listGovernanceAuthorities).toHaveBeenCalledWith(
      { tenant_id: TEST_TENANT_ID },
    );

    expect(mockGet).toHaveBeenCalledWith("/api/governance-policies", {
      params: {
        where: { tenantId: { equals: TEST_TENANT_ID } },
        limit: 1,
      },
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/governance-policies",
      expect.objectContaining({
        tenantId: TEST_TENANT_ID,
        effectivePolicies: mockEffectivePolicies,
      }),
    );
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("updates existing policy (PATCH)", async () => {
    const existingDoc = { id: "existing_1" };
    mockGet.mockResolvedValue({ data: { docs: [existingDoc] } });
    mockPatch.mockResolvedValue({ data: existingDoc });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    expect(mockPatch).toHaveBeenCalledWith(
      `/api/governance-policies/${existingDoc.id}`,
      expect.objectContaining({
        tenantId: TEST_TENANT_ID,
        effectivePolicies: mockEffectivePolicies,
      }),
    );
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("wraps single authority (not array) in array", async () => {
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(
      mockAuthority,
    );
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    const postCall = mockPost.mock.calls[0];
    const policyData = postCall[1];
    expect(Array.isArray(policyData.authorities)).toBe(true);
    expect(policyData.authorities).toHaveLength(1);
    expect(policyData.authorities[0].id).toBe(mockAuthority.id);
  });

  it("maps authority fields correctly", async () => {
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    const postCall = mockPost.mock.calls[0];
    const authority = postCall[1].authorities[0];

    expect(authority).toEqual({
      id: "auth_1",
      name: "City Authority",
      slug: "city-authority",
      type: "municipal",
      jurisdictionLevel: "city",
      residencyZone: "zone-a",
      policies: { tax_rate: 0.08 },
      status: "active",
    });
    expect(authority).not.toHaveProperty("extra_field");
    expect(authority).not.toHaveProperty("jurisdiction_level");
    expect(authority).not.toHaveProperty("residency_zone");
  });

  it("throws on API error", async () => {
    const apiError = new Error("Network Error");
    mockGet.mockRejectedValue(apiError);

    await expect(sync.syncGovernancePolicies(TEST_TENANT_ID)).rejects.toThrow(
      "Network Error",
    );
  });

  it("includes correct policyData shape", async () => {
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    const postCall = mockPost.mock.calls[0];
    const policyData = postCall[1];

    expect(policyData).toHaveProperty("tenantId", TEST_TENANT_ID);
    expect(policyData).toHaveProperty("effectivePolicies");
    expect(policyData).toHaveProperty("authorities");
    expect(policyData).toHaveProperty("lastSyncedAt");
    expect(typeof policyData.lastSyncedAt).toBe("string");
    expect(new Date(policyData.lastSyncedAt).getTime()).not.toBeNaN();
  });

  it("filters out null/undefined when wrapping non-array authorities", async () => {
    mockGovernanceModule.listGovernanceAuthorities.mockResolvedValue(null);
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    const postCall = mockPost.mock.calls[0];
    const policyData = postCall[1];
    expect(policyData.authorities).toEqual([]);
  });

  it("resolves governance module from container", async () => {
    mockGet.mockResolvedValue({ data: { docs: [] } });
    mockPost.mockResolvedValue({ data: { id: "new_1" } });

    await sync.syncGovernancePolicies(TEST_TENANT_ID);

    expect(mockContainer.resolve).toHaveBeenCalledWith("governance");
  });
});
