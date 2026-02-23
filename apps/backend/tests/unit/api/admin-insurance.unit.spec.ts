jest.mock("../../../src/lib/api-error-handler", () => ({
  handleApiError: jest.fn((res, error, context) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("not found") || message.includes("Not found")) {
      return res.status(404).json({ message: `${context}: not found` })
    }
    return res.status(500).json({ message: `${context} failed` })
  }),
}))

import { GET, POST } from "../../../src/api/admin/insurance/route"
import {
  GET as GET_ID,
  POST as POST_ID,
  DELETE as DELETE_ID,
} from "../../../src/api/admin/insurance/[id]/route"
import { GET as GET_CLAIMS } from "../../../src/api/admin/insurance/claims/route"

function makeMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  return res
}

describe("GET /admin/insurance", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = {
      listInsurancePolicies: jest.fn().mockResolvedValue([]),
      countInsurancePolicies: jest.fn().mockResolvedValue(0),
    }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("returns policies with count and pagination", async () => {
    const items = [{ id: "ins_1" }]
    mockModule.listInsurancePolicies.mockResolvedValue(items)
    mockModule.countInsurancePolicies.mockResolvedValue(1)
    await GET(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ items, count: 1, limit: 20, offset: 0 })
  })

  it("filters by status", async () => {
    mockReq.query = { status: "active" }
    await GET(mockReq, mockRes)
    expect(mockModule.listInsurancePolicies).toHaveBeenCalledWith(
      { status: "active" },
      expect.any(Object)
    )
  })

  it("applies custom pagination", async () => {
    mockReq.query = { limit: "5", offset: "10" }
    await GET(mockReq, mockRes)
    expect(mockModule.listInsurancePolicies).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ skip: 10, take: 5 })
    )
  })

  it("returns 500 on error", async () => {
    mockModule.listInsurancePolicies.mockRejectedValue(new Error("fail"))
    await GET(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("returns empty array for null result", async () => {
    mockModule.listInsurancePolicies.mockResolvedValue(null)
    mockModule.countInsurancePolicies.mockResolvedValue(0)
    await GET(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: [] })
    )
  })
})

