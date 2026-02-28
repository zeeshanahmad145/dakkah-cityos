import { GET as listVendors, POST as createVendor } from "../../../src/api/admin/vendors/route"
import { GET as listBookings, POST as createBooking } from "../../../src/api/admin/bookings/route"
import { GET as listSubscriptions, POST as createSubscription } from "../../../src/api/admin/subscriptions/route"
import { GET as listTenants, POST as createTenant } from "../../../src/api/admin/tenants/route"
import { GET as listCommissionTiers, POST as createCommissionTier } from "../../../src/api/admin/commissions/tiers/route"

jest.mock("../../../src/workflows/vendor/create-vendor-workflow", () => ({
  createVendorWorkflow: jest.fn(() => ({
    run: jest.fn(),
  })),
}))

jest.mock("../../../src/workflows/subscription/create-subscription-workflow", () => ({
  createSubscriptionWorkflow: jest.fn(() => ({
    run: jest.fn(),
  })),
}))

const createRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  return res
}

describe("Admin Vendors Routes", () => {
  const createMockVendorService = () => ({
    listVendors: jest.fn(),
  })

  const createReq = (mockService: any, overrides: any = {}) => ({
    scope: { resolve: jest.fn(() => mockService) },
    query: {},
    params: {},
    body: {},
    cityosContext: { tenantId: "tenant_1", storeId: "store_1" },
    ...overrides,
  } as any)

  describe("GET /admin/vendors", () => {
    it("should list vendors with tenant context", async () => {
      const mockService = createMockVendorService()
      const vendors = [{ id: "vnd_1", name: "Vendor A" }]
      mockService.listVendors.mockResolvedValue(vendors)
      const req = createReq(mockService)
      const res = createRes()

      await listVendors(req, res)

      expect(mockService.listVendors).toHaveBeenCalledWith(
        { tenant_id: "tenant_1", store_id: "store_1" },
        { skip: 0, take: 20 }
      )
      expect(res.json).toHaveBeenCalledWith({
        vendors,
        count: 1,
        limit: 20,
        offset: 0,
      })
    })

    it("should parse custom limit and offset", async () => {
      const mockService = createMockVendorService()
      mockService.listVendors.mockResolvedValue([])
      const req = createReq(mockService, { query: { limit: "5", offset: "10" } })
      const res = createRes()

      await listVendors(req, res)

      expect(mockService.listVendors).toHaveBeenCalledWith(
        expect.any(Object),
        { skip: 10, take: 5 }
      )
    })

    it("should return 403 without tenant context", async () => {
      const mockService = createMockVendorService()
      const req = createReq(mockService, { cityosContext: undefined })
      const res = createRes()

      await listVendors(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: "Tenant context required" })
    })
  })

  describe("POST /admin/vendors", () => {
    it("should return 403 without tenant context", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: { handle: "test", businessName: "Test", legalName: "Test LLC", email: "t@t.com", address: { line1: "123", city: "NY", postalCode: "10001", countryCode: "US" } },
        cityosContext: undefined,
      } as any
      const res = createRes()

      await createVendor(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it("should return 400 for invalid body", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: { handle: "a" },
        cityosContext: { tenantId: "tenant_1" },
      } as any
      const res = createRes()

      await createVendor(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation failed" }))
    })

    it("should create vendor with valid body via workflow", async () => {
      const { createVendorWorkflow } = require("../../../src/workflows/vendor/create-vendor-workflow")
      const mockRun = jest.fn().mockResolvedValue({ result: { vendor: { id: "vnd_new" } } })
      ;(createVendorWorkflow as jest.Mock).mockReturnValue({ run: mockRun })

      const validBody = {
        handle: "test-vendor",
        businessName: "Test Business",
        legalName: "Test Business LLC",
        email: "vendor@test.com",
        address: { line1: "123 Main St", city: "New York", postalCode: "10001", countryCode: "US" },
      }
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: validBody,
        cityosContext: { tenantId: "tenant_1", storeId: "store_1" },
      } as any
      const res = createRes()

      await createVendor(req, res)

      expect(createVendorWorkflow).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ vendor: { id: "vnd_new" } })
    })
  })
})

