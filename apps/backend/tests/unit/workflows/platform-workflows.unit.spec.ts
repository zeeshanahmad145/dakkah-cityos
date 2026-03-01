jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn((config, fn) => {
    return { run: jest.fn(), config, fn };
  }),
  createStep: jest.fn((_name, fn) => fn),
  StepResponse: jest.fn((data) => data),
  WorkflowResponse: jest.fn((data) => data),
}));

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: jest.fn((name: string) => overrides[name] || {}),
});

describe("Tenant Provisioning Workflow", () => {
  let createTenantStep: any;
  let provisionResourcesStep: any;
  let seedTenantDataStep: any;
  let configureTenantStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/tenant-provisioning.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    createTenantStep = calls.find(
      (c: any) => c[0] === "create-tenant-record-step",
    )?.[1];
    provisionResourcesStep = calls.find(
      (c: any) => c[0] === "provision-tenant-resources-step",
    )?.[1];
    seedTenantDataStep = calls.find(
      (c: any) => c[0] === "seed-tenant-data-step",
    )?.[1];
    configureTenantStep = calls.find(
      (c: any) => c[0] === "configure-tenant-step",
    )?.[1];
  });

  it("should create a tenant with provisioning status", async () => {
    const tenant = { id: "t_1", status: "provisioning" };
    const container = mockContainer({
      tenant: { createTenants: jest.fn().mockResolvedValue(tenant) },
    });
    const result = await createTenantStep(
      {
        name: "Acme",
        domain: "acme.com",
        adminEmail: "admin@acme.com",
        plan: "pro",
        region: "us-east",
      },
      { container },
    );
    expect(result.tenant.status).toBe("provisioning");
  });

  it("should provision resources for a region", async () => {
    const result = await provisionResourcesStep(
      { tenantId: "t_1", region: "us-east" },
      { container: mockContainer() },
    );
    expect(result.resources.database_provisioned).toBe(true);
    expect(result.resources.storage_provisioned).toBe(true);
    expect(result.resources.region).toBe("us-east");
  });

  it("should seed tenant data with features", async () => {
    const result = await seedTenantDataStep(
      { tenantId: "t_1", features: ["booking", "loyalty"] },
      { container: mockContainer() },
    );
    expect(result.seeded.features_enabled).toEqual(["booking", "loyalty"]);
    expect(result.seeded.default_settings).toBeDefined();
  });

  it("should seed with empty features when none provided", async () => {
    const result = await seedTenantDataStep(
      { tenantId: "t_1" },
      { container: mockContainer() },
    );
    expect(result.seeded.features_enabled).toEqual([]);
  });

  it("should configure tenant to active status", async () => {
    const configured = { id: "t_1", status: "active" };
    const container = mockContainer({
      tenant: { updateTenants: jest.fn().mockResolvedValue(configured) },
    });
    const result = await configureTenantStep(
      { tenantId: "t_1", domain: "acme.com", plan: "pro" },
      { container },
    );
    expect(result.tenant.status).toBe("active");
  });
});