describe("POST /admin/insurance", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { createPolicy: jest.fn().mockResolvedValue({ id: "ins_new" }) }
    mockReq = {
      body: {
        customer_id: "c1",
        type: "product",
        coverage_amount: 1000,
        premium_amount: 50,
        starts_at: "2025-01-01",
        expires_at: "2026-01-01",
      },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("creates policy with 201", async () => {
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({ item: { id: "ins_new" } })
  })

  it("returns 400 on missing coverage_amount", async () => {
    mockReq.body = { customer_id: "c1", premium_amount: 50, starts_at: "x", expires_at: "y" }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 on negative coverage_amount", async () => {
    mockReq.body = { ...mockReq.body, coverage_amount: -100 }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 on invalid type enum", async () => {
    mockReq.body = { ...mockReq.body, type: "invalid" }
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("maps fields correctly to createPolicy call", async () => {
    await POST(mockReq, mockRes)
    expect(mockModule.createPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "c1",
        planType: "product",
        coverageAmount: 1000,
        premium: 50,
      })
    )
  })

  it("returns 500 on service error", async () => {
    mockModule.createPolicy.mockRejectedValue(new Error("fail"))
    await POST(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})

describe("GET /admin/insurance/:id", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { listInsurancePlans: jest.fn() }
    mockReq = {
      params: { id: "ins_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("returns insurance plan by id", async () => {
    mockModule.listInsurancePlans.mockResolvedValue([{ id: "ins_1", name: "Basic" }])
    await GET_ID(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ item: { id: "ins_1", name: "Basic" } })
  })

  it("returns 404 when not found", async () => {
    mockModule.listInsurancePlans.mockResolvedValue([])
    await GET_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(404)
  })

  it("returns 500 on error", async () => {
    mockModule.listInsurancePlans.mockRejectedValue(new Error("fail"))
    await GET_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("queries with correct id filter", async () => {
    mockModule.listInsurancePlans.mockResolvedValue([{ id: "ins_1" }])
    await GET_ID(mockReq, mockRes)
    expect(mockModule.listInsurancePlans).toHaveBeenCalledWith({ id: "ins_1" }, { take: 1 })
  })
})

describe("POST /admin/insurance/:id (update)", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { updateInsurancePlans: jest.fn().mockResolvedValue({ id: "ins_1", name: "Updated" }) }
    mockReq = {
      params: { id: "ins_1" },
      body: { name: "Updated" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("updates plan successfully", async () => {
    await POST_ID(mockReq, mockRes)
    expect(mockModule.updateInsurancePlans).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ins_1", name: "Updated" })
    )
    expect(mockRes.json).toHaveBeenCalledWith({ item: { id: "ins_1", name: "Updated" } })
  })

  it("returns 400 on invalid status enum", async () => {
    mockReq.body = { status: "invalid" }
    await POST_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  it("returns 500 on service error", async () => {
    mockModule.updateInsurancePlans.mockRejectedValue(new Error("fail"))
    await POST_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("accepts partial update fields", async () => {
    mockReq.body = { coverage_amount: 2000, premium: 100 }
    await POST_ID(mockReq, mockRes)
    expect(mockModule.updateInsurancePlans).toHaveBeenCalledWith(
      expect.objectContaining({ coverage_amount: 2000, premium: 100 })
    )
  })
})

describe("DELETE /admin/insurance/:id", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { deleteInsurancePlans: jest.fn().mockResolvedValue(undefined) }
    mockReq = {
      params: { id: "ins_1" },
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("deletes plan and returns 204", async () => {
    await DELETE_ID(mockReq, mockRes)
    expect(mockModule.deleteInsurancePlans).toHaveBeenCalledWith(["ins_1"])
    expect(mockRes.status).toHaveBeenCalledWith(204)
  })

  it("returns 500 on error", async () => {
    mockModule.deleteInsurancePlans.mockRejectedValue(new Error("fail"))
    await DELETE_ID(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("resolves insurance module from scope", async () => {
    await DELETE_ID(mockReq, mockRes)
    expect(mockReq.scope.resolve).toHaveBeenCalledWith("insurance")
  })

  it("passes id as array to delete", async () => {
    mockReq.params.id = "ins_special"
    await DELETE_ID(mockReq, mockRes)
    expect(mockModule.deleteInsurancePlans).toHaveBeenCalledWith(["ins_special"])
  })
})

describe("GET /admin/insurance/claims", () => {
  let mockModule: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockModule = { listInsClaims: jest.fn().mockResolvedValue([]) }
    mockReq = {
      query: {},
      scope: { resolve: jest.fn().mockReturnValue(mockModule) },
    }
    mockRes = makeMockRes()
  })

  it("returns claims list with count", async () => {
    const claims = [{ id: "claim_1" }, { id: "claim_2" }]
    mockModule.listInsClaims.mockResolvedValue(claims)
    await GET_CLAIMS(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({
      claims,
      count: 2,
      limit: 20,
      offset: 0,
    })
  })

  it("filters by status", async () => {
    mockReq.query = { status: "pending" }
    await GET_CLAIMS(mockReq, mockRes)
    expect(mockModule.listInsClaims).toHaveBeenCalledWith(
      { status: "pending" },
      expect.any(Object)
    )
  })

  it("returns 500 on error", async () => {
    mockModule.listInsClaims.mockRejectedValue(new Error("fail"))
    await GET_CLAIMS(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it("wraps single claim in array", async () => {
    mockModule.listInsClaims.mockResolvedValue({ id: "claim_single" })
    await GET_CLAIMS(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ claims: [{ id: "claim_single" }] })
    )
  })
})