describe("Admin Bookings Routes", () => {
  const createMockQuery = () => ({
    graph: jest.fn(),
  })

  const createMockBookingService = () => ({
    createBookings: jest.fn(),
  })

  describe("GET /admin/bookings", () => {
    it("should list bookings with default pagination", async () => {
      const mockQuery = createMockQuery()
      const bookings = [{ id: "book_1" }]
      mockQuery.graph.mockResolvedValue({ data: bookings, metadata: { count: 1 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listBookings(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "booking",
          pagination: { skip: 0, take: 20 },
        })
      )
      expect(res.json).toHaveBeenCalledWith({
        bookings,
        count: 1,
        offset: 0,
        limit: 20,
      })
    })

    it("should apply status filter", async () => {
      const mockQuery = createMockQuery()
      mockQuery.graph.mockResolvedValue({ data: [], metadata: { count: 0 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { status: "confirmed" },
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listBookings(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ status: "confirmed" }),
        })
      )
    })

    it("should apply provider_id filter", async () => {
      const mockQuery = createMockQuery()
      mockQuery.graph.mockResolvedValue({ data: [], metadata: { count: 0 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { provider_id: "prov_1" },
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listBookings(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ provider_id: "prov_1" }),
        })
      )
    })

    it("should apply date range filters", async () => {
      const mockQuery = createMockQuery()
      mockQuery.graph.mockResolvedValue({ data: [], metadata: { count: 0 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { from: "2025-01-01", to: "2025-12-31" },
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listBookings(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            starts_at: { $gte: "2025-01-01" },
            ends_at: { $lte: "2025-12-31" },
          }),
        })
      )
    })
  })

  describe("POST /admin/bookings", () => {
    it("should create a booking and return 201", async () => {
      const mockService = createMockBookingService()
      const booking = { id: "book_new" }
      mockService.createBookings.mockResolvedValue(booking)
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: {},
        body: { customer_id: "cust_1", provider_id: "prov_1" },
      } as any
      const res = createRes()

      await createBooking(req, res)

      expect(mockService.createBookings).toHaveBeenCalledWith({ customer_id: "cust_1", provider_id: "prov_1" })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ booking })
    })
  })
})

describe("Admin Subscriptions Routes", () => {
  const createMockSubService = () => ({
    listSubscriptions: jest.fn(),
  })

  describe("GET /admin/subscriptions", () => {
    it("should list subscriptions with default pagination", async () => {
      const mockService = createMockSubService()
      const subscriptions = [{ id: "sub_1" }]
      mockService.listSubscriptions.mockResolvedValue(subscriptions)
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: {},
        body: {},
        tenant: { id: "tenant_1" },
      } as any
      const res = createRes()

      await listSubscriptions(req, res)

      expect(mockService.listSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: "tenant_1" }),
        expect.objectContaining({ skip: 0, take: 20 })
      )
      expect(res.json).toHaveBeenCalledWith({
        subscriptions,
        count: 1,
        offset: 0,
        limit: 20,
      })
    })

    it("should apply status filter", async () => {
      const mockService = createMockSubService()
      mockService.listSubscriptions.mockResolvedValue([])
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: { status: "active" },
        params: {},
        body: {},
        tenant: { id: "tenant_1" },
      } as any
      const res = createRes()

      await listSubscriptions(req, res)

      expect(mockService.listSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
        expect.any(Object)
      )
    })

    it("should apply customer_id filter", async () => {
      const mockService = createMockSubService()
      mockService.listSubscriptions.mockResolvedValue([])
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: { customer_id: "cust_1" },
        params: {},
        body: {},
        tenant: { id: "tenant_1" },
      } as any
      const res = createRes()

      await listSubscriptions(req, res)

      expect(mockService.listSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: "cust_1" }),
        expect.any(Object)
      )
    })

    it("should handle no tenant context", async () => {
      const mockService = createMockSubService()
      mockService.listSubscriptions.mockResolvedValue([])
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listSubscriptions(req, res)

      expect(mockService.listSubscriptions).toHaveBeenCalled()
    })
  })

  describe("POST /admin/subscriptions", () => {
    it("should reject invalid body with zod error", async () => {
      const req = {
        scope: { resolve: jest.fn() },
        query: {},
        params: {},
        body: {},
        tenant: { id: "tenant_1" },
      } as any
      const res = createRes()

      await expect(createSubscription(req, res)).rejects.toThrow()
    })
  })
})

