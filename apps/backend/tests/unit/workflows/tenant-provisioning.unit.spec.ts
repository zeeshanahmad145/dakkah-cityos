import { vi } from "vitest";
vi.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: vi.fn((config, fn) => {
    return { run: vi.fn(), config, fn }
  }),
  createStep: vi.fn((_name, fn) => fn),
  StepResponse: class { constructor(data) { Object.assign(this, data); } },
  WorkflowResponse: vi.fn((data) => data),
}))

const mockContainer = (overrides: Record<string, any> = {}) => ({
  resolve: vi.fn((name: string) => overrides[name] || {}),
})

describe("Tenant Provisioning Workflow", () => {
  let createTenantStep: any
  let provisionResourcesStep: any
  let seedTenantDataStep: any
  let configureTenantStep: any

  beforeAll(async () => {
    await import("../../../src/workflows/tenant-provisioning.js")
    const { createStep } = (await import("@medusajs/framework/workflows-sdk"))
    const calls = createStep.mock.calls
    createTenantStep = calls.find((c: any) => c[0] === "create-tenant-record-step")?.[1]
    provisionResourcesStep = calls.find((c: any) => c[0] === "provision-tenant-resources-step")?.[1]
    seedTenantDataStep = calls.find((c: any) => c[0] === "seed-tenant-data-step")?.[1]
    configureTenantStep = calls.find((c: any) => c[0] === "configure-tenant-step")?.[1]
  })

  describe("createTenantStep", () => {
    it("should create a tenant with provisioning status", async () => {
      const createTenants = vi.fn().mockResolvedValue({ id: "tenant_1" })
      const container = mockContainer({ tenant: { createTenants } })
      const input = {
        name: "Acme Corp",
        domain: "acme.com",
        adminEmail: "admin@acme.com",
        plan: "business",
        region: "us-east",
      }
      const result = await createTenantStep(input, { container })
      expect(result.tenant.id).toBe("tenant_1")
      expect(createTenants).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Acme Corp", status: "provisioning" })
      )
    })

    it("should pass domain and admin_email to tenant module", async () => {
      const createTenants = vi.fn().mockResolvedValue({ id: "tenant_2" })
      const container = mockContainer({ tenant: { createTenants } })
      await createTenantStep(
        { name: "Test", domain: "test.io", adminEmail: "a@b.com", plan: "free", region: "eu" },
        { container }
      )
      expect(createTenants).toHaveBeenCalledWith(
        expect.objectContaining({ domain: "test.io", admin_email: "a@b.com" })
      )
    })
  })

  describe("provisionResourcesStep", () => {
    it("should provision resources with default currency", async () => {
      const createStoreConfig = vi.fn().mockResolvedValue({ id: "store_1" })
      const createRoles = vi.fn().mockImplementation((role) => Promise.resolve(role))
      const container = mockContainer({ tenant: { createStoreConfig, createRoles } })
      const result = await provisionResourcesStep(
        { tenantId: "tenant_1", region: "us-east", name: "Acme", domain: "acme.com" },
        { container }
      )
      expect(result.resources.tenant_id).toBe("tenant_1")
      expect(result.resources.region_config.currency).toBe("usd")
      expect(result.resources.database_provisioned).toBe(true)
      expect(result.resources.storage_provisioned).toBe(true)
    })

    it("should use provided currency when specified", async () => {
      const container = mockContainer({ tenant: { createStoreConfig: vi.fn().mockResolvedValue({}), createRoles: vi.fn().mockResolvedValue({}) } })
      const result = await provisionResourcesStep(
        { tenantId: "tenant_1", region: "eu-west", currency: "eur", name: "Euro Shop", domain: "euro.com" },
        { container }
      )
      expect(result.resources.region_config.currency).toBe("eur")
    })

    it("should create default roles (owner, admin, manager, staff)", async () => {
      const createdRoles: any[] = []
      const createRoles = vi.fn().mockImplementation((role) => {
        createdRoles.push(role)
        return Promise.resolve(role)
      })
      const container = mockContainer({ tenant: { createRoles } })
      await provisionResourcesStep(
        { tenantId: "tenant_1", region: "us", name: "Test", domain: "t.com" },
        { container }
      )
      expect(createRoles).toHaveBeenCalledTimes(4)
      const roleNames = createdRoles.map((r) => r.name)
      expect(roleNames).toContain("owner")
      expect(roleNames).toContain("admin")
      expect(roleNames).toContain("manager")
      expect(roleNames).toContain("staff")
    })

    it("should handle missing createStoreConfig gracefully", async () => {
      const container = mockContainer({ tenant: {} })
      const result = await provisionResourcesStep(
        { tenantId: "tenant_1", region: "us", name: "Test", domain: "t.com" },
        { container }
      )
      expect(result.resources.store_config).toBeNull()
    })
  })

  describe("seedTenantDataStep", () => {
    it("should set enterprise plan defaults with unlimited products and staff", async () => {
      const createTenantSettings = vi.fn()
      const container = mockContainer({ tenant: { createTenantSettings } })
      const result = await seedTenantDataStep(
        { tenantId: "tenant_1", plan: "enterprise", features: ["multi_vendor"] },
        { container }
      )
      expect(result.seeded.default_settings.max_products).toBe(-1)
      expect(result.seeded.default_settings.max_staff).toBe(-1)
      expect(result.seeded.default_settings.multi_currency).toBe(true)
      expect(result.seeded.default_settings.analytics_enabled).toBe(true)
    })

    it("should set business plan defaults with higher limits", async () => {
      const container = mockContainer({ tenant: { createTenantSettings: vi.fn() } })
      const result = await seedTenantDataStep(
        { tenantId: "tenant_1", plan: "business" },
        { container }
      )
      expect(result.seeded.default_settings.max_products).toBe(10000)
      expect(result.seeded.default_settings.max_staff).toBe(50)
      expect(result.seeded.default_settings.multi_currency).toBe(true)
    })

    it("should set free plan defaults with restrictive limits", async () => {
      const container = mockContainer({ tenant: { createTenantSettings: vi.fn() } })
      const result = await seedTenantDataStep(
        { tenantId: "tenant_1", plan: "free" },
        { container }
      )
      expect(result.seeded.default_settings.max_products).toBe(100)
      expect(result.seeded.default_settings.max_staff).toBe(5)
      expect(result.seeded.default_settings.multi_currency).toBe(false)
      expect(result.seeded.default_settings.analytics_enabled).toBe(false)
    })

    it("should include enabled features in seeded data", async () => {
      const container = mockContainer({ tenant: { createTenantSettings: vi.fn() } })
      const result = await seedTenantDataStep(
        { tenantId: "tenant_1", plan: "business", features: ["loyalty", "subscriptions"] },
        { container }
      )
      expect(result.seeded.features_enabled).toEqual(["loyalty", "subscriptions"])
    })
  })

  describe("configureTenantStep", () => {
    it("should update tenant status to active", async () => {
      const updateTenants = vi.fn().mockResolvedValue({ id: "tenant_1", status: "active" })
      const container = mockContainer({ tenant: { updateTenants } })
      const result = await configureTenantStep(
        { tenantId: "tenant_1", domain: "acme.com", plan: "business" },
        { container }
      )
      expect(result.tenant.status).toBe("active")
      expect(updateTenants).toHaveBeenCalledWith(
        expect.objectContaining({ id: "tenant_1", status: "active" })
      )
    })

    it("should include configured_at timestamp", async () => {
      const updateTenants = vi.fn().mockResolvedValue({ id: "tenant_1", status: "active" })
      const container = mockContainer({ tenant: { updateTenants } })
      await configureTenantStep(
        { tenantId: "tenant_1", domain: "x.com", plan: "free" },
        { container }
      )
      expect(updateTenants).toHaveBeenCalledWith(
        expect.objectContaining({ configured_at: expect.any(Date) })
      )
    })
  })
})
