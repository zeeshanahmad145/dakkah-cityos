import { vi } from "vitest";
vi.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: vi.fn((res, error, context) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("not found")) {
      return res.status(404).json({ message: `${context}: not found` })
    }
    return res.status(500).json({ message: `${context} failed` })
  }),
}))

import { GET, POST } from "../../../src/api/admin/subscriptions/route"
import {
  GET as GET_ID,
  POST as POST_ID,
  DELETE as DELETE_ID,
} from "../../../src/api/admin/subscriptions/[id]/route"
import { POST as PAUSE } from "../../../src/api/admin/subscriptions/[id]/pause/route"
import { POST as RESUME } from "../../../src/api/admin/subscriptions/[id]/resume/route"
import { POST as CHANGE_PLAN } from "../../../src/api/admin/subscriptions/[id]/change-plan/route"

function makeMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return res
}

describe("GET /admin/subscriptions", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listSubscriptions: vi.fn().mockResolvedValue([]) }
    mockReq = {
      query: {},
      scope: { resolve: vi.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("returns subscriptions with default pagination", async () => {
    const subs = [{ id: "sub_1" }]
    mockModule.listSubscriptions.mockResolvedValue(subs)
    await GET(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ subscriptions: subs, count: 1, limit: 20, offset: 0 })
  })

  it("applies tenant scoping", async () => {
    mockReq.cityosContext = { tenantId: "t1" }
    await GET(mockReq, mockRes)
    expect(mockModule.listSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "t1" }),
      expect.any(Object)
    )
  })

  it("filters by status, customer_id, plan_id", async () => {
    mockReq.query = { status: "active", customer_id: "c1", plan_id: "p1" }
    await GET(mockReq, mockRes)
    expect(mockModule.listSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active", customer_id: "c1", plan_id: "p1" }),
      expect.any(Object)
    )
  })

  it("returns 500 on error", async () => {
    mockModule.listSubscriptions.mockRejectedValue(new Error("fail"))
    await GET(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/subscriptions", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 createSubscriptions: vi.fn().mockResolvedValue({ id: "sub_new" }) }
    mockReq = {
      body: { customer_id: "c1", plan_id: "p1" },
      query: {},
      scope: { resolve: vi.fn().mockReturnValue(mockModule) },
      cityosContext: undefined,
    }
    mockRes = makeMockRes()
  })

  it("creates subscription with 201", async () => {
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({ subscription: { id: "sub_new" } })
  })

  it("returns 400 on missing fields", async () => {
    mockReq.body = { customer_id: "c1" }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 on extra fields (strict)", async () => {
    mockReq.body = { customer_id: "c1", plan_id: "p1", bad_field: true }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("defaults tenant_id to 'default'", async () => {
    await POST(mockReq, mockRes)
    expect(mockModule.createSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: "default" })
    )
  })
})

describe("GET /admin/subscriptions/:id", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 listSubscriptions: vi.fn() }
    mockReq = {
      params: { id: "sub_1" },
      scope: { resolve: vi.fn().mockReturnValue(mockModule) },
      tenant: { id: "t1" },
    }
    mockRes = makeMockRes()
  })

  it("returns subscription by id", async () => {
    mockModule.listSubscriptions.mockResolvedValue([{ id: "sub_1", tenant_id: "t1" }])
    await GET_ID(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ subscription: { id: "sub_1", tenant_id: "t1" } })
  })

  it("returns 403 without tenant context", async () => {
    mockReq.tenant = undefined
    await GET_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Tenant context required" })
  })

  it("returns 404 when not found", async () => {
    mockModule.listSubscriptions.mockResolvedValue([])
    await GET_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 404 when tenant_id mismatch", async () => {
    mockModule.listSubscriptions.mockResolvedValue([{ id: "sub_1", tenant_id: "other" }])
    await GET_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })
})