describe("Hierarchy Sync Workflow", () => {
  let detectChangeStep: any;
  let validateHierarchyStep: any;
  let propagateChangeStep: any;
  let auditHierarchyChangeStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/hierarchy-sync.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    detectChangeStep = calls.find(
      (c: any) => c[0] === "detect-hierarchy-change-step",
    )?.[1];
    validateHierarchyStep = calls.find(
      (c: any) => c[0] === "validate-hierarchy-change-step",
    )?.[1];
    propagateChangeStep = calls.find(
      (c: any) => c[0] === "propagate-hierarchy-change-step",
    )?.[1];
    auditHierarchyChangeStep = calls.find(
      (c: any) => c[0] === "audit-hierarchy-change-step",
    )?.[1];
  });

  it("should detect hierarchy change", async () => {
    const node = { id: "n_1", parent_id: "p_old" };
    const container = mockContainer({
      node: { retrieveNode: jest.fn().mockResolvedValue(node) },
    });
    const result = await detectChangeStep(
      { nodeId: "n_1", changeType: "move", parentId: "p_new", tenantId: "t1" },
      { container },
    );
    expect(result.change.previous_parent).toBe("p_old");
    expect(result.change.new_parent).toBe("p_new");
  });

  it("should validate hierarchy with no circular references", async () => {
    const result = await validateHierarchyStep(
      { nodeId: "n_1", parentId: "p_2", changeType: "move" },
      { container: mockContainer() },
    );
    expect(result.validation.valid).toBe(true);
    expect(result.validation.circular_reference).toBe(false);
  });

  it("should propagate hierarchy change to affected nodes", async () => {
    const container = mockContainer({
      node: {
        listNodes: jest
          .fn()
          .mockResolvedValue([{ id: "child_1" }, { id: "child_2" }]),
      },
    });
    const result = await propagateChangeStep(
      { nodeId: "n_1", changeType: "move", parentId: "p_new" },
      { container },
    );
    expect(result.propagation.affected_count).toBe(2);
  });

  it("should create audit entry for hierarchy change", async () => {
    const entry = { id: "audit_1" };
    const container = mockContainer({
      audit: { createAuditEntries: jest.fn().mockResolvedValue(entry) },
    });
    const result = await auditHierarchyChangeStep(
      { nodeId: "n_1", changeType: "move", tenantId: "t1" },
      { container },
    );
    expect(result.auditEntry).toEqual(entry);
  });
});

describe("Content Moderation Workflow", () => {
  let submitContentStep: any;
  let aiScanContentStep: any;
  let reviewContentStep: any;
  let publishContentStep: any;

  beforeAll(async () => {
    await import("../../../src/workflows/content-moderation.js");
    const { createStep } = require("@medusajs/framework/workflows-sdk");
    const calls = createStep.mock.calls;
    submitContentStep = calls.find(
      (c: any) => c[0] === "submit-content-for-moderation-step",
    )?.[1];
    aiScanContentStep = calls.find(
      (c: any) => c[0] === "ai-scan-content-step",
    )?.[1];
    reviewContentStep = calls.find(
      (c: any) => c[0] === "review-content-decision-step",
    )?.[1];
    publishContentStep = calls.find(
      (c: any) => c[0] === "publish-or-reject-content-step",
    )?.[1];
  });

  it("should submit content for moderation", async () => {
    const result = await submitContentStep(
      {
        contentId: "c_1",
        contentType: "review",
        content: "Great!",
        authorId: "a_1",
        tenantId: "t1",
      },
      { container: mockContainer() },
    );
    expect(result.submission.status).toBe("pending_review");
  });

  it("should scan content with AI and return low scores", async () => {
    const result = await aiScanContentStep(
      { content: "This is a normal review", contentId: "c_1" },
      { container: mockContainer() },
    );
    expect(result.scanResult.flagged).toBe(false);
    expect(result.scanResult.spam_score).toBeLessThan(0.5);
  });

  it("should auto-approve when not flagged", async () => {
    const result = await reviewContentStep(
      { contentId: "c_1", scanResult: { flagged: false } },
      { container: mockContainer() },
    );
    expect(result.decision.approved).toBe(true);
    expect(result.decision.reason).toBe("auto_approved");
  });

  it("should flag for review when flagged", async () => {
    const result = await reviewContentStep(
      { contentId: "c_1", scanResult: { flagged: true } },
      { container: mockContainer() },
    );
    expect(result.decision.approved).toBe(false);
    expect(result.decision.reason).toBe("flagged_for_review");
  });

  it("should publish approved content", async () => {
    const result = await publishContentStep(
      { contentId: "c_1", approved: true },
      { container: mockContainer() },
    );
    expect(result.result.status).toBe("published");
  });

  it("should reject disapproved content", async () => {
    const result = await publishContentStep(
      { contentId: "c_1", approved: false },
      { container: mockContainer() },
    );
    expect(result.result.status).toBe("rejected");
    expect(result.result.published_at).toBeNull();
  });
});