describe("Admin Tenants Routes", () => {
  const createMockQuery = () => ({
    graph: jest.fn(),
  })

  const createMockTenantService = () => ({
    createTenants: jest.fn(),
  })

  describe("GET /admin/tenants", () => {
    it("should list tenants with default pagination", async () => {
      const mockQuery = createMockQuery()
      const tenants = [{ id: "ten_1", name: "Main Tenant" }]
      mockQuery.graph.mockResolvedValue({ data: tenants, metadata: { count: 1 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listTenants(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "tenant",
          pagination: { skip: 0, take: 20 },
        })
      )
      expect(res.json).toHaveBeenCalledWith({
        tenants,
        count: 1,
        offset: 0,
        limit: 20,
      })
    })

    it("should apply status filter", async () => {
      const mockQuery = createMockQuery()
      mockQuery.graph.mockResolvedValue({ data: [], metadata: { count: 0 } })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: { status: "active" },
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listTenants(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ status: "active" }),
        })
      )
    })

    it("should fallback to data length when no metadata count", async () => {
      const mockQuery = createMockQuery()
      const tenants = [{ id: "ten_1" }, { id: "ten_2" }]
      mockQuery.graph.mockResolvedValue({ data: tenants, metadata: {} })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listTenants(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 2 })
      )
    })
  })

  describe("POST /admin/tenants", () => {
    it("should create a tenant and return 201", async () => {
      const mockService = createMockTenantService()
      const tenant = { id: "ten_new", name: "New Tenant" }
      mockService.createTenants.mockResolvedValue(tenant)
      const req = {
        scope: { resolve: jest.fn(() => mockService) },
        query: {},
        params: {},
        body: { name: "New Tenant", slug: "new-tenant" },
      } as any
      const res = createRes()

      await createTenant(req, res)

      expect(mockService.createTenants).toHaveBeenCalledWith({ name: "New Tenant", slug: "new-tenant" })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ tenant })
    })
  })
})

describe("Admin Commission Tiers Routes", () => {
  const createMockQuery = () => ({
    graph: jest.fn(),
  })

  const createMockCommissionService = () => ({
    createCommissionTiers: jest.fn(),
  })

  describe("GET /admin/commissions/tiers", () => {
    it("should list commission tiers", async () => {
      const mockQuery = createMockQuery()
      const tiers = [{ id: "tier_1", name: "Basic", rate: 10 }]
      mockQuery.graph.mockResolvedValue({ data: tiers })
      const req = {
        scope: { resolve: jest.fn(() => mockQuery) },
        query: {},
        params: {},
        body: {},
      } as any
      const res = createRes()

      await listCommissionTiers(req, res)

      expect(mockQuery.graph).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "commission_tier",
          filters: {},
        })
      )
      expect(res.json).toHaveBeenCalledWith({ tiers })
    })
  })

  describe("POST /admin/commissions/tiers", () => {
    it("should create a commission tier and return 201", async () => {
      const mockQuery = createMockQuery()
      const mockService = createMockCommissionService()
      mockQuery.graph.mockResolvedValue({ data: [] })
      const tier = { id: "tier_new", name: "Premium", rate: 15 }
      mockService.createCommissionTiers.mockResolvedValue(tier)

      let callCount = 0
      const req = {
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "commissionModuleService") return mockService
            return mockQuery
          }),
        },
        query: {},
        params: {},
        body: { name: "Premium", min_revenue: 1000, max_revenue: 5000, rate: 15 },
      } as any
      const res = createRes()

      await createCommissionTier(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ tier })
    })

    it("should reject rate below 0", async () => {
      const mockQuery = createMockQuery()
      const req = {
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "commissionModuleService") return {}
            return mockQuery
          }),
        },
        query: {},
        params: {},
        body: { name: "Bad", min_revenue: 0, rate: -5 },
      } as any
      const res = createRes()

      await createCommissionTier(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: "Rate must be between 0 and 100" })
    })

    it("should reject rate above 100", async () => {
      const mockQuery = createMockQuery()
      const req = {
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "commissionModuleService") return {}
            return mockQuery
          }),
        },
        query: {},
        params: {},
        body: { name: "Bad", min_revenue: 0, rate: 150 },
      } as any
      const res = createRes()

      await createCommissionTier(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: "Rate must be between 0 and 100" })
    })

    it("should reject overlapping revenue ranges", async () => {
      const mockQuery = createMockQuery()
      const mockService = createMockCommissionService()
      mockQuery.graph.mockResolvedValue({
        data: [{ id: "tier_1", min_revenue: 0, max_revenue: 1000 }],
      })

      const req = {
        scope: {
          resolve: jest.fn((name: string) => {
            if (name === "commissionModuleService") return mockService
            return mockQuery
          }),
        },
        query: {},
        params: {},
        body: { name: "Overlap", min_revenue: 500, max_revenue: 1500, rate: 10 },
      } as any
      const res = createRes()

      await createCommissionTier(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: "Revenue range overlaps with existing tier" })
    })
  })
})