describe("DELETE /admin/subscriptions/:id", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockModule = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 

      listSubscriptions: vi.fn().mockResolvedValue([{ id: "sub_1", tenant_id: "t1" }]),
      updateSubscriptions: vi.fn().mockResolvedValue({}),
    }
    mockReq = {
      params: { id: "sub_1" },
      scope: { resolve: vi.fn().mockReturnValue(mockModule) },
      tenant: { id: "t1" },
    }
    mockRes = makeMockRes()
  })

  it("cancels subscription and returns deleted flag", async () => {
    await DELETE_ID(mockReq, mockRes)
    expect(mockModule.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sub_1", status: "canceled" })
    )
    expect(mockRes.json).toHaveBeenCalledWith({ id: "sub_1", deleted: true })
  })

  it("returns 403 without tenant context", async () => {
    mockReq.tenant = undefined
    await DELETE_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  it("returns 404 when subscription not found", async () => {
    mockModule.listSubscriptions.mockResolvedValue([])
    await DELETE_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 500 on service error", async () => {
    mockModule.updateSubscriptions.mockRejectedValue(new Error("fail"))
    await DELETE_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/subscriptions/:id/pause", () => {
  let mockQuery: any
  let mockService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = { graph: vi.fn() }
    mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 updateSubscriptions: vi.fn().mockResolvedValue({ id: "sub_1", status: "paused" }) }
    mockReq = {
      params: { id: "sub_1" },
      body: { reason: "vacation" },
      scope: {
        resolve: vi.fn((dep: string) => {
          if (dep === "query") return mockQuery
          return mockService
        }),
      },
    }
    mockRes = makeMockRes()
  })

  it("pauses an active subscription", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "active", metadata: {} }] })
    await PAUSE(mockReq, mockRes)
    expect(mockService.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paused" })
    )
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Subscription paused" })
    )
  })

  it("returns 404 when subscription not found", async () => {
    mockQuery.graph.mockResolvedValue({ data: [undefined] })
    await PAUSE(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 400 when subscription is not active", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "paused", metadata: {} }] })
    await PAUSE(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Can only pause active subscriptions" })
  })

  it("returns 500 on service error", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "active", metadata: {} }] })
    mockService.updateSubscriptions.mockRejectedValue(new Error("fail"))
    await PAUSE(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/subscriptions/:id/resume", () => {
  let mockQuery: any
  let mockService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = { graph: vi.fn() }
    mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 updateSubscriptions: vi.fn().mockResolvedValue({ id: "sub_1", status: "active" }) }
    mockReq = {
      params: { id: "sub_1" },
      body: {},
      scope: {
        resolve: vi.fn((dep: string) => {
          if (dep === "query") return mockQuery
          return mockService
        }),
      },
    }
    mockRes = makeMockRes()
  })

  it("resumes a paused subscription", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "paused", metadata: {} }] })
    await RESUME(mockReq, mockRes)
    expect(mockService.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" })
    )
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Subscription resumed" })
    )
  })

  it("returns 404 when subscription not found", async () => {
    mockQuery.graph.mockResolvedValue({ data: [undefined] })
    await RESUME(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 400 when subscription is not paused", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "active", metadata: {} }] })
    await RESUME(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Can only resume paused subscriptions" })
  })

  it("returns 500 on service error", async () => {
    mockQuery.graph.mockResolvedValue({ data: [{ id: "sub_1", status: "paused", metadata: {} }] })
    mockService.updateSubscriptions.mockRejectedValue(new Error("fail"))
    await RESUME(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("POST /admin/subscriptions/:id/change-plan", () => {
  let mockQuery: any
  let mockService: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = { graph: vi.fn() }
    mockService = {
      baseRepository: { serialize: vi.fn(), transaction: vi.fn() },
      __joinerConfig: vi.fn(),
      listInsuranceClaims: vi.fn().mockResolvedValue([]), updateInsuranceClaims: vi.fn().mockResolvedValue([]), deleteInsuranceClaims: vi.fn().mockResolvedValue([]), listInsurancePolicies: vi.fn().mockResolvedValue([]), countInsurancePolicies: vi.fn().mockResolvedValue([]), generateQuoteNumber: vi.fn().mockResolvedValue([]), listCommissions: vi.fn().mockResolvedValue([]), createCommissions: vi.fn().mockResolvedValue([]), createCommissionTiers: vi.fn().mockResolvedValue([]), updateSubscriptions: vi.fn().mockResolvedValue([]), markHelpful: vi.fn().mockResolvedValue([]), listCompanyUsers: vi.fn().mockResolvedValue([]), updateVendors: vi.fn().mockResolvedValue([]), updatePayouts: vi.fn().mockResolvedValue([]), updateTenantUsers: vi.fn().mockResolvedValue([]), updateBookings: vi.fn().mockResolvedValue([]), listClassSchedules: vi.fn().mockResolvedValue([]), listTrainerProfiles: vi.fn().mockResolvedValue([]), listCourses: vi.fn().mockResolvedValue([]), 
 updateSubscriptions: vi.fn().mockResolvedValue({ id: "sub_1", plan_id: "p2" }) }
    mockReq = {
      params: { id: "sub_1" },
      body: { new_plan_id: "p2" },
      scope: {
        resolve: vi.fn((dep: string) => {
          if (dep === "query") return mockQuery
          return mockService
        }),
      },
    }
    mockRes = makeMockRes()
  })

  it("changes plan for active subscription", async () => {
    mockQuery.graph
      .mockResolvedValueOnce({ data: [{ id: "sub_1", status: "active", plan_id: "p1", metadata: {}, amount: "10", billing_interval: "monthly" }] })
      .mockResolvedValueOnce({ data: [{ id: "p2", name: "Pro", price: "20" }] })
    await CHANGE_PLAN(mockReq, mockRes)
    expect(mockService.updateSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: "p2" })
    )
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Pro") })
    )
  })

  it("returns 400 on missing new_plan_id", async () => {
    mockReq.body = {}
    await CHANGE_PLAN(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 404 when subscription not found", async () => {
    mockQuery.graph.mockResolvedValueOnce({ data: [undefined] })
    await CHANGE_PLAN(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 400 when subscription is not active", async () => {
    mockQuery.graph.mockResolvedValueOnce({ data: [{ id: "sub_1", status: "canceled", metadata: {} }] })
    await CHANGE_PLAN(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Can only change plan for active subscriptions" })
  })

  it("returns 404 when new plan not found", async () => {
    mockQuery.graph
      .mockResolvedValueOnce({ data: [{ id: "sub_1", status: "active", metadata: {} }] })
      .mockResolvedValueOnce({ data: [undefined] })
    await CHANGE_PLAN(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })
})
